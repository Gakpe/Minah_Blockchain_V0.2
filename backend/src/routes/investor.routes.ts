import { Router } from "express";
import { createInvestor, getAllInvestors, getInvestorCount } from "../controllers/investor.controller";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Investors
 *   description: Investor management endpoints
 */

router.post("/create", createInvestor);
router.get("/", getAllInvestors);
router.get("/count", getInvestorCount);

export default router;
