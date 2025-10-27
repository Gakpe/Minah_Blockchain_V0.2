import { Request, Response } from "express";
import { stellarService } from "../services/stellar.service";

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

    // Map state number to human-readable name
    const stateNames = [
      "BuyingPhase",
      "BeforeFirstRelease", 
      "SixMonthsDone",
      "TenMonthsDone",
      "OneYearTwoMonthsDone",
      "OneYearSixMonthsDone", 
      "OneYearTenMonthsDone",
      "TwoYearsTwoMonthsDone",
      "TwoYearsSixMonthsDone",
      "TwoYearsTenMonthsDone",
      "ThreeYearsTwoMonthsDone",
      "ThreeYearsSixMonthsDone",
      "Ended"
    ];

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