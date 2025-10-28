import { Router } from "express";
import {
  getInvestmentState,
  getCurrentNFTSupply,
} from "../controllers/investment-state.controller";

const router = Router();

router.get("/", getInvestmentState);
router.get("/nft-supply", getCurrentNFTSupply);

export default router;
