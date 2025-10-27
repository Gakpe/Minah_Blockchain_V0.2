import { Router } from "express";
import { getInvestmentState } from "../controllers/investment-state.controller";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Investment State
 *   description: Investment state management endpoints
 */

router.get("/", getInvestmentState);

export default router;