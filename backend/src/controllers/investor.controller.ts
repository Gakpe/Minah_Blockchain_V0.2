import { Request, Response } from "express";
import { Investor } from "../models/Investor";
import { stellarService } from "../services/stellar.service";

/**
 * @swagger
 * /api/investors/create:
 *   post:
 *     summary: Create a new investor
 *     description: Creates a new investor profile in MongoDB and optionally registers them on the Stellar blockchain
 *     tags: [Investors]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               walletAddress:
 *                 type: string
 *                 example: "GAOLV5BREHSMYOJ6GXNMJGZH2RKHYJLP7ATOU7RZQYVAM42FSSHTLLRS"
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
    const { walletAddress } = req.body;

    // Validate Stellar address format if provided
    if (walletAddress && !stellarService.validateAddress(walletAddress)) {
      res.status(400).json({
        success: false,
        message: "Invalid Stellar wallet address format",
      });
      return;
    }

    // Check if investor already exists in MongoDB
    let existingInvestor = null;

    if (walletAddress) {
      existingInvestor = await Investor.findOne({ walletAddress });
    }

    if (existingInvestor) {
      res.status(409).json({
        success: false,
        message: "Investor already exists",
        error: "Wallet address already registered",
      });

      return;
    }

    // Create investor on Stellar blockchain if wallet address is provided
    let transactionHash: string | undefined;
    if (walletAddress) {
      try {
        transactionHash = await stellarService.createInvestor(walletAddress);
      } catch (stellarError: any) {
        console.error("Stellar transaction error:", stellarError);
        res.status(500).json({
          success: false,
          message: "Failed to create investor on blockchain",
          error: stellarError.message || "Stellar transaction failed",
        });
        return;
      }
    }

    // Create investor in MongoDB
    const newInvestor = new Investor({
      walletAddress,
      createdAt: new Date(),
      creationTransactionHash: transactionHash,
    });

    await newInvestor.save();

    res.status(201).json({
      success: true,
      message: "Investor created successfully",
      data: {
        investor: {
          id: newInvestor._id,
          walletAddress: newInvestor.walletAddress,
          creationTransactionHash: newInvestor.creationTransactionHash,
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

/**
 * @swagger
 * /api/investors:
 *   get:
 *     summary: Get all investors
 *     description: Retrieves a list of all investors from MongoDB
 *     tags: [Investors]
 *     responses:
 *       200:
 *         description: Investors retrieved successfully
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
 *                   example: "Investors retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     investors:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Investor'
 *                     count:
 *                       type: number
 *                       example: 10
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export const getAllInvestors = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    // Get all investors from MongoDB
    const investors = await Investor.find({});

    // Mapping on all investors to return only necessary fields and calc their NFTs balance
    const investorsWithNFTs = await Promise.all(
      investors.map(async (investor) => {
        const balanceNFT = await stellarService.getInvestorNFTBalance(
          investor.walletAddress || ""
        );
        return {
          walletAddress: investor.walletAddress,
          balanceNFT,
        };
      })
    );

    res.status(200).json({
      success: true,
      message: "Investors retrieved successfully",
      data: investorsWithNFTs,
    });
  } catch (error: any) {
    console.error("Error retrieving investors:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message || "An unexpected error occurred",
    });
  }
};

/**
 * @swagger
 * /api/investors/count:
 *   get:
 *     summary: Get investor count
 *     description: Retrieves the total number of investors in the database
 *     tags: [Investors]
 *     responses:
 *       200:
 *         description: Investor count retrieved successfully
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
 *                   example: "Investor count retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     count:
 *                       type: number
 *                       example: 10
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export const getInvestorCount = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    // Get investor count from MongoDB
    const count = await Investor.countDocuments({});

    res.status(200).json({
      success: true,
      message: "Investor count retrieved successfully",
      data: {
        count,
      },
    });
  } catch (error: any) {
    console.error("Error retrieving investor count:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message || "An unexpected error occurred",
    });
  }
};

/**
 * @swagger
 * /api/investors/{id}/claimed-amount:
 *   get:
 *     summary: Get claimed amount for an investor
 *     description: Retrieves the claimed amount for a specific investor from the smart contract
 *     tags: [Investors]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Investor ID (MongoDB ObjectId) or wallet address
 *     responses:
 *       200:
 *         description: Claimed amount retrieved successfully
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
 *                   example: "Claimed amount retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     claimedAmount:
 *                       type: string
 *                       example: "5000000000"
 *                       description: Claimed amount in base units
 *                     claimedAmountFormatted:
 *                       type: string
 *                       example: "50.0"
 *                       description: Claimed amount formatted for display
 *       400:
 *         description: Invalid investor ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Investor not found
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
export const getInvestorClaimedAmount = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({
        success: false,
        message: "Investor ID is required",
      });
      return;
    }

    // Try to find investor by ID first, then by wallet address
    let investor;
    let walletAddress: string;

    // Check if the ID looks like a MongoDB ObjectId
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      investor = await Investor.findById(id);
      if (!investor) {
        res.status(404).json({
          success: false,
          message: "Investor not found",
        });
        return;
      }

      if (!investor.walletAddress) {
        res.status(400).json({
          success: false,
          message: "Investor wallet address not found",
        });
        return;
      }

      walletAddress = investor.walletAddress;
    } else {
      // Assume it's a wallet address
      walletAddress = id;

      // Validate the Stellar address format
      if (!stellarService.validateAddress(walletAddress)) {
        res.status(400).json({
          success: false,
          message: "Invalid Stellar wallet address format",
        });
        return;
      }
    }

    if (!walletAddress) {
      res.status(400).json({
        success: false,
        message: "Investor wallet address not found",
      });
      return;
    }

    // Get claimed amount from smart contract
    const claimedAmount =
      await stellarService.getInvestorClaimedAmount(walletAddress);

    // Format the amount (assuming 7 decimals like USDC)
    const DECIMALS = 7;
    const claimedAmountFormatted = (
      Number(claimedAmount) / Math.pow(10, DECIMALS)
    ).toString();

    res.status(200).json({
      success: true,
      message: "Claimed amount retrieved successfully",
      data: {
        claimedAmount: claimedAmount.toString(),
        claimedAmountFormatted,
        walletAddress,
      },
    });
  } catch (error: any) {
    console.error("Error retrieving claimed amount:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message || "An unexpected error occurred",
    });
  }
};
