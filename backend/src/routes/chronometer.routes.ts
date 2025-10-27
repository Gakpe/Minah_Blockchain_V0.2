import { Router } from "express";
import {
  startChronometer,
  getChronometerDetails,
} from "../controllers/chronometer.controller";

const router = Router();

// Start chronometer
router.post("/start", startChronometer);

// Get chronometer details
router.get("/details", getChronometerDetails);

export default router;
