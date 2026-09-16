import express from "express";
import {
    getBloodRequests,
    getBloodRequestById,
    createBloodRequest,
    updateBloodRequestStatus,
    deleteBloodRequest,
    getBloodRequestsByHospital,
    checkHospitalStock,
    notifyNearbyDonors,
    notifyHospital,
    donorAcceptRequest,
    hospitalConfirmAvailability,
    arrangeConnection,
    recordSuccessfulDonation
} from "../controllers/bloodRequest.controller.js";

const router = express.Router();

router.get("/", getBloodRequests);
router.post("/", createBloodRequest);
router.get("/:id", getBloodRequestById);
router.patch("/:id/status", updateBloodRequestStatus);
router.delete("/:id", deleteBloodRequest);

// Hospital-specific routes
router.get("/hospital/:id", getBloodRequestsByHospital);

// Stock checking
router.get("/stock/check", checkHospitalStock);

// Workflow implementation routes
router.post("/:id/notify-donors", notifyNearbyDonors); // Emergency alert
router.post("/:id/notify-hospital", notifyHospital); // Stock request
router.post("/:id/donor-accept", donorAcceptRequest); // Donor accepts and shares location
router.post("/:id/hospital-confirm", hospitalConfirmAvailability); // Hospital confirms availability
router.post("/:id/arrange-connection", arrangeConnection); // Connection arrangement
router.post("/:id/record-donation", recordSuccessfulDonation); // Successful donation

export default router;
