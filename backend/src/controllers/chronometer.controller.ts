import { Request, Response } from "express";
import { stellarService } from "../services/stellar.service";

/**
 * @swagger
 * /api/chronometer/start:
 *   post:
 *     summary: Start the chronometer for ROI distribution
 *     description: Starts the chronometer on the Stellar blockchain contract to begin the ROI distribution countdown
 *     tags: [Chronometer]
 *     responses:
 *       200:
 *         description: Chronometer started successfully
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
 *                   example: "Chronometer started successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     transactionHash:
 *                       type: string
 *                       example: "abc123def456..."
 *       400:
 *         description: Bad request - chronometer already started
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
export const startChronometer = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    // Start chronometer on Stellar blockchain
    let transactionHash: string;
    try {
      transactionHash = await stellarService.startChronometer();
    } catch (stellarError: any) {
      console.error("Stellar transaction error:", stellarError);
      res.status(500).json({
        success: false,
        message: "Failed to start chronometer on blockchain",
        error: stellarError.message || "Stellar transaction failed",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Chronometer started successfully",
      data: {
        transactionHash,
      },
    });
  } catch (error: any) {
    console.error("Error starting chronometer:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message || "An unexpected error occurred",
    });
  }
};

/**
 * @swagger
 * /api/chronometer/details:
 *   get:
 *     summary: Get chronometer details
 *     description: Retrieves the current status of the chronometer including whether it's started and the begin date if started
 *     tags: [Chronometer]
 *     responses:
 *       200:
 *         description: Chronometer details retrieved successfully
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
 *                   example: "Chronometer details retrieved successfully"
 *                 data:
 *                   $ref: '#/components/schemas/ChronometerDetails'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export const getChronometerDetails = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    // Check if chronometer is started
    const isStarted = await stellarService.isChronometerStarted();
    
    let beginDate: bigint | null = null;
    let beginDateUTC: string | null = null;

    // If chronometer is started, get the begin date
    if (isStarted) {
      try {
        beginDate = await stellarService.getChronometerBeginDate();
        // Convert from seconds to milliseconds and create UTC string
        beginDateUTC = new Date(Number(beginDate) * 1000).toUTCString();
      } catch (error) {
        console.error("Error getting begin date:", error);
        // Continue without begin date if there's an error fetching it
      }
    }

    res.status(200).json({
      success: true,
      message: "Chronometer details retrieved successfully",
      data: {
        isStarted,
        beginDate: beginDate ? beginDate.toString() : null,
        beginDateUTC,
      },
    });
  } catch (error: any) {
    console.error("Error retrieving chronometer details:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message || "An unexpected error occurred",
    });
  }
};