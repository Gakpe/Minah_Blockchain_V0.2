import { Request, Response } from "express";
import { stellarService } from "../services/stellar.service";
import { stateNames } from "../config";

/**
 * @swagger
 * /api/investment-state:
 *   get:
 *     summary: Get current investment state
 *     description: Retrieves the current state of the investment from the smart contract
 *     tags: [Investment State]
 *     responses:
 *       200:
 *         description: Investment state retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Investment state retrieved successfully"
 *                 data:
 *                   $ref: '#/components/schemas/InvestmentState'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export const getInvestmentState = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    // Get current investment state from the contract
    const state = await stellarService.getCurrentInvestmentState();

    const stateName = stateNames[state] || "Unknown";

    res.status(200).json({
      success: true,
      message: "Investment state retrieved successfully",
      data: {
        state,
        stateName,
      },
    });
  } catch (error: any) {
    console.error("Error retrieving investment state:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message || "An unexpected error occurred",
    });
  }
};

/**
 * @swagger
 * /api/investment-state/nft-supply:
 *   get:
 *     summary: Get current NFT supply
 *     description: Retrieves the current supply of NFTs from the smart contract
 *     tags: [Investment State]
 *     responses:
 *       200:
 *         description: NFT supply retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "NFT supply retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     currentSupply:
 *                       type: number
 *                       example: 150
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export const getCurrentNFTSupply = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    // Get current NFT supply from the contract
    const currentSupply = await stellarService.getCurrentNFTSupply();

    res.status(200).json({
      success: true,
      message: "NFT supply retrieved successfully",
      data: {
        currentSupply,
      },
    });
  } catch (error: any) {
    console.error("Error retrieving NFT supply:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message || "An unexpected error occurred",
    });
  }
};
