import { Router } from "express";
import { createInvestor } from "../controllers/investor.controller";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Investors
 *   description: Investor management endpoints
 */

router.post("/", createInvestor);

export default router;
