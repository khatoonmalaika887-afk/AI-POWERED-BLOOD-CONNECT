import Donor from "../models/donor.model.js";
import sendNotification from "../utils/notification.js";
import bcrypt from "bcryptjs";
// Get all donors
export const getDonors = async (req, res) => {
    try {
        const donors = await Donor.findAll({ attributes: { exclude: ['password'] } });
        res.json(donors);
    } catch (error) {
        res.status(500).json({ message: "Error fetching donors" });
    }
};

// Get a single donor by ID
export const getDonorById = async (req, res) => {
    try {
        const donor = await Donor.findByPk(req.params.id, { attributes: { exclude: ['password'] } });
        if (!donor) return res.status(404).json({ message: "Donor not found" });
        res.json(donor);
    } catch (error) {
        res.status(500).json({ message: "Error fetching donor" });
    }
};

// Create a new donor
export const createDonor = async (req, res) => {
    try {
        const {
            firstName,
            lastName,
            gender,
            phoneNumber,
            email,
            password,
            dob,
            bloodType,
            city,
            nic
        } = req.body;

        if (!firstName || !lastName || !gender || !phoneNumber || !email || !password || !dob || !bloodType || !city || !nic) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const image = req.file ? req.file.path : null;

        const hashedPassword = await bcrypt.hash(password, 10);

        const newDonor = await Donor.create({
            firstName,
            lastName,
            gender,
            phoneNumber,
            email,
            password: hashedPassword,
            dob,
            bloodType,
            city,
            nic,
            image,
        });

        const responseDonor = newDonor.toJSON();
        delete responseDonor.password;
        res.status(201).json(responseDonor);

    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            const field = Object.keys(error.fields)[0];
            return res.status(400).json({ message: `${field} already exists` });
        }
        res.status(400).json({ message: "Error creating donor" });
    }
};

// Update donor details
export const updateDonor = async (req, res) => {
    try {
        let { password, ...otherUpdates } = req.body;

        if (password) {
            password = await bcrypt.hash(password, 10);
            otherUpdates.password = password;
        }

        const image = req.file ? req.file.path : undefined;
        if (image) {
            otherUpdates.image = image;
        }

        const [affectedCount] = await Donor.update(
            otherUpdates,
            { where: { id: req.params.id } }
        );

        if (affectedCount === 0) return res.status(404).json({ message: "Donor not found" });

        const updatedDonor = await Donor.findByPk(req.params.id, { attributes: { exclude: ['password'] } });
        res.status(200).json(updatedDonor);
    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            const field = Object.keys(error.fields)[0];
            return res.status(400).json({ message: `${field} already exists` });
        }
        res.status(500).json({ message: "Error updating donor" });
    }
};

// Delete a donor
export const deleteDonor = async (req, res) => {
    try {
        const deletedCount = await Donor.destroy({ where: { id: req.params.id } });
        if (deletedCount === 0) return res.status(404).json({ message: "Donor not found" });

        res.json({ message: "Donor deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting donor" });
    }
};

// Update health status
export const updateHealthStatus = async (req, res) => {
    try {
        let { healthStatus } = req.body;
        healthStatus = healthStatus === "true" || healthStatus === true;

        const [affectedCount] = await Donor.update(
            { healthStatus },
            { where: { id: req.params.id } }
        );

        if (affectedCount === 0) return res.status(404).json({ message: "Donor not found" });

        const updatedDonor = await Donor.findByPk(req.params.id, { attributes: { exclude: ['password'] } });
        res.status(200).json(updatedDonor);
    } catch (error) {
        res.status(500).json({ message: "Error updating health status" });
    }
};

// Update appointment status
export const updateAppointmentStatus = async (req, res) => {
    try {
        let { appointmentStatus } = req.body;
        appointmentStatus = appointmentStatus === "true" || appointmentStatus === true;

        const [affectedCount] = await Donor.update(
            { appointmentStatus },
            { where: { id: req.params.id } }
        );

        if (affectedCount === 0) return res.status(404).json({ message: "Donor not found" });

        const updatedDonor = await Donor.findByPk(req.params.id, { attributes: { exclude: ['password'] } });
        res.status(200).json(updatedDonor);
    } catch (error) {
        res.status(500).json({ message: "Error updating appointment status" });
    }
};

// Activate/Deactivate donor status
export const activateDeactivateDonor = async (req, res) => {
    try {
        const { id } = req.params;

        const donor = await Donor.findByPk(id);
        if (!donor) {
            return res.status(404).json({ message: "Donor not found" });
        }

        const newStatus = !donor.activeStatus;
        await Donor.update(
            { activeStatus: newStatus },
            { where: { id } }
        );

        const updatedDonor = await Donor.findByPk(id, { attributes: { exclude: ['password'] } });
        res.status(200).json({
            message: `Donor ${newStatus ? 'activated' : 'deactivated'} successfully`,
            donor: updatedDonor,
        });
    } catch (error) {
        res.status(500).json({ message: "Error toggling donor status" });
    }
};

// Get donor donation history
export const getDonorDonationHistory = async (req, res) => {
    try {
        const donorId = req.params.id;
        const donor = await Donor.findByPk(donorId);

        if (!donor) {
            return res.status(404).json({ message: "Donor not found" });
        }

        res.json({
            totalDonations: donor.totalDonations,
            lastDonationDate: donor.lastDonationDate,
            donationHistory: donor.donationHistory
        });
    } catch (error) {
        res.status(500).json({ message: "Error fetching donation history" });
    }
};

// Update donation history after successful donation
export const updateDonationHistory = async (donorId, donationDetails) => {
    try {
        const donor = await Donor.findByPk(donorId);
        if (!donor) return;

        const newDonation = {
            date: new Date().toISOString().split('T')[0],
            ...donationDetails
        };

        const updatedHistory = [...donor.donationHistory, newDonation];

        await Donor.update(
            {
                donationHistory: updatedHistory,
                totalDonations: donor.totalDonations + 1,
                lastDonationDate: newDonation.date
            },
            { where: { id: donorId } }
        );

        // Update gamification
        const { updateGamificationAfterDonation } = await import('./gamification.controller.js');
        await updateGamificationAfterDonation(donorId);

        return { ...donor.toJSON(), donationHistory: updatedHistory, totalDonations: donor.totalDonations + 1, lastDonationDate: newDonation.date };
    } catch (error) {
        console.error('Error updating donation history:', error);
        throw error;
    }
};

// Toggle emergency notifications
export const toggleEmergencyNotifications = async (req, res) => {
    try {
        const donorId = req.params.id;
        const donor = await Donor.findByPk(donorId);

        if (!donor) {
            return res.status(404).json({ message: "Donor not found" });
        }

        const newStatus = !donor.emergencyNotificationsEnabled;
        await Donor.update(
            { emergencyNotificationsEnabled: newStatus },
            { where: { id: donorId } }
        );

        res.json({
            message: `Emergency notifications ${newStatus ? 'enabled' : 'disabled'}`,
            emergencyNotificationsEnabled: newStatus
        });
    } catch (error) {
        res.status(500).json({ message: "Error toggling emergency notifications" });
    }
};
