import express from "express";
import upload from "../utils/Multer.js"; // Assuming you have multer setup for image uploads
import {
    getHospitals,
    getHospitalById,
    createHospital,
    registerHospital,
    updateHospital,
    deleteHospital,
    toggleHospitalStatus,
    updateHospitalApproval,
} from "../controllers/hospital.controller.js";

const router = express.Router();

router.get("/", getHospitals);
router.post("/register", upload.single("image"), registerHospital);
router.get("/:id", getHospitalById);
router.post("/", upload.single("image"), createHospital);
router.put("/:id", upload.single("image"), updateHospital);
router.delete("/:id", deleteHospital);
router.patch("/:id/toggle-status", toggleHospitalStatus);
router.patch("/:id/approval", updateHospitalApproval);

export default router;