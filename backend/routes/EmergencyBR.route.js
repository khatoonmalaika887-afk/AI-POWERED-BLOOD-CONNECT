import express from 'express';
import upload from '../utils/multer.js';

import {
    getEmergencyRequests,
    getEmergencyRequestById,
    createEmergencyRequest,
    deleteEmergencyRequest,
    acceptEmergencyRequest,
    declineEmergencyRequest,
    validateEmergencyRequest 
} from '../controllers/EmergencyBR.controller.js';

const router = express.Router();

// Emergency Blood Request Routes
router.get("/", getEmergencyRequests);                    // Get all requests
router.get("/:id", getEmergencyRequestById);             // Get request by ID (updated param to :id)
router.post("/", upload.single('proofDocument'), createEmergencyRequest); // Create request with file upload
router.delete("/:id", deleteEmergencyRequest);           // Delete request by ID (updated param to :id)
router.put("/:id/accept", acceptEmergencyRequest);       // Accept request (updated param to :id)
router.put("/:id/decline", declineEmergencyRequest);     // Decline request (updated param to :id)
router.put("/:id/validate", validateEmergencyRequest);   // Validate (activate) request (new route)

export default router;