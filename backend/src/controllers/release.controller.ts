import { Request, Response } from "express";
import { stellarService } from "../services/stellar.service";
import { formatUnits, parseUnits } from "viem";
import { CONFIG, stateNames } from "../config";

/**
 * @swagger
 * /api/release/calculate/{percent}:
 *   get:
 *     summary: Calculate amount to release for a given percentage
 *     description: Calculates the total amount to release for all investors based on a given ROI percentage
 *     tags: [Release]
 *     parameters:
 *       - in: path
 *         name: percent
 *         required: true
 *         schema:
 *           type: number
 *         description: The percentage of ROI to be released (scaled by 1,000,000 for precision)
 *         example: 4
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
    const { percent } = req.params;

    // Validation
    if (percent === undefined || percent === null) {
      res.status(400).json({
        success: false,
        message: "Missing required parameter",
        error: "percent parameter is required",
      });
      return;
    }

    // Convert percent to number
    const percentNumber = parseFloat(percent);

    // Validate percent is a number
    if (isNaN(percentNumber)) {
      res.status(400).json({
        success: false,
        message: "Invalid percent value",
        error: "percent must be a valid number",
      });
      return;
    }

    // Validate percent is positive
    if (percentNumber < 0) {
      res.status(400).json({
        success: false,
        message: "Invalid percent value",
        error: "percent must be a positive number",
      });
      return;
    }

    // Scale percent by 10,000,000 for precision
    const scaledPercent = parseUnits(
      percentNumber.toString(),
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
    const isChronometerStarted = await stellarService.isChronometerStarted();

    if (!isChronometerStarted) {
      res.status(400).json({
        success: false,
        message: "Distribution not ready to be released",
        error: "Chronometer has not started",
      });
      return;
    }

    const investmentState = await stellarService.getCurrentInvestmentState();

    if (investmentState === stateNames.length - 1) {
      res.status(400).json({
        success: false,
        message: "Distribution cannot be released",
        error: "Investment has ended",
      });
      return;
    }

    if (investmentState === 0) {
      res.status(400).json({
        success: false,
        message: "Distribution cannot be released",
        error: "Investment is not started",
      });
      return;
    }

    // Calculate the elapsed time since chronometer began
    const chronometerBeginDate = Number(
      await stellarService.getChronometerBeginDate()
    );

    const elapsedTime = Math.floor(Date.now() / 1000) - chronometerBeginDate;

    // Calculate the required time for the current stage
    const currentStageIndex = investmentState - 1;

    const distributionIntervals =
      await stellarService.getDistributionIntervals();

    const requiredTime = Number(distributionIntervals[currentStageIndex]);

    if (elapsedTime < requiredTime) {
      res.status(400).json({
        success: false,
        message: "Distribution not ready to be released",
        error: "Required time interval has not elapsed",
      });
      return;
    }

    // Check if there is investors to distribute to
    const investorCount = await stellarService.getInvestorsArrayLength();

    if (investorCount === 0) {
      res.status(400).json({
        success: false,
        message: "No investors to distribute to",
        error: "Investor list is empty",
      });
      return;
    }

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
