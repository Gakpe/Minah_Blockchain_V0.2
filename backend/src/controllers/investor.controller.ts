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
 *               autoFuel:
 *                 type: boolean
 *                 example: false
 *               walletAddress:
 *                 type: string
 *                 example: "GAOLV5BREHSMYOJ6GXNMJGZH2RKHYJLP7ATOU7RZQYVAM42FSSHTLLRS"
 *               InternalwalletAddress:
 *                 type: string
 *                 example: "GAOLV5BREHSMYOJ6GXNMJGZH2RKHYJLP7ATOU7RZQYVAM42FSSHTLLRS"
 *               vaultID:
 *                 type: string
 *                 example: "vault_123"
 *               issuer:
 *                 type: string
 *                 example: "Issuer Corp"
 *               nationality:
 *                 type: string
 *                 example: "US"
 *               first_name:
 *                 type: string
 *                 example: "Ayoub"
 *               last_name:
 *                 type: string
 *                 example: "Buoya"
 *               address:
 *                 type: string
 *                 example: "123 Main St, City, Country"
 *               profilePicture:
 *                 type: string
 *                 example: "https://example.com/profile.jpg"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "ayoub@gmail.com"
 *               investor:
 *                 type: boolean
 *                 example: true
 *               loginCount:
 *                 type: number
 *                 example: 0
 *               accountVerified:
 *                 type: boolean
 *                 example: false
 *               lastLoginAt:
 *                 type: string
 *                 format: date-time
 *               createdAt:
 *                 type: string
 *                 format: date-time
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
    const {
      autoFuel,
      walletAddress,
      InternalwalletAddress,
      vaultID,
      issuer,
      nationality,
      first_name,
      last_name,
      address,
      profilePicture,
      email,
      investor,
      loginCount,
      accountVerified,
      lastLoginAt,
      createdAt,
    } = req.body;

    // Validate email format if provided
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        res.status(400).json({
          success: false,
          message: "Invalid email format",
        });
        return;
      }
    }

    // Validate Stellar address format if provided
    if (walletAddress && !stellarService.validateAddress(walletAddress)) {
      res.status(400).json({
        success: false,
        message: "Invalid Stellar wallet address format",
      });
      return;
    }

    if (
      InternalwalletAddress &&
      !stellarService.validateAddress(InternalwalletAddress)
    ) {
      res.status(400).json({
        success: false,
        message: "Invalid internal wallet address format",
      });
      return;
    }

    // Check if investor already exists in MongoDB
    let existingInvestor = null;
    if (email || walletAddress) {
      const query: any = { $or: [] };
      if (email) query.$or.push({ email });
      if (walletAddress) query.$or.push({ walletAddress });

      existingInvestor = await Investor.findOne(query);
    }

    if (existingInvestor) {
      res.status(409).json({
        success: false,
        message: "Investor already exists",
        error:
          existingInvestor.email === email
            ? "Email already registered"
            : "Wallet address already registered",
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
      autoFuel,
      walletAddress,
      InternalwalletAddress,
      vaultID,
      issuer,
      nationality,
      first_name,
      last_name,
      address,
      profilePicture,
      email: email?.toLowerCase(),
      investor,
      loginCount: loginCount || 0,
      accountVerified: accountVerified || false,
      lastLoginAt,
      createdAt: createdAt || new Date(),
    });

    await newInvestor.save();

    res.status(201).json({
      success: true,
      message: "Investor created successfully",
      data: {
        investor: {
          id: newInvestor._id,
          autoFuel: newInvestor.autoFuel,
          walletAddress: newInvestor.walletAddress,
          InternalwalletAddress: newInvestor.InternalwalletAddress,
          vaultID: newInvestor.vaultID,
          issuer: newInvestor.issuer,
          nationality: newInvestor.nationality,
          first_name: newInvestor.first_name,
          last_name: newInvestor.last_name,
          address: newInvestor.address,
          profilePicture: newInvestor.profilePicture,
          email: newInvestor.email,
          investor: newInvestor.investor,
          loginCount: newInvestor.loginCount,
          accountVerified: newInvestor.accountVerified,
          totalAmountInvested: newInvestor.totalAmountInvested,
          amountInvested: newInvestor.amountInvested,
          lastLoginAt: newInvestor.lastLoginAt,
          createdAt: newInvestor.createdAt,
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

    res.status(200).json({
      success: true,
      message: "Investors retrieved successfully",
      data: {
        investors: investors.map(investor => ({
          id: investor._id,
          autoFuel: investor.autoFuel,
          walletAddress: investor.walletAddress,
          InternalwalletAddress: investor.InternalwalletAddress,
          vaultID: investor.vaultID,
          issuer: investor.issuer,
          nationality: investor.nationality,
          first_name: investor.first_name,
          last_name: investor.last_name,
          address: investor.address,
          profilePicture: investor.profilePicture,
          email: investor.email,
          investor: investor.investor,
          loginCount: investor.loginCount,
          accountVerified: investor.accountVerified,
          totalAmountInvested: investor.totalAmountInvested,
          amountInvested: investor.amountInvested,
          lastLoginAt: investor.lastLoginAt,
          createdAt: investor.createdAt,
        })),
        count: investors.length,
      },
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
 * /api/start_chronometer:
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
