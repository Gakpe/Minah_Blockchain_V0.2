import { Router } from "express";
import { createInvestor, getAllInvestors, getInvestorCount, getInvestorClaimedAmount } from "../controllers/investor.controller";

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
router.get("/:id/claimed-amount", getInvestorClaimedAmount);

export default router;
