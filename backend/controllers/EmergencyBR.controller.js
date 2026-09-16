import EmergencyBR from "../models/EmergencyBR.model.js";
import Hospital from "../models/hospital.model.js";
import Donor from "../models/donor.model.js";

// acceptedBy can reference either a Hospital or a Donor (see acceptedByType), so it
// can't be modeled as a single Sequelize association - resolve it manually instead.
const withAcceptedBy = async (request) => {
    const plain = request.toJSON();
    if (plain.acceptedBy && plain.acceptedByType) {
        const Model = plain.acceptedByType === 'Hospital' ? Hospital : Donor;
        plain.acceptedByDetails = await Model.findByPk(plain.acceptedBy, { attributes: { exclude: ['password'] } });
    }
    return plain;
};

// Get all emergency requests
export const getEmergencyRequests = async (req, res) => {
    try {
        const requests = await EmergencyBR.findAll();
        const populated = await Promise.all(requests.map(withAcceptedBy));
        res.status(200).json(populated);
    } catch (error) {
        res.status(500).json({ message: "Error retrieving emergency requests" });
    }
};

// Get a single emergency request by ID
export const getEmergencyRequestById = async (req, res) => {
    try {
        const request = await EmergencyBR.findByPk(req.params.id);
        if (!request) return res.status(404).json({ message: "Emergency request not found" });

        res.status(200).json(await withAcceptedBy(request));
    } catch (error) {
        res.status(500).json({ message: "Error retrieving emergency request" });
    }
};

// Create an emergency request
export const createEmergencyRequest = async (req, res) => {
    try {
        const {
            name, phoneNumber, proofOfIdentificationNumber, patientBlood, units,
            criticalLevel, withinDate, hospitalName, address
        } = req.body;

        if (!name || !phoneNumber || !proofOfIdentificationNumber || !patientBlood || !units ||
            !criticalLevel || !withinDate || !hospitalName || !address) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        const proofDocument = req.file ? req.file.path : null;

        const newRequest = await EmergencyBR.create({
            name,
            phoneNumber,
            proofOfIdentificationNumber,
            proofDocument,
            patientBlood,
            units,
            criticalLevel,
            withinDate,
            hospitalName,
            address
        });

        res.status(201).json(newRequest);
    } catch (error) {
        res.status(500).json({ message: "Error creating emergency request" });
    }
};

// Delete an emergency request
export const deleteEmergencyRequest = async (req, res) => {
    try {
        const deletedCount = await EmergencyBR.destroy({ where: { id: req.params.id } });
        if (deletedCount === 0) return res.status(404).json({ message: "Emergency request not found" });

        res.json({ message: "Emergency request deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting emergency request" });
    }
};

// Validate (activate) an emergency request
export const validateEmergencyRequest = async (req, res) => {
    try {
        const [affectedCount] = await EmergencyBR.update(
            { activeStatus: "Active" },
            { where: { id: req.params.id } }
        );
        if (affectedCount === 0) return res.status(404).json({ message: "Emergency request not found" });

        res.json({ message: "Emergency request validated successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error validating emergency request" });
    }
};

// Accept an emergency request
export const acceptEmergencyRequest = async (req, res) => {
    try {
        const { acceptedBy, acceptedByType } = req.body;

        if (!acceptedBy || !acceptedByType) {
            return res.status(400).json({
                message: "acceptedBy and acceptedByType are required to accept a request"
            });
        }

        const [affectedCount] = await EmergencyBR.update(
            {
                activeStatus: "Inactive",
                acceptStatus: "Accepted",
                acceptedBy,
                acceptedByType
            },
            { where: { id: req.params.id } }
        );

        if (affectedCount === 0) {
            return res.status(404).json({ message: "Emergency request not found" });
        }

        const request = await EmergencyBR.findByPk(req.params.id);
        res.status(200).json(await withAcceptedBy(request));
    } catch (error) {
        res.status(500).json({ message: "Error accepting emergency request" });
    }
};

// Decline an emergency request
export const declineEmergencyRequest = async (req, res) => {
    try {
        const { declineReason } = req.body;

        if (!declineReason) {
            return res.status(400).json({ message: "declineReason is required to decline a request" });
        }

        const [affectedCount] = await EmergencyBR.update(
            {
                activeStatus: "Inactive",
                acceptStatus: "Declined",
                declineReason
            },
            { where: { id: req.params.id } }
        );

        if (affectedCount === 0) {
            return res.status(404).json({ message: "Emergency request not found" });
        }

        const request = await EmergencyBR.findByPk(req.params.id);
        res.status(200).json(request);
    } catch (error) {
        res.status(500).json({ message: "Error declining emergency request" });
    }
};
