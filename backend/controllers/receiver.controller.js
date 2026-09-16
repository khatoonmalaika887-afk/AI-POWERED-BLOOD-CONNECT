import Receiver from "../models/receiver.model.js";
import Donor from "../models/donor.model.js";
import BloodRequest from "../models/bloodRequest.model.js";
import sendNotification from "../utils/notification.js";

// Get all receivers
export const getReceivers = async (req, res) => {
    try {
        const receivers = await Receiver.findAll({ attributes: { exclude: ['password'] } });
        res.json(receivers);
    } catch (error) {
        res.status(500).json({ message: "Error fetching receivers" });
    }
};

// Get a single receiver by ID
export const getReceiverById = async (req, res) => {
    try {
        const receiver = await Receiver.findByPk(req.params.id, { attributes: { exclude: ['password'] } });
        if (!receiver) return res.status(404).json({ message: "Receiver not found" });
        res.json(receiver);
    } catch (error) {
        res.status(500).json({ message: "Error fetching receiver" });
    }
};

// Create a new receiver
export const createReceiver = async (req, res) => {
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

        const newReceiver = await Receiver.create({
            firstName,
            lastName,
            gender,
            phoneNumber,
            email,
            password,
            dob,
            bloodType,
            city,
            nic,
            image,
        });

        const responseReceiver = newReceiver.toJSON();
        delete responseReceiver.password;
        res.status(201).json(responseReceiver);
    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            const field = Object.keys(error.fields)[0];
            return res.status(400).json({ message: `${field} already exists` });
        }
        res.status(400).json({ message: "Error creating receiver" });
    }
};

// Update receiver details
export const updateReceiver = async (req, res) => {
    try {
        const { password, ...otherUpdates } = req.body;

        if (password) {
            otherUpdates.password = password;
        }

        if (req.file) {
            otherUpdates.image = req.file.path;
        }

        const [affectedCount] = await Receiver.update(otherUpdates, {
            where: { id: req.params.id },
        });

        if (affectedCount === 0) return res.status(404).json({ message: "Receiver not found" });

        const updatedReceiver = await Receiver.findByPk(req.params.id, { attributes: { exclude: ['password'] } });
        res.status(200).json(updatedReceiver);
    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            const field = Object.keys(error.fields)[0];
            return res.status(400).json({ message: `${field} already exists` });
        }
        res.status(500).json({ message: "Error updating receiver" });
    }
};

// Delete a receiver
export const deleteReceiver = async (req, res) => {
    try {
        const deletedCount = await Receiver.destroy({ where: { id: req.params.id } });
        if (deletedCount === 0) return res.status(404).json({ message: "Receiver not found" });

        res.json({ message: "Receiver deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting receiver" });
    }
};

// Activate/Deactivate receiver status
export const activateDeactivateReceiver = async (req, res) => {
    try {
        const { id } = req.params;

        const receiver = await Receiver.findByPk(id);
        if (!receiver) {
            return res.status(404).json({ message: "Receiver not found" });
        }

        const newStatus = !receiver.activeStatus;
        await Receiver.update({ activeStatus: newStatus }, { where: { id } });

        const updatedReceiver = await Receiver.findByPk(id, { attributes: { exclude: ['password'] } });
        res.status(200).json({
            message: `Receiver ${newStatus ? 'activated' : 'deactivated'} successfully`,
            receiver: updatedReceiver,
        });
    } catch (error) {
        res.status(500).json({ message: "Error toggling receiver status" });
    }
};

// Create blood request
export const createBloodRequest = async (req, res) => {
    try {
        const { bloodType, unitsRequired, urgency, city, notes } = req.body;
        const receiverId = req.user.id; // Assuming auth middleware sets req.user

        const newRequest = await BloodRequest.create({
            receiverId,
            bloodType,
            unitsRequired,
            urgency,
            city,
            notes,
        });

        // Send notification to nearby donors (logic to be implemented)
        // For now, just return success
        res.status(201).json(newRequest);
    } catch (error) {
        res.status(400).json({ message: "Error creating blood request" });
    }
};

// Get blood requests by receiver
export const getBloodRequestsByReceiver = async (req, res) => {
    try {
        const receiverId = req.params.id;
        const requests = await BloodRequest.findAll({ where: { receiverId } });
        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: "Error fetching blood requests" });
    }
};

// Search donors by city and blood type
export const searchDonors = async (req, res) => {
    try {
        const { city, bloodType } = req.query;
        const donors = await Donor.findAll({ where: { city, bloodType, activeStatus: true }, attributes: { exclude: ['password'] } });
        res.json(donors);
    } catch (error) {
        res.status(500).json({ message: "Error searching donors" });
    }
};
