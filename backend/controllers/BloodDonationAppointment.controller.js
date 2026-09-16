import BloodDonationAppointment from "../models/BloodDonationAppointment.model.js";
import Donor from "../models/donor.model.js";
import Hospital from "../models/hospital.model.js";
import HospitalAdmin from "../models/HospitalAdmin.model.js";
import BloodInventory from "../models/BloodInventory.model.js";
import sendNotification from "../utils/notification.js";
import { updateDonationHistory } from "./donor.controller.js";

// Get all blood donation appointments
export const getAppointments = async (req, res) => {
    try {
        const appointments = await BloodDonationAppointment.findAll({
            include: [
                { model: Hospital, as: 'hospital', attributes: ['name'] },
                { model: Donor, as: 'donor', attributes: ['firstName', 'lastName'] },
                { model: HospitalAdmin, as: 'hospitalAdmin', attributes: ['firstName', 'lastName'] },
            ],
        });
        res.json(appointments);
    } catch (error) {
        res.status(500).json({ message: "Error fetching appointments" });
    }
};

// Get a single blood donation appointment by ID
export const getAppointmentById = async (req, res) => {
    try {
        const appointment = await BloodDonationAppointment.findByPk(req.params.id);
        if (!appointment) return res.status(404).json({ message: "Appointment not found" });
        res.json(appointment);
    } catch (error) {
        res.status(500).json({ message: "Error fetching appointment" });
    }
};

export const createAppointment = async (req, res) => {
    try {
        const { hospitalId, donorId, appointmentDate, appointmentTime } = req.body;

        // Validate required fields
        if (!hospitalId || !donorId || !appointmentDate || !appointmentTime) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Validate donor exists
        const donor = await Donor.findByPk(donorId);
        if (!donor) {
            return res.status(404).json({ message: 'Donor not found' });
        }

        // Validate hospital exists
        const hospital = await Hospital.findByPk(hospitalId);
        if (!hospital) {
            return res.status(404).json({ message: 'Hospital not found' });
        }

        // Create new appointment
        const newAppointment = await BloodDonationAppointment.create({
            progressStatus: 'Not Started',
            donorId,
            hospitalId,
            appointmentDate,
            appointmentTime,
        });

        // Update donor's appointment status
        await Donor.update({ appointmentStatus: true }, { where: { id: donorId } });

        // Construct notification message
        const message = `Dear ${donor.firstName || 'Donor'} ${donor.lastName || ''}, your session has been booked at ${hospital.name || 'Hospital'} on ${appointmentDate} at ${appointmentTime}.`;

        // Call sendNotification
        const result = await sendNotification({
            userId: donorId,
            userType: 'Donor',
            subject: 'Appointment Confirmation',
            message,
            channels: ['email'], // Email only, since Twilio is disabled
            attachments: [],
        });

        // Handle notification result
        if (result.success) {
            return res.status(201).json({
                success: true,
                message: 'Appointment created and notification sent',
                appointment: newAppointment,
                notification: result.results,
            });
        } else {
            return res.status(500).json({
                success: false,
                message: 'Appointment created but notification failed',
                notificationError: result.error,
            });
        }
    } catch (error) {
        console.error('Error creating appointment:', error);
        return res.status(500).json({
            success: false,
            message: 'Error creating appointment',
            error: error.message,
        });
    }
};
// Update Date and Time of appointment
export const updateAppointmentDateTime = async (req, res) => {
    try {
        const { appointmentDate, appointmentTime, hospitalAdminId } = req.body;
        const [affectedCount] = await BloodDonationAppointment.update(
            {
                appointmentDate,
                appointmentTime,
                activeStatus: "Re-Scheduled",
                hospitalAdminId
            },
            { where: { id: req.params.id } }
        );

        if (affectedCount === 0) return res.status(404).json({ message: "Appointment not found" });

        const updatedAppointment = await BloodDonationAppointment.findByPk(req.params.id);
        res.status(200).json(updatedAppointment);
    } catch (error) {
        res.status(500).json({ message: "Error updating appointment date and time" });
    }
};

// Cancel an Appointment
export const cancelAppointment = async (req, res) => {
    try {
        const { hospitalAdminId } = req.body;
        const [affectedCount] = await BloodDonationAppointment.update(
            {
                activeStatus: "Cancelled",
                progressStatus: "Cancelled",
                hospitalAdminId
            },
            { where: { id: req.params.id } }
        );

        if (affectedCount === 0) return res.status(404).json({ message: "Appointment not found" });

        const canceledAppointment = await BloodDonationAppointment.findByPk(req.params.id);
        res.status(200).json(canceledAppointment);
    } catch (error) {
        res.status(500).json({ message: "Error cancelling appointment" });
    }
};

// Accept an Appointment
export const acceptAppointment = async (req, res) => {
    try {
        const { hospitalAdminId } = req.body;
        const [affectedCount] = await BloodDonationAppointment.update(
            {
                activeStatus: "Accepted",
                hospitalAdminId
            },
            { where: { id: req.params.id } }
        );

        if (affectedCount === 0) return res.status(404).json({ message: "Appointment not found" });

        const acceptedAppointment = await BloodDonationAppointment.findByPk(req.params.id);
        res.status(200).json(acceptedAppointment);
    } catch (error) {
        res.status(500).json({ message: "Error accepting appointment" });
    }
};

// Arrived for an Appointment
export const arrivedForAppointment = async (req, res) => {
    try {
        const { receiptNumber } = req.body;
        const [affectedCount] = await BloodDonationAppointment.update(
            {
                receiptNumber,
                progressStatus: "In Progress"
            },
            { where: { id: req.params.id } }
        );

        if (affectedCount === 0) return res.status(404).json({ message: "Appointment not found" });

        const arrivedAppointment = await BloodDonationAppointment.findByPk(req.params.id);
        res.status(200).json(arrivedAppointment);
    } catch (error) {
        res.status(500).json({ message: "Error marking appointment as arrived" });
    }
};

// Complete a blood donation appointment - this is the actual "donation happened"
// event: records the donor's donation history/gamification and credits the
// hospital's blood inventory with the units collected.
export const completeAppointment = async (req, res) => {
    try {
        const appointment = await BloodDonationAppointment.findByPk(req.params.id);
        if (!appointment) {
            return res.status(404).json({ message: "Appointment not found" });
        }

        // Guard against double-processing (e.g. a duplicate click) recording the
        // donation twice or crediting inventory twice for the same appointment.
        if (appointment.progressStatus === "Completed") {
            return res.status(200).json(appointment);
        }

        const units = parseInt(req.body?.units, 10) > 0 ? parseInt(req.body.units, 10) : 1;

        await appointment.update({ progressStatus: "Completed" });

        const [donor, hospital] = await Promise.all([
            Donor.findByPk(appointment.donorId),
            Hospital.findByPk(appointment.hospitalId),
        ]);

        if (donor) {
            await updateDonationHistory(appointment.donorId, {
                bloodType: donor.bloodType,
                units,
                hospitalName: hospital?.name || "Unknown Hospital",
            });
        }

        if (donor?.bloodType && appointment.hospitalId) {
            const expirationDate = new Date();
            expirationDate.setDate(expirationDate.getDate() + 42);
            await BloodInventory.create({
                hospitalId: appointment.hospitalId,
                bloodType: donor.bloodType,
                availableStocks: units,
                expirationDate,
            });
        }

        const completedAppointment = await BloodDonationAppointment.findByPk(req.params.id);
        res.status(200).json(completedAppointment);
    } catch (error) {
        console.error("Error completing appointment:", error);
        res.status(500).json({ message: "Error completing appointment" });
    }
};

// Delete a blood donation appointment
export const deleteAppointment = async (req, res) => {
    try {
        const deletedCount = await BloodDonationAppointment.destroy({ where: { id: req.params.id } });
        if (deletedCount === 0) return res.status(404).json({ message: "Appointment not found" });

        res.json({ message: "Appointment deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting appointment" });
    }
};

// Get blood donation appointments by donor ID
export const getBloodDonationAppointmentByDonorId = async (req, res) => {
    try {
        const { id } = req.params;
        const appointments = await BloodDonationAppointment.findAll({
            where: { donorId: id },
            include: [
                { model: Hospital, as: 'hospital', attributes: ['name'] },
                { model: HospitalAdmin, as: 'hospitalAdmin', attributes: ['firstName', 'lastName'] },
            ],
        });
        if (!appointments || appointments.length === 0) return res.status(404).json({ message: "Appointments not found" });
        res.json(appointments);
    } catch (error) {
        res.status(500).json({ message: "Error fetching appointments" });
    }
};

// Get blood donation appointments by hospital ID
export const getBloodDonationAppointmentByHospitalId = async (req, res) => {
    try {
        const { id } = req.params;
        const appointments = await BloodDonationAppointment.findAll({
            where: { hospitalId: id },
            include: [
                { model: Hospital, as: 'hospital', attributes: ['name'] },
                { model: Donor, as: 'donor', attributes: ['firstName', 'lastName'] },
                { model: HospitalAdmin, as: 'hospitalAdmin', attributes: ['firstName', 'lastName'] },
            ],
        });
        if (!appointments || appointments.length === 0) return res.status(404).json({ message: "Appointments not found" });
        res.json(appointments);
    } catch (error) {
        res.status(500).json({ message: "Error fetching appointments" });
    }
};

// Cancel appointment by donor
export const cancelAppointmentDonor = async (req, res) => {
    try {
        const [affectedCount] = await BloodDonationAppointment.update(
            {
                activeStatus: "Cancelled",
                progressStatus: "Cancelled"
            },
            { where: { id: req.params.id } }
        );

        if (affectedCount === 0) return res.status(404).json({ message: "Appointment not found" });

        const canceledAppointment = await BloodDonationAppointment.findByPk(req.params.id);
        res.status(200).json(canceledAppointment);
    } catch (error) {
        res.status(500).json({ message: "Error cancelling appointment" });
    }
};
