import express from 'express'
import { signinD, signinA, signinH, signinHD, signinR } from '../controllers/auth.controller.js'
const router = express.Router();

router.post('/signind',signinD);
router.post('/signina',signinA);
router.post('/signinh',signinH);
router.post('/signinhd',signinHD);
router.post('/receiver-login', signinR);
export default router;
