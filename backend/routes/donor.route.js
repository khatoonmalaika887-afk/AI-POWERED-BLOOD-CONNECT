import express from "express";
import upload from "../utils/multer.js";
import {
    getDonors,
    getDonorById,
    createDonor,
    updateDonor,
    deleteDonor,
    activateDeactivateDonor,
    updateHealthStatus,
    updateAppointmentStatus,
    getDonorDonationHistory,
    toggleEmergencyNotifications
} from "../controllers/donor.controller.js";

const router = express.Router();

// Donor CRUD Routes
router.get("/", getDonors); // Get all donors
router.get("/:id", getDonorById); // Get a single donor by ID
router.post("/", upload.single('image'), createDonor); // Create a new donor with image upload
router.put("/:id", upload.single('image'), updateDonor); // Update donor details with image upload
router.patch("/:id/toggle-status", activateDeactivateDonor); // Activate/Deactivate donor
router.delete("/:id", deleteDonor); // Delete donor

// ✅ New Routes for Updating Health and Appointment Status
router.patch("/:id/health-status", updateHealthStatus); // Update health status
router.patch("/:id/appointment-status", updateAppointmentStatus); // Update appointment status

// Donor Module Features
router.get("/:id/donation-history", getDonorDonationHistory); // Get donation history
router.patch("/:id/emergency-notifications", toggleEmergencyNotifications); // Toggle emergency notifications

export default router;
