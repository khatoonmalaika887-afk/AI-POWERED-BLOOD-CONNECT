import Inquiry from '../models/inquiry.model.js';
import SystemManager from '../models/SystemManager.model.js';

// Fetch all inquiries
export const getAllInquiries = async (req, res) => {
    try {
        const inquiries = await Inquiry.findAll();
        res.json(inquiries);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching inquiries' });
    }
};

// Fetch a specific inquiry by ID
export const getInquiryById = async (req, res) => {
    try {
        const inquiry = await Inquiry.findByPk(req.params.id, {
            include: [{ model: SystemManager, as: 'systemManager', attributes: ['firstName', 'lastName', 'email'] }],
        });
        if (!inquiry) {
            return res.status(404).json({ message: 'Inquiry not found' });
        }
        res.json(inquiry);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching inquiry' });
    }
};

// Create a new inquiry
export const createInquiry = async (req, res) => {
    const { email, subject, message, category } = req.body;

    try {
        const newInquiry = await Inquiry.create({
            email,
            subject,
            message,
            category
        });

        res.status(201).json({ message: 'Inquiry created successfully', inquiry: newInquiry });
    } catch (error) {
        res.status(500).json({ message: 'Error creating inquiry' });
    }
};

// Update an inquiry's status
export const updateInquiryStatus = async (req, res) => {
    const { status } = req.body;
    const validStatuses = ['Pending', 'In Progress', 'Resolved'];

    if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
    }

    try {
        const [affectedCount] = await Inquiry.update(
            { attentiveStatus: status },
            { where: { id: req.params.id } }
        );

        if (affectedCount === 0) {
            return res.status(404).json({ message: 'Inquiry not found' });
        }

        const inquiry = await Inquiry.findByPk(req.params.id);
        res.json({ message: 'Inquiry updated successfully', inquiry });
    } catch (error) {
        res.status(500).json({ message: 'Error updating inquiry' });
    }
};

// Delete an inquiry by ID
export const deleteInquiry = async (req, res) => {
    try {
        const deletedCount = await Inquiry.destroy({ where: { id: req.params.id } });
        if (deletedCount === 0) {
            return res.status(404).json({ message: 'Inquiry not found' });
        }
        res.json({ message: 'Inquiry deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting inquiry' });
    }
};
