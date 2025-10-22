import { Request, Response } from "express";
import { stellarService } from "../services/stellar.service";
import { formatUnits, parseUnits } from "viem";
import { CONFIG } from "../config";

/**
 * @swagger
 * /api/release/calculate:
 *   post:
 *     summary: Calculate amount to release for a given percentage
 *     description: Calculates the total amount to release for all investors based on a given ROI percentage
 *     tags: [Release]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - percent
 *             properties:
 *               percent:
 *                 type: number
 *                 description: The percentage of ROI to be released (scaled by 1,000,000 for precision)
 *                 example: 4
 *     responses:
 *       200:
 *         description: Amount calculated successfully
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
 *                   example: "Amount calculated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     amount:
 *                       type: string
 *                       example: "180000000"
 *       400:
 *         description: Bad request - validation errors
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export const calculateAmountToRelease = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { percent } = req.body;

    // Validation
    if (percent === undefined || percent === null) {
      res.status(400).json({
        success: false,
        message: "Missing required field",
        error: "percent is required",
      });
      return;
    }

    // Validate percent is a number
    if (typeof percent !== "number" || isNaN(percent)) {
      res.status(400).json({
        success: false,
        message: "Invalid percent value",
        error: "percent must be a valid number",
      });
      return;
    }

    // Validate percent is positive
    if (percent < 0) {
      res.status(400).json({
        success: false,
        message: "Invalid percent value",
        error: "percent must be a positive number",
      });
      return;
    }

    // Scale percent by 10,000,000 for precision
    const scaledPercent = parseUnits(
      percent.toString(),
      CONFIG.stellar.usdc.decimals
    );
    // Calculate amount on Stellar blockchain
    let amount: bigint;
    try {
      amount = await stellarService.calculateAmountToRelease(scaledPercent);
    } catch (stellarError: any) {
      console.error("Stellar query error:", stellarError);
      res.status(500).json({
        success: false,
        message: "Failed to calculate amount on blockchain",
        error: stellarError.message || "Stellar query failed",
      });
      return;
    }

    // Descale amount back to normal
    const descaledAmount = formatUnits(amount, CONFIG.stellar.usdc.decimals);

    res.status(200).json({
      success: true,
      message: "Amount calculated successfully",
      data: {
        amount: descaledAmount,
      },
    });
  } catch (error: any) {
    console.error("Error calculating amount to release:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message || "An unexpected error occurred",
    });
  }
};

/**
 * @swagger
 * /api/release/distribute:
 *   post:
 *     summary: Release distribution for the current stage
 *     description: Triggers the release of ROI distribution to all investors for the current stage on the Stellar blockchain
 *     tags: [Release]
 *     responses:
 *       200:
 *         description: Distribution released successfully
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
 *                   example: "Distribution released successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     transactionHash:
 *                       type: string
 *                       example: "abc123def456..."
 *       400:
 *         description: Bad request - distribution not ready or already released
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export const releaseDistribution = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    // Release distribution on Stellar blockchain
    let transactionHash: string;
    try {
      transactionHash = await stellarService.releaseDistribution();
    } catch (stellarError: any) {
      console.error("Stellar transaction error:", stellarError);
      res.status(500).json({
        success: false,
        message: "Failed to release distribution on blockchain",
        error: stellarError.message || "Stellar transaction failed",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Distribution released successfully",
      data: {
        transactionHash,
      },
    });
  } catch (error: any) {
    console.error("Error releasing distribution:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message || "An unexpected error occurred",
    });
  }
};
