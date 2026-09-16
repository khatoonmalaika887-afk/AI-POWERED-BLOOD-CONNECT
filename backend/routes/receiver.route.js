import express from "express";
import upload from "../utils/Multer.js";
import {
    getReceivers,
    getReceiverById,
    createReceiver,
    updateReceiver,
    deleteReceiver,
    activateDeactivateReceiver,
    createBloodRequest,
    getBloodRequestsByReceiver,
    searchDonors,
} from "../controllers/receiver.controller.js";

const router = express.Router();

router.get("/", getReceivers);
router.get("/:id", getReceiverById);
router.post("/", upload.single("image"), createReceiver);
router.put("/:id", upload.single("image"), updateReceiver);
router.delete("/:id", deleteReceiver);
router.patch("/:id/toggle-status", activateDeactivateReceiver);

// Blood request routes
router.post("/:id/blood-request", createBloodRequest);
router.get("/:id/blood-requests", getBloodRequestsByReceiver);

// Search routes
router.get("/search/donors", searchDonors);

export default router;
