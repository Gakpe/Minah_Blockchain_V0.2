import { Request, Response } from "express";
import { stellarService } from "../services/stellar.service";

/**
 * @swagger
 * tags:
 *   name: Contract Info
 *   description: Read-only endpoints exposing on-chain Minah contract data
 */

/**
 * @swagger
 * /api/contract-info/stablecoin:
 *   get:
 *     summary: Get stablecoin contract address
 *     description: Returns the stablecoin address used for payments
 *     tags: [Contract Info]
 *     responses:
 *       200:
 *         description: Address retrieved
 *       500:
 *         description: Internal server error
 */
export const getStablecoinAddress = async (_req: Request, res: Response) => {
  try {
    const address = await stellarService.getStablecoinAddress();
    res.status(200).json({ success: true, message: "Stablecoin address retrieved", data: { address } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
};

/**
 * @swagger
 * /api/contract-info/receiver:
 *   get:
 *     summary: Get receiver address
 *     description: Returns the address that receives funds during mint
 *     tags: [Contract Info]
 *     responses:
 *       200:
 *         description: Address retrieved
 *       500:
 *         description: Internal server error
 */
export const getReceiverAddress = async (_req: Request, res: Response) => {
  try {
    const address = await stellarService.getReceiverAddress();
    res.status(200).json({ success: true, message: "Receiver address retrieved", data: { address } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
};

/**
 * @swagger
 * /api/contract-info/payer:
 *   get:
 *     summary: Get payer address
 *     description: Returns the payer address used during ROI distributions
 *     tags: [Contract Info]
 *     responses:
 *       200:
 *         description: Address retrieved
 *       500:
 *         description: Internal server error
 */
export const getPayerAddress = async (_req: Request, res: Response) => {
  try {
    const address = await stellarService.getPayerAddress();
    res.status(200).json({ success: true, message: "Payer address retrieved", data: { address } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
};

/**
 * @swagger
 * /api/contract-info/nft-price:
 *   get:
 *     summary: Get NFT price
 *     description: Returns the NFT price in USDC (integer, unscaled)
 *     tags: [Contract Info]
 *     responses:
 *       200:
 *         description: Price retrieved
 *       500:
 *         description: Internal server error
 */
export const getNFTPrice = async (_req: Request, res: Response) => {
  try {
    const price = await stellarService.getNFTPrice();
    res.status(200).json({ success: true, message: "NFT price retrieved", data: { price: price.toString() } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
};

/**
 * @swagger
 * /api/contract-info/total-supply:
 *   get:
 *     summary: Get total NFT supply cap
 *     tags: [Contract Info]
 *     responses:
 *       200:
 *         description: Total supply retrieved
 *       500:
 *         description: Internal server error
 */
export const getTotalSupply = async (_req: Request, res: Response) => {
  try {
    const totalSupply = await stellarService.getTotalSupply();
    res.status(200).json({ success: true, message: "Total supply retrieved", data: { totalSupply } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
};

/**
 * @swagger
 * /api/contract-info/min-nfts-to-mint:
 *   get:
 *     summary: Get minimum NFTs to mint
 *     tags: [Contract Info]
 *     responses:
 *       200:
 *         description: Min NFTs to mint retrieved
 *       500:
 *         description: Internal server error
 */
export const getMinNftsToMint = async (_req: Request, res: Response) => {
  try {
    const min = await stellarService.getMinNftsToMint();
    res.status(200).json({ success: true, message: "Min NFTs to mint retrieved", data: { min } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
};

/**
 * @swagger
 * /api/contract-info/max-nfts-per-investor:
 *   get:
 *     summary: Get maximum NFTs per investor
 *     tags: [Contract Info]
 *     responses:
 *       200:
 *         description: Max NFTs per investor retrieved
 *       500:
 *         description: Internal server error
 */
export const getMaxNftsPerInvestor = async (_req: Request, res: Response) => {
  try {
    const max = await stellarService.getMaxNftsPerInvestor();
    res.status(200).json({ success: true, message: "Max NFTs per investor retrieved", data: { max } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
};

/**
 * @swagger
 * /api/contract-info/nft-buying-phase-supply:
 *   get:
 *     summary: Get NFTs minted during buying phase
 *     tags: [Contract Info]
 *     responses:
 *       200:
 *         description: Buying phase NFT supply retrieved
 *       500:
 *         description: Internal server error
 */
export const getNftBuyingPhaseSupply = async (_req: Request, res: Response) => {
  try {
    const amount = await stellarService.getNftBuyingPhaseSupply();
    res.status(200).json({ success: true, message: "Buying phase NFT supply retrieved", data: { amount } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
};

/**
 * @swagger
 * /api/contract-info/distribution-intervals:
 *   get:
 *     summary: Get distribution intervals (seconds)
 *     tags: [Contract Info]
 *     responses:
 *       200:
 *         description: Intervals retrieved
 *       500:
 *         description: Internal server error
 */
export const getDistributionIntervals = async (_req: Request, res: Response) => {
  try {
    const intervals = await stellarService.getDistributionIntervals();
    res.status(200).json({ success: true, message: "Distribution intervals retrieved", data: { intervals: intervals.map(String) } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
};

/**
 * @swagger
 * /api/contract-info/roi-percentages:
 *   get:
 *     summary: Get ROI percentages per stage
 *     description: Percent values are integers; contract expects scaled values for calculations
 *     tags: [Contract Info]
 *     responses:
 *       200:
 *         description: ROI percentages retrieved
 *       500:
 *         description: Internal server error
 */
export const getRoiPercentages = async (_req: Request, res: Response) => {
  try {
    const percentages = await stellarService.getRoiPercentages();
    res.status(200).json({ success: true, message: "ROI percentages retrieved", data: { percentages: percentages.map(String) } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
};

/**
 * @swagger
 * /api/contract-info/investors-array-length:
 *   get:
 *     summary: Get on-chain investors array length
 *     tags: [Contract Info]
 *     responses:
 *       200:
 *         description: Length retrieved
 *       500:
 *         description: Internal server error
 */
export const getInvestorsArrayLength = async (_req: Request, res: Response) => {
  try {
    const length = await stellarService.getInvestorsArrayLength();
    res.status(200).json({ success: true, message: "Investors array length retrieved", data: { length } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
};

/**
 * @swagger
 * /api/contract-info/is-investor/{address}:
 *   get:
 *     summary: Check if address is an investor (on-chain)
 *     tags: [Contract Info]
 *     parameters:
 *       - in: path
 *         name: address
 *         schema:
 *           type: string
 *         required: true
 *         description: Stellar account address
 *     responses:
 *       200:
 *         description: Result retrieved
 *       400:
 *         description: Invalid address
 *       500:
 *         description: Internal server error
 */
export const isInvestor = async (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    if (!address || !stellarService.validateAddress(address)) {
      res.status(400).json({ success: false, message: "Invalid Stellar address" });
      return;
    }
    const result = await stellarService.isInvestor(address);
    res.status(200).json({ success: true, message: "Investor check completed", data: { isInvestor: result } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
};
