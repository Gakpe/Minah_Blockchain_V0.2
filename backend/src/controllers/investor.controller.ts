import { Request, Response } from "express";
import { Investor } from "../models/Investor";
import { stellarService } from "../services/stellar.service";

/**
 * @swagger
 * /api/investors:
 *   post:
 *     summary: Create a new investor
 *     description: Creates a new investor profile in MongoDB and registers them on the Stellar blockchain
 *     tags: [Investors]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - stellarAddress
 *               - email
 *               - firstName
 *               - lastName
 *             properties:
 *               stellarAddress:
 *                 type: string
 *                 description: Stellar blockchain address
 *                 example: "GALXBNO5FE4BGADFPNHNLOKCEHD6B7CBVE57BN6AXQQY5EYK4Q7IYTGM"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "ayoub@gmail.com"
 *               firstName:
 *                 type: string
 *                 example: "Ayoub"
 *               lastName:
 *                 type: string
 *                 example: "Buoya"
 *     responses:
 *       201:
 *         description: Investor created successfully
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
 *                   example: "Investor created successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *       400:
 *         description: Bad request - validation errors
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Conflict - investor already exists
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
export const createInvestor = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { stellarAddress, email, firstName, lastName } = req.body;

    // Validation
    if (!stellarAddress || !email || !firstName || !lastName) {
      res.status(400).json({
        success: false,
        message: "Missing required fields",
        error: "stellarAddress, email, firstName, and lastName are required",
      });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
      return;
    }

    // Validate Stellar address format
    if (!stellarService.validateAddress(stellarAddress)) {
      res.status(400).json({
        success: false,
        message: "Invalid Stellar address format",
      });
      return;
    }

    // Check if investor already exists in MongoDB
    const existingInvestor = await Investor.findOne({
      $or: [{ email }, { stellarAddress }],
    });

    if (existingInvestor) {
      res.status(409).json({
        success: false,
        message: "Investor already exists",
        error:
          existingInvestor.email === email
            ? "Email already registered"
            : "Stellar address already registered",
      });
      return;
    }

    // Create investor on Stellar blockchain
    let transactionHash: string;
    try {
      transactionHash = await stellarService.createInvestor(stellarAddress);
    } catch (stellarError: any) {
      console.error("Stellar transaction error:", stellarError);
      res.status(500).json({
        success: false,
        message: "Failed to create investor on blockchain",
        error: stellarError.message || "Stellar transaction failed",
      });
      return;
    }

    // Create investor in MongoDB
    const investor = new Investor({
      stellarAddress,
      email: email.toLowerCase(),
      firstName,
      lastName,
      nftBalance: 0,
      totalInvested: 0,
      claimedAmount: 0,
    });

    await investor.save();

    res.status(201).json({
      success: true,
      message: "Investor created successfully",
      data: {
        investor: {
          id: investor._id,
          stellarAddress: investor.stellarAddress,
          email: investor.email,
          firstName: investor.firstName,
          lastName: investor.lastName,
          // phoneNumber, country and kycStatus removed from response
          nftBalance: investor.nftBalance,
          totalInvested: investor.totalInvested,
          claimedAmount: investor.claimedAmount,
          createdAt: investor.createdAt,
          updatedAt: investor.updatedAt,
        },
        transactionHash,
      },
    });
  } catch (error: any) {
    console.error("Error creating investor:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message || "An unexpected error occurred",
    });
  }
};
