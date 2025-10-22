import { Router } from "express";
import { startChronometer } from "../controllers/investor.controller";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Chronometer
 *   description: Chronometer management endpoints
 */

router.post("/", startChronometer);

export default router;
