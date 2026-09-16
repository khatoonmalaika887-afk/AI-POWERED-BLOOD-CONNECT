import BloodRequest from "../models/bloodRequest.model.js";
import Hospital from "../models/hospital.model.js";
import Donor from "../models/donor.model.js";
import Receiver from "../models/receiver.model.js";
import BloodInventory from "../models/BloodInventory.model.js";
import sendNotification from "../utils/notification.js";

// Get all blood requests
export const getBloodRequests = async (req, res) => {
    try {
        const requests = await BloodRequest.findAll({
            include: [
                { model: Receiver, as: 'receiver', attributes: ['firstName', 'lastName', 'phoneNumber'] },
                { model: Hospital, as: 'hospital', attributes: ['name', 'phoneNumber'] },
            ],
        });
        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: "Error fetching blood requests" });
    }
};

// Get blood request by ID
export const getBloodRequestById = async (req, res) => {
    try {
        const request = await BloodRequest.findByPk(req.params.id, {
            include: [
                { model: Receiver, as: 'receiver', attributes: ['firstName', 'lastName', 'phoneNumber'] },
                { model: Hospital, as: 'hospital', attributes: ['name', 'phoneNumber'] },
            ],
        });
        if (!request) return res.status(404).json({ message: "Blood request not found" });
        res.json(request);
    } catch (error) {
        res.status(500).json({ message: "Error fetching blood request" });
    }
};

// Create a new blood request (Receiver posts blood request)
export const createBloodRequest = async (req, res) => {
    try {
        const { receiverId, bloodType, unitsRequired, urgency, city, hospitalId, notes } = req.body;

        if (!receiverId || !bloodType || !unitsRequired || !city) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        const newRequest = await BloodRequest.create({
            receiverId,
            bloodType,
            unitsRequired,
            urgency: urgency || "Normal",
            city,
            hospitalId,
            notes,
            status: "Pending"
        });

        // System Notification Triggered
        await triggerSystemNotification(newRequest);

        res.status(201).json(newRequest);
    } catch (error) {
        res.status(500).json({ message: "Error creating blood request" });
    }
};

// System Notification Triggered
const triggerSystemNotification = async (request) => {
    try {
        // Determine if this is an emergency alert or stock request
        if (request.urgency === "Urgent") {
            // Emergency Alert - Notify nearby donors
            await notifyNearbyDonors(request);
        } else {
            // Stock Request - Notify hospital
            await notifyHospital(request);
        }
    } catch (error) {
        console.error("Error triggering system notification:", error);
    }
};

// Notify nearby donors for emergency requests
export const notifyNearbyDonors = async (request) => {
    try {
        // Find donors with matching blood type and available status in the same city
        const compatibleDonors = await Donor.findAll({
            where: {
                bloodType: request.bloodType,
                activeStatus: true,
                city: request.city,
            },
        });

        // Send emergency alerts to compatible donors
        for (const donor of compatibleDonors) {
            await sendNotification({
                userId: donor.id,
                userType: 'Donor',
                subject: 'EMERGENCY: Blood Donation Request',
                message: `URGENT: ${request.bloodType} blood needed immediately in ${request.city}. Please respond if you can help.`,
                channels: ['email', 'sms'], // Use both channels for emergency
                attachments: []
            });
        }
    } catch (error) {
        console.error("Error notifying nearby donors:", error);
    }
};

// Notify hospital for stock requests
export const notifyHospital = async (request) => {
    try {
        if (!request.hospitalId) {
            console.error("No hospital specified for stock request");
            return;
        }

        const hospital = await Hospital.findByPk(request.hospitalId);
        if (!hospital) {
            console.error("Hospital not found");
            return;
        }

        // Send notification to hospital
        await sendNotification({
            userId: hospital.id,
            userType: 'Hospital',
            subject: 'Blood Stock Request',
            message: `A request for ${request.unitsRequired} units of ${request.bloodType} blood has been received. Please check your dashboard.`,
            channels: ['email'],
            attachments: []
        });
    } catch (error) {
        console.error("Error notifying hospital:", error);
    }
};

// Update blood request status (approve/decline)
export const updateBloodRequestStatus = async (req, res) => {
    try {
        const { status, hospitalId, notes } = req.body;
        const [affectedCount] = await BloodRequest.update(
            { status, hospitalId, notes },
            { where: { id: req.params.id } }
        );

        if (affectedCount === 0) return res.status(404).json({ message: "Blood request not found" });

        const updatedRequest = await BloodRequest.findByPk(req.params.id);

        // Send notification to receiver
        const receiver = await Receiver.findByPk(updatedRequest.receiverId);
        if (receiver) {
            const message = `Your blood request for ${updatedRequest.bloodType} has been ${status.toLowerCase()}.`;
            await sendNotification({
                userId: receiver.id,
                userType: 'Receiver',
                subject: 'Blood Request Update',
                message,
                channels: ['email'],
                attachments: [],
            });
        }

        res.status(200).json(updatedRequest);
    } catch (error) {
        res.status(500).json({ message: "Error updating blood request status" });
    }
};

// Delete blood request
export const deleteBloodRequest = async (req, res) => {
    try {
        const deletedCount = await BloodRequest.destroy({ where: { id: req.params.id } });
        if (deletedCount === 0) return res.status(404).json({ message: "Blood request not found" });

        res.json({ message: "Blood request deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting blood request" });
    }
};

// Get blood requests by hospital
export const getBloodRequestsByHospital = async (req, res) => {
    try {
        const hospitalId = req.params.id;
        const requests = await BloodRequest.findAll({
            where: { hospitalId },
            include: [{ model: Receiver, as: 'receiver', attributes: ['firstName', 'lastName', 'phoneNumber'] }],
        });
        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: "Error fetching blood requests by hospital" });
    }
};

// Donor accepts blood request and shares location
// NOTE: BloodRequest has no donorId/donorLocation/acceptedAt columns yet - this
// endpoint needs a schema update before it can actually persist donor acceptance.
export const donorAcceptRequest = async (req, res) => {
    try {
        const { donorId, location } = req.body;

        if (!donorId || !location) {
            return res.status(400).json({ message: "Donor ID and location are required" });
        }

        const [affectedCount] = await BloodRequest.update(
            { status: "Donor Accepted" },
            { where: { id: req.params.id } }
        );

        if (affectedCount === 0) {
            return res.status(404).json({ message: "Blood request not found" });
        }

        const request = await BloodRequest.findByPk(req.params.id);

        // Notify receiver that a donor has accepted
        const receiver = await Receiver.findByPk(request.receiverId);
        if (receiver) {
            await sendNotification({
                userId: receiver.id,
                userType: 'Receiver',
                subject: 'Donor Found for Your Blood Request',
                message: `A donor has accepted your request for ${request.bloodType} blood. Connection arrangements will be made soon.`,
                channels: ['email'],
                attachments: []
            });
        }

        res.status(200).json(request);
    } catch (error) {
        res.status(500).json({ message: "Error accepting blood request" });
    }
};

// Hospital confirms blood availability or shortage
export const hospitalConfirmAvailability = async (req, res) => {
    try {
        const { hospitalId, isAvailable } = req.body;

        if (!hospitalId) {
            return res.status(400).json({ message: "Hospital ID is required" });
        }

        const [affectedCount] = await BloodRequest.update(
            {
                hospitalId,
                status: isAvailable ? "Approved" : "Declined",
            },
            { where: { id: req.params.id } }
        );

        if (affectedCount === 0) {
            return res.status(404).json({ message: "Blood request not found" });
        }

        const request = await BloodRequest.findByPk(req.params.id);

        // Notify receiver about hospital response
        const receiver = await Receiver.findByPk(request.receiverId);
        if (receiver) {
            const message = isAvailable
                ? `${request.bloodType} blood is available at the hospital. Please proceed with arrangements.`
                : `There is a shortage of ${request.bloodType} blood at the hospital. We're looking for alternative sources.`;

            await sendNotification({
                userId: receiver.id,
                userType: 'Receiver',
                subject: 'Hospital Response to Blood Request',
                message,
                channels: ['email'],
                attachments: []
            });
        }

        res.status(200).json(request);
    } catch (error) {
        res.status(500).json({ message: "Error confirming blood availability" });
    }
};

// Arrange connection between donor and receiver/hospital
// NOTE: BloodRequest has no arrangementDetails/meetingTime/meetingLocation/donorId
// columns yet - this endpoint needs a schema update before it's fully functional.
export const arrangeConnection = async (req, res) => {
    try {
        const { meetingTime, meetingLocation } = req.body;

        const [affectedCount] = await BloodRequest.update(
            { status: "Approved" },
            { where: { id: req.params.id } }
        );

        if (affectedCount === 0) {
            return res.status(404).json({ message: "Blood request not found" });
        }

        const request = await BloodRequest.findByPk(req.params.id, {
            include: [
                { model: Receiver, as: 'receiver', attributes: { exclude: ['password'] } },
                { model: Hospital, as: 'hospital', attributes: { exclude: ['password'] } },
            ],
        });

        // Notify receiver
        if (request.receiver) {
            await sendNotification({
                userId: request.receiver.id,
                userType: 'Receiver',
                subject: 'Blood Donation Arrangement Confirmed',
                message: `Blood donation has been arranged for ${new Date(meetingTime).toLocaleString()} at ${meetingLocation}.`,
                channels: ['email'],
                attachments: []
            });
        }

        // Notify hospital
        if (request.hospital) {
            await sendNotification({
                userId: request.hospital.id,
                userType: 'Hospital',
                subject: 'Blood Donation Arrangement Confirmed',
                message: `A blood donation has been arranged for ${new Date(meetingTime).toLocaleString()} at ${meetingLocation}.`,
                channels: ['email'],
                attachments: []
            });
        }

        res.status(200).json(request);
    } catch (error) {
        res.status(500).json({ message: "Error arranging connection" });
    }
};

// Record successful blood donation
// NOTE: BloodRequest has no donationCompleted/actualUnitsDonated columns yet, and
// Donor has no donationCount/points/badges columns - donor gamification updates
// here are no-ops until those columns are added (see gamification.model.js instead,
// which already tracks points/badges separately).
export const recordSuccessfulDonation = async (req, res) => {
    try {
        const { units } = req.body;

        const [affectedCount] = await BloodRequest.update(
            { status: "Fulfilled" },
            { where: { id: req.params.id } }
        );

        if (affectedCount === 0) {
            return res.status(404).json({ message: "Blood request not found" });
        }

        const request = await BloodRequest.findByPk(req.params.id);

        // Update hospital blood stock levels
        if (request.hospitalId) {
            const inventory = await BloodInventory.findOne({
                where: { hospitalId: request.hospitalId, bloodType: request.bloodType },
            });

            if (inventory) {
                await inventory.update({ availableStocks: inventory.availableStocks + parseInt(units) });
            } else {
                await BloodInventory.create({
                    hospitalId: request.hospitalId,
                    bloodType: request.bloodType,
                    availableStocks: parseInt(units),
                    expirationDate: (() => {
                        const d = new Date();
                        d.setDate(d.getDate() + 42);
                        return d;
                    })(),
                });
            }
        }

        res.status(200).json(request);
    } catch (error) {
        res.status(500).json({ message: "Error recording successful donation" });
    }
};

// Check hospital stock levels
export const checkHospitalStock = async (req, res) => {
    try {
        const { city, bloodType } = req.query;
        const hospitals = await Hospital.findAll({
            where: { city },
            include: [{ model: BloodInventory, as: 'bloodInventory', attributes: ['bloodType', 'availableStocks'] }],
        });

        const stockInfo = hospitals.map(hospital => ({
            hospitalName: hospital.name,
            bloodType,
            unitsAvailable: hospital.bloodInventory?.find(inv => inv.bloodType === bloodType)?.availableStocks || 0,
        }));

        res.json(stockInfo);
    } catch (error) {
        res.status(500).json({ message: "Error checking hospital stock" });
    }
};
