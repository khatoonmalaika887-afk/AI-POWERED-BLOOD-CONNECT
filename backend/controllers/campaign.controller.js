import Campaign from "../models/campaign.model.js";
import Payment from "../models/payment.model.js";
import sendNotification from "../utils/notification.js";

// Get all campaigns
export const getCampaigns = async (req, res) => {
    try {
        const campaigns = await Campaign.findAll();
        res.json(campaigns);
    } catch (error) {
        res.status(500).json({ message: "Error fetching campaigns" });
    }
};

// Get campaign by ID
export const getCampaignById = async (req, res) => {
    try {
        const campaign = await Campaign.findByPk(req.params.id);
        if (!campaign) return res.status(404).json({ message: "Campaign not found" });
        res.json(campaign);
    } catch (error) {
        res.status(500).json({ message: "Error fetching campaign" });
    }
};

// Create a new campaign
export const createCampaign = async (req, res) => {
    try {
        const { title, description, startDate, endDate, location, organizerId, organizerType, targetDonors, budget } = req.body;

        const image = req.file ? req.file.path : null;

        const newCampaign = await Campaign.create({
            title,
            description,
            startDate,
            endDate,
            location,
            organizerId,
            organizerType,
            targetDonors,
            budget,
            image,
        });

        res.status(201).json(newCampaign);
    } catch (error) {
        res.status(400).json({ message: "Error creating campaign" });
    }
};

// Update campaign
export const updateCampaign = async (req, res) => {
    try {
        const [affectedCount] = await Campaign.update(req.body, {
            where: { id: req.params.id },
        });

        if (affectedCount === 0) return res.status(404).json({ message: "Campaign not found" });

        const updatedCampaign = await Campaign.findByPk(req.params.id);
        res.status(200).json(updatedCampaign);
    } catch (error) {
        res.status(500).json({ message: "Error updating campaign" });
    }
};

// Delete campaign
export const deleteCampaign = async (req, res) => {
    try {
        const deletedCampaign = await Campaign.destroy({
            where: { id: req.params.id }
        });

        if (deletedCampaign === 0) return res.status(404).json({ message: "Campaign not found" });

        res.json({ message: "Campaign deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting campaign" });
    }
};

// Register donor for campaign
export const registerForCampaign = async (req, res) => {
    try {
        const campaignId = req.params.id;
        const donorId = req.body.donorId;

        const campaign = await Campaign.findByPk(campaignId);
        if (!campaign) return res.status(404).json({ message: "Campaign not found" });

        const registeredDonors = campaign.registeredDonors || [];
        if (registeredDonors.includes(donorId)) {
            return res.status(400).json({ message: "Donor already registered" });
        }

        registeredDonors.push(donorId);
        await campaign.update({ registeredDonors });

        res.status(200).json({ message: "Registered successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error registering for campaign" });
    }
};

// Get campaigns by organizer
export const getCampaignsByOrganizer = async (req, res) => {
    try {
        const { organizerId, organizerType } = req.params;
        const campaigns = await Campaign.findAll({
            where: { organizerId, organizerType }
        });
        res.json(campaigns);
    } catch (error) {
        res.status(500).json({ message: "Error fetching campaigns by organizer" });
    }
};

// Donate to campaign
export const donateToCampaign = async (req, res) => {
    try {
        const campaignId = req.params.id;
        const { amount, paymentMethod, userId, userType } = req.body;

        // Create payment record
        const payment = await Payment.create({
            userId,
            userType,
            amount,
            paymentMethod,
            purpose: 'Campaign',
            campaignId,
            status: 'Pending',
        });

        // Simulate payment processing
        setTimeout(async () => {
            await payment.update({ status: 'Completed', transactionId: `TXN${Date.now()}` });
        }, 1000);

        res.status(201).json({ message: "Donation initiated", payment });
    } catch (error) {
        res.status(400).json({ message: "Error processing donation" });
    }
};
