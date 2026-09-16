import Payment from "../models/payment.model.js";
import Campaign from "../models/campaign.model.js";

// Get all payments
export const getPayments = async (req, res) => {
    try {
        const payments = await Payment.findAll();
        res.json(payments);
    } catch (error) {
        res.status(500).json({ message: "Error fetching payments" });
    }
};

// Get payment by ID
export const getPaymentById = async (req, res) => {
    try {
        const payment = await Payment.findByPk(req.params.id);
        if (!payment) return res.status(404).json({ message: "Payment not found" });
        res.json(payment);
    } catch (error) {
        res.status(500).json({ message: "Error fetching payment" });
    }
};

// Create a new payment
export const createPayment = async (req, res) => {
    try {
        const { userId, userType, amount, paymentMethod, purpose, campaignId, eventId, notes } = req.body;

        const newPayment = await Payment.create({
            userId,
            userType,
            amount,
            paymentMethod,
            purpose,
            campaignId,
            eventId,
            notes,
            status: 'Pending', // Initially pending
        });

        // Here you would integrate with payment gateway (JazzCash, Easypaisa, etc.)
        // For now, simulate payment processing
        setTimeout(async () => {
            await newPayment.update({ status: 'Completed', transactionId: `TXN${Date.now()}` });
        }, 1000);

        res.status(201).json(newPayment);
    } catch (error) {
        res.status(400).json({ message: "Error creating payment" });
    }
};

// Update payment status
export const updatePaymentStatus = async (req, res) => {
    try {
        const { status, transactionId } = req.body;
        const [affectedCount] = await Payment.update(
            { status, transactionId },
            { where: { id: req.params.id } }
        );

        if (affectedCount === 0) return res.status(404).json({ message: "Payment not found" });

        const updatedPayment = await Payment.findByPk(req.params.id);
        res.status(200).json(updatedPayment);
    } catch (error) {
        res.status(500).json({ message: "Error updating payment status" });
    }
};

// Get payments by user
export const getPaymentsByUser = async (req, res) => {
    try {
        const { userId, userType } = req.params;
        const payments = await Payment.findAll({
            where: { userId, userType }
        });
        res.json(payments);
    } catch (error) {
        res.status(500).json({ message: "Error fetching payments by user" });
    }
};

// Get payments by campaign
export const getPaymentsByCampaign = async (req, res) => {
    try {
        const campaignId = req.params.id;
        const payments = await Payment.findAll({
            where: { campaignId }
        });
        res.json(payments);
    } catch (error) {
        res.status(500).json({ message: "Error fetching payments by campaign" });
    }
};

// Refund payment
export const refundPayment = async (req, res) => {
    try {
        const payment = await Payment.findByPk(req.params.id);
        if (!payment) return res.status(404).json({ message: "Payment not found" });

        if (payment.status !== 'Completed') {
            return res.status(400).json({ message: "Only completed payments can be refunded" });
        }

        await payment.update({ status: 'Refunded' });

        res.status(200).json({ message: "Payment refunded successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error refunding payment" });
    }
};
