import { Router } from "express";
import {
  getStablecoinAddress,
  getReceiverAddress,
  getPayerAddress,
  getNFTPrice,
  getTotalSupply,
  getMinNftsToMint,
  getMaxNftsPerInvestor,
  getNftBuyingPhaseSupply,
  getDistributionIntervals,
  getRoiPercentages,
  getInvestorsArrayLength,
  isInvestor,
} from "../controllers/contract-info.controller";

const router = Router();

router.get("/stablecoin", getStablecoinAddress);
router.get("/receiver", getReceiverAddress);
router.get("/payer", getPayerAddress);
router.get("/nft-price", getNFTPrice);
router.get("/total-supply", getTotalSupply);
router.get("/min-nfts-to-mint", getMinNftsToMint);
router.get("/max-nfts-per-investor", getMaxNftsPerInvestor);
router.get("/nft-buying-phase-supply", getNftBuyingPhaseSupply);
router.get("/distribution-intervals", getDistributionIntervals);
router.get("/roi-percentages", getRoiPercentages);
router.get("/investors-array-length", getInvestorsArrayLength);
router.get("/is-investor/:address", isInvestor);

export default router;
