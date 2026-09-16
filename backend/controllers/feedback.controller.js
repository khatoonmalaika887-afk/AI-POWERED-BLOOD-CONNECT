import Feedback from "../models/feedback.model.js";
import Donor from "../models/donor.model.js";
import SystemManager from "../models/SystemManager.model.js";
import BloodDonationAppointment from "../models/BloodDonationAppointment.model.js";
import HealthEvaluation from "../models/HealthEvaluation.model.js";

// Get all feedbacks
export const getFeedbacks = async (req, res) => {
    try {
        const feedbacks = await Feedback.findAll();
        res.json(feedbacks);
    } catch (error) {
        res.status(500).json({ message: "Error fetching feedbacks" });
    }
};

// Get a single feedback by ID
export const getFeedbackById = async (req, res) => {
    try {
        const feedback = await Feedback.findByPk(req.params.id, {
            include: [
                { model: Donor, as: 'donor', attributes: { exclude: ['password'] } },
                { model: SystemManager, as: 'systemManager', attributes: { exclude: ['password'] } },
            ],
        });
        if (!feedback) return res.status(404).json({ message: "Feedback not found" });

        const SessionModel = feedback.sessionModel === 'HealthEvaluation' ? HealthEvaluation : BloodDonationAppointment;
        const session = await SessionModel.findByPk(feedback.sessionId);

        res.json({ ...feedback.toJSON(), session });
    } catch (error) {
        res.status(500).json({ message: "Error fetching feedback" });
    }
};

// Create a new feedback
export const createFeedback = async (req, res) => {
    try {
        const { donorId, sessionId, sessionModel, subject, comments, feedbackType, starRating } = req.body;

        // Validate required fields
        if (!donorId || !sessionModel || !sessionId || !subject || !comments || !feedbackType) {
            return res.status(400).json({ message: "All required fields must be filled" });
        }

        const newFeedback = await Feedback.create({
            donorId,
            sessionModel,
            sessionId,
            subject,
            comments,
            feedbackType,
            starRating: starRating || null,
        });

        res.status(201).json(newFeedback);
    } catch (error) {
        res.status(400).json({ message: "Error creating feedback" });
    }
};

// Update feedback details
export const updateFeedback = async (req, res) => {
    try {
        const [affectedCount] = await Feedback.update(req.body, {
            where: { id: req.params.id },
        });

        if (affectedCount === 0) return res.status(404).json({ message: "Feedback not found" });

        const updatedFeedback = await Feedback.findByPk(req.params.id);
        res.status(200).json(updatedFeedback);
    } catch (error) {
        res.status(500).json({ message: "Error updating feedback" });
    }
};

// Delete a feedback
export const deleteFeedback = async (req, res) => {
    try {
        const deletedCount = await Feedback.destroy({ where: { id: req.params.id } });
        if (deletedCount === 0) return res.status(404).json({ message: "Feedback not found" });

        res.json({ message: "Feedback deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting feedback" });
    }
};
