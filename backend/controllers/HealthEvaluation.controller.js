import HealthEvaluation from "../models/HealthEvaluation.model.js";
import Donor from "../models/donor.model.js";
import Hospital from "../models/hospital.model.js";
import HospitalAdmin from "../models/HospitalAdmin.model.js";

const evaluationIncludes = [
    { model: Hospital, as: 'hospital', attributes: { exclude: ['password'] } },
    { model: Donor, as: 'donor', attributes: { exclude: ['password'] } },
    { model: HospitalAdmin, as: 'hospitalAdmin', attributes: { exclude: ['password'] } },
];

// Get all health evaluations
export const getHealthEvaluations = async (req, res) => {
    try {
        const evaluations = await HealthEvaluation.findAll({ include: evaluationIncludes });
        res.json(evaluations);
    } catch (error) {
        res.status(500).json({ message: "Error fetching health evaluations" });
    }
};

// Get a single health evaluation
export const getHealthEvaluationById = async (req, res) => {
    try {
        const evaluation = await HealthEvaluation.findByPk(req.params.id, { include: evaluationIncludes });
        if (!evaluation) return res.status(404).json({ message: "Health evaluation not found" });
        res.json(evaluation);
    } catch (error) {
        res.status(500).json({ message: "Error fetching health evaluation" });
    }
};

// Create a new health evaluation
export const createEvaluation = async (req, res) => {
    try {
        const { hospitalId, donorId, evaluationDate, evaluationTime } = req.body;

        if (!hospitalId || !donorId || !evaluationDate || !evaluationTime) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const newEvaluation = await HealthEvaluation.create({
            progressStatus: 'Not Started',
            hospitalId,
            donorId,
            evaluationDate,
            evaluationTime,
        });
        await Donor.update({ healthStatus: true }, { where: { id: donorId } });

        res.status(201).json({ success: true, data: newEvaluation });
    } catch (error) {
        res.status(400).json({ message: "Error creating health evaluation" });
    }
};

// Update Date and Time of Evaluation
export const updateEvaluationDateTime = async (req, res) => {
    try {
        const { evaluationDate, evaluationTime, hospitalAdminId } = req.body;
        const [affectedCount] = await HealthEvaluation.update(
            {
                evaluationDate,
                evaluationTime,
                activeStatus: "Re-Scheduled",
                hospitalAdminId
            },
            { where: { id: req.params.id } }
        );

        if (affectedCount === 0) return res.status(404).json({ message: "Evaluation not found" });
        const updatedEvaluation = await HealthEvaluation.findByPk(req.params.id);
        res.status(200).json(updatedEvaluation);
    } catch (error) {
        res.status(500).json({ message: "Error updating evaluation date and time" });
    }
};

// Cancel an Evaluation
export const cancelEvaluation = async (req, res) => {
    try {
        const { hospitalAdminId, userId } = req.body;
        const [affectedCount] = await HealthEvaluation.update(
            {
                passStatus: "Cancelled",
                activeStatus: "Cancelled",
                progressStatus: "Cancelled",
                hospitalAdminId
            },
            { where: { id: req.params.id } }
        );
        await Donor.update({ healthStatus: false }, { where: { id: userId } });
        if (affectedCount === 0) return res.status(404).json({ message: "Evaluation not found" });
        const canceledEvaluation = await HealthEvaluation.findByPk(req.params.id);
        res.status(200).json(canceledEvaluation);
    } catch (error) {
        res.status(500).json({ message: "Error cancelling evaluation" });
    }
};

// Accept an Evaluation
export const acceptEvaluation = async (req, res) => {
    try {
        const { hospitalAdminId } = req.body;
        const [affectedCount] = await HealthEvaluation.update(
            {
                activeStatus: "Accepted",
                hospitalAdminId
            },
            { where: { id: req.params.id } }
        );

        if (affectedCount === 0) return res.status(404).json({ message: "Evaluation not found" });

        const acceptedEvaluation = await HealthEvaluation.findByPk(req.params.id);
        res.status(200).json(acceptedEvaluation);
    } catch (error) {
        res.status(500).json({ message: "Error accepting evaluation" });
    }
};

// Arrived for an Evaluation
export const arrivedForEvaluation = async (req, res) => {
    try {
        const { receiptNumber } = req.body;
        const [affectedCount] = await HealthEvaluation.update(
            {
                receiptNumber,
                progressStatus: "In Progress"
            },
            { where: { id: req.params.id } }
        );

        if (affectedCount === 0) return res.status(404).json({ message: "Evaluation not found" });

        const arrivedEvaluation = await HealthEvaluation.findByPk(req.params.id);
        res.status(200).json(arrivedEvaluation);
    } catch (error) {
        res.status(500).json({ message: "Error marking evaluation as arrived" });
    }
};

// Complete an Evaluation
export const completeEvaluation = async (req, res) => {
    try {
        const { result } = req.body;
        const file = req.file ? req.file.path : null;

        if (!result) {
            return res.status(400).json({ message: "Result is required" });
        }

        const [affectedCount] = await HealthEvaluation.update(
            {
                passStatus: result,
                progressStatus: "Completed",
                evaluationFile: file
            },
            { where: { id: req.params.id } }
        );

        if (affectedCount === 0) {
            return res.status(404).json({ message: "Evaluation not found" });
        }

        const completedEvaluation = await HealthEvaluation.findByPk(req.params.id);
        res.status(200).json(completedEvaluation);
    } catch (error) {
        res.status(500).json({ message: "Error completing evaluation" });
    }
};

// Delete a health evaluation
export const deleteHealthEvaluation = async (req, res) => {
    try {
        const deletedCount = await HealthEvaluation.destroy({ where: { id: req.params.id } });
        if (deletedCount === 0) return res.status(404).json({ message: "Health evaluation not found" });
        res.json({ message: 'Health Evaluation deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: "Error deleting health evaluation" });
    }
};

// Get health evaluations by donor ID
export const getHealthEvaluationByDonorId = async (req, res) => {
    try {
        const { id } = req.params;
        const evaluation = await HealthEvaluation.findAll({ where: { donorId: id }, include: evaluationIncludes });
        if (!evaluation || evaluation.length === 0) return res.status(404).json({ message: "Health evaluation not found" });
        res.json(evaluation);
    } catch (error) {
        res.status(500).json({ message: "Error fetching health evaluation" });
    }
};

// Get health evaluations by hospital ID
export const getHealthEvaluationByHospitalId = async (req, res) => {
    try {
        const { id } = req.params;
        const evaluation = await HealthEvaluation.findAll({ where: { hospitalId: id }, include: evaluationIncludes });
        if (!evaluation || evaluation.length === 0) return res.status(404).json({ message: "Health evaluation not found" });
        res.json(evaluation);
    } catch (error) {
        res.status(500).json({ message: "Error fetching health evaluation" });
    }
};

// Cancel evaluation by donor
export const cancelEvaluationDonor = async (req, res) => {
    const { userId } = req.body;
    try {
        const [affectedCount] = await HealthEvaluation.update(
            {
                passStatus: "Cancelled",
                activeStatus: "Cancelled",
                progressStatus: "Cancelled"
            },
            { where: { id: req.params.id } }
        );
        await Donor.update({ healthStatus: false }, { where: { id: userId } });
        if (affectedCount === 0) return res.status(404).json({ message: "Evaluation not found" });
        const canceledEvaluation = await HealthEvaluation.findByPk(req.params.id);
        res.status(200).json(canceledEvaluation);
    } catch (error) {
        res.status(500).json({ message: "Error cancelling evaluation" });
    }
};

export const findLastUpdatedEvaluationByDonor = async (req, res) => {
    try {
        const evaluation = await HealthEvaluation.findOne({
            where: { donorId: req.params.id },
            order: [['updatedAt', 'DESC']],
        });
        if (!evaluation) return res.status(404).json({ message: "No evaluations found" });
        res.json(evaluation);
    } catch (error) {
        res.status(500).json({ message: "Error fetching evaluations" });
    }
}
