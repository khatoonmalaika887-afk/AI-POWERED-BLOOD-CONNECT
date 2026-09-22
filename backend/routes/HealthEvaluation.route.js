import express from "express";
import upload from "../utils/multer.js";

import {
  getHealthEvaluations,
  getHealthEvaluationById,
  getHealthEvaluationByDonorId,
  getHealthEvaluationByHospitalId,
  createEvaluation,
  updateEvaluationDateTime,
  cancelEvaluation,
  acceptEvaluation,
  arrivedForEvaluation,
  completeEvaluation,
  deleteHealthEvaluation,
  cancelEvaluationDonor,
  findLastUpdatedEvaluationByDonor,
} from "../controllers/HealthEvaluation.controller.js";

const router = express.Router();

router.get("/hospital/:id", getHealthEvaluationByHospitalId);
router.get("/donor/:id", getHealthEvaluationByDonorId);
router.get("/", getHealthEvaluations);
router.get("/:id", getHealthEvaluationById);
router.post("/", createEvaluation);
router.patch("/:id/date-time", updateEvaluationDateTime); 
router.patch("/:id/cancel", cancelEvaluation); 
router.patch("/:id/cancelD", cancelEvaluationDonor);
router.delete("/:id", deleteHealthEvaluation);
router.patch("/:id/accept", acceptEvaluation);
router.patch("/:id/arrived", arrivedForEvaluation);
router.get("/donor/:id/last-updated", findLastUpdatedEvaluationByDonor);
router.patch("/:id/complete", upload.single('evaluationFile'), completeEvaluation);

export default router;
