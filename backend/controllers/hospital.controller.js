import Hospital from "../models/hospital.model.js";
import SystemManager from "../models/SystemManager.model.js";

// Get all hospitals
export const getHospitals = async (req, res) => {
    try {
        const hospitals = await Hospital.findAll({ attributes: { exclude: ['password'] } });
        res.json(hospitals);
    } catch (error) {
        res.status(500).json({ message: "Error fetching hospitals" });
    }
};

// Get a hospital by ID
export const getHospitalById = async (req, res) => {
    try {
        const hospital = await Hospital.findByPk(req.params.id, { attributes: { exclude: ['password'] } });
        if (!hospital) return res.status(404).json({ message: "Hospital not found" });
        res.json(hospital);
    } catch (error) {
        res.status(500).json({ message: "Error fetching hospital" });
    }
};

// Create a new hospital
export const createHospital = async (req, res) => {
    try {
        const { name, city, systemManagerId, identificationNumber, email, password, phoneNumber, address, startTime, endTime, activeStatus } = req.body;

        const image = req.file ? req.file.path : null;

        const newHospital = await Hospital.create({
            name,
            city,
            systemManagerId,
            identificationNumber,
            email,
            password,
            phoneNumber,
            address,
            startTime,
            endTime,
            image,
            activeStatus: activeStatus !== undefined ? activeStatus : true,
        });

        const responseHospital = newHospital.toJSON();
        delete responseHospital.password;
        res.status(201).json(responseHospital);
    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            const field = Object.keys(error.fields)[0];
            return res.status(400).json({ message: `${field} already exists` });
        }
        res.status(400).json({ message: "Error creating hospital" });
    }
};

// Update hospital details
export const updateHospital = async (req, res) => {
    try {
        const { id } = req.params;
        const updatedData = { ...req.body };

        if (req.file) {
            updatedData.image = req.file.path;
        }

        const [affectedCount] = await Hospital.update(updatedData, { where: { id } });

        if (affectedCount === 0) return res.status(404).json({ message: "Hospital not found" });

        const updatedHospital = await Hospital.findByPk(id, { attributes: { exclude: ['password'] } });
        res.status(200).json(updatedHospital);
    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            const field = Object.keys(error.fields)[0];
            return res.status(400).json({ message: `${field} already exists` });
        }
        res.status(500).json({ message: "Error updating hospital" });
    }
};

// Delete hospital
export const deleteHospital = async (req, res) => {
    try {
        const { id } = req.params;

        const deletedCount = await Hospital.destroy({ where: { id } });

        if (deletedCount === 0) return res.status(404).json({ message: "Hospital not found" });

        res.status(200).json({ message: "Hospital deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting hospital" });
    }
};

// Public self-registration: hospital signs up but stays inactive/pending
// until a System Manager approves it (see updateHospitalApproval below).
export const registerHospital = async (req, res) => {
    try {
        const { name, city, identificationNumber, email, password, phoneNumber, address, startTime, endTime } = req.body;

        // Any existing System Manager can review/approve this hospital later -
        // systemManagerId isn't used as an ownership boundary anywhere else in the app.
        const manager = await SystemManager.findOne({ order: [['id', 'ASC']] });
        if (!manager) {
            return res.status(500).json({ message: "No system manager available to review registrations" });
        }

        const image = req.file ? req.file.path : null;

        const newHospital = await Hospital.create({
            name,
            city,
            systemManagerId: manager.id,
            identificationNumber,
            email,
            password,
            phoneNumber,
            address,
            startTime,
            endTime,
            image,
            activeStatus: false,
            approvalStatus: 'Pending',
        });

        const responseHospital = newHospital.toJSON();
        delete responseHospital.password;

        res.status(201).json({
            message: "Registration submitted. Your account will be reviewed by an administrator before you can log in.",
            hospital: responseHospital,
        });
    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            const field = Object.keys(error.fields)[0];
            return res.status(400).json({ message: `${field} already exists` });
        }
        res.status(400).json({ message: "Error registering hospital" });
    }
};

// Manager approves or rejects a pending hospital registration
export const updateHospitalApproval = async (req, res) => {
    try {
        const { id } = req.params;
        const { decision } = req.body;

        if (!['Approved', 'Rejected'].includes(decision)) {
            return res.status(400).json({ message: "decision must be 'Approved' or 'Rejected'" });
        }

        const [affectedCount] = await Hospital.update(
            { approvalStatus: decision, activeStatus: decision === 'Approved' },
            { where: { id } }
        );

        if (affectedCount === 0) return res.status(404).json({ message: "Hospital not found" });

        const updatedHospital = await Hospital.findByPk(id, { attributes: { exclude: ['password'] } });
        res.status(200).json({
            message: `Hospital ${decision.toLowerCase()}`,
            hospital: updatedHospital,
        });
    } catch (error) {
        res.status(500).json({ message: "Error updating hospital approval" });
    }
};

// Toggle hospital active status
export const toggleHospitalStatus = async (req, res) => {
    try {
        const { id } = req.params;

        const hospital = await Hospital.findByPk(id);
        if (!hospital) return res.status(404).json({ message: "Hospital not found" });

        const newStatus = !hospital.activeStatus;
        await Hospital.update({ activeStatus: newStatus }, { where: { id } });

        const updatedHospital = await Hospital.findByPk(id, { attributes: { exclude: ['password'] } });
        res.status(200).json({
            message: `Hospital ${newStatus ? 'activated' : 'deactivated'} successfully`,
            hospital: updatedHospital,
        });
    } catch (error) {
        res.status(500).json({ message: "Error toggling hospital status" });
    }
};
