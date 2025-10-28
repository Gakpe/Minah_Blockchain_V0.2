import { Request, Response } from "express";
import { Vault } from "../models/Investor";
import { stellarService } from "../services/stellar.service";

/**
 * @swagger
 * /api/vaults:
 *   post:
 *     summary: Create a new vault
 *     description: Creates a new vault in MongoDB
 *     tags: [Vaults]
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
 *               InternalwalletAddress:
 *                 type: string
 *                 example: "GAOLV5BREHSMYOJ6GXNMJGZH2RKHYJLP7ATOU7RZQYVAM42FSSHTLLRS"
 *               vaultID:
 *                 type: string
 *                 example: "vault_123"
 *               assetID:
 *                 type: string
 *                 example: "asset_456"
 *               name:
 *                 type: string
 *                 example: "My Investment Vault"
 *               vaultAddress:
 *                 type: string
 *                 example: "GAOLV5BREHSMYOJ6GXNMJGZH2RKHYJLP7ATOU7RZQYVAM42FSSHTLLRS"
 *     responses:
 *       201:
 *         description: Vault created successfully
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
 *                   example: "Vault created successfully"
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
 *         description: Conflict - vault already exists
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
export const createVault = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      walletAddress,
      InternalwalletAddress,
      vaultID,
      assetID,
      name,
      vaultAddress
    } = req.body;

    // Validate Stellar address formats if provided
    if (walletAddress && !stellarService.validateAddress(walletAddress)) {
      res.status(400).json({
        success: false,
        message: "Invalid Stellar wallet address format",
      });
      return;
    }

    if (InternalwalletAddress && !stellarService.validateAddress(InternalwalletAddress)) {
      res.status(400).json({
        success: false,
        message: "Invalid internal wallet address format",
      });
      return;
    }

    if (vaultAddress && !stellarService.validateAddress(vaultAddress)) {
      res.status(400).json({
        success: false,
        message: "Invalid vault address format",
      });
      return;
    }

    // Check if vault already exists
    if (vaultID) {
      const existingVault = await Vault.findOne({ vaultID });
      if (existingVault) {
        res.status(409).json({
          success: false,
          message: "Vault already exists",
          error: "Vault ID already registered",
        });
        return;
      }
    }

    // Create vault in MongoDB
    const newVault = new Vault({
      walletAddress,
      InternalwalletAddress,
      vaultID,
      assetID,
      name,
      vaultAddress,
    });

    await newVault.save();

    res.status(201).json({
      success: true,
      message: "Vault created successfully",
      data: {
        vault: {
          id: newVault._id,
          walletAddress: newVault.walletAddress,
          InternalwalletAddress: newVault.InternalwalletAddress,
          vaultID: newVault.vaultID,
          assetID: newVault.assetID,
          name: newVault.name,
          vaultAddress: newVault.vaultAddress,
        },
      },
    });
  } catch (error: any) {
    console.error("Error creating vault:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message || "An unexpected error occurred",
    });
  }
};