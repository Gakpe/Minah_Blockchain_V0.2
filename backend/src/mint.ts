#!/usr/bin/env node
import { CONFIG } from "./config";
import { stellarService } from "./services/stellar.service";

/**
 * Mint NFT Script
 *
 * This script mints NFTs to a specified user address.
 * It performs the following steps:
 * 1. Validates the user address
 * 2. Gets the NFT price from the contract
 * 3. Checks the mint account's USDC balance
 * 4. Approves the contract to spend USDC
 * 5. Mints the NFT
 *
 * Usage:
 *   npm run mint <amount>
 *   or
 *   ts-node src/mint.ts <amount>
 *
 * Example:
 *   npm run mint 5
 */

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.error("Usage: npm run mint <amount>");
    console.error("Example: npm run mint 5");
    process.exit(1);
  }

  const userAddress = CONFIG.stellar.mintPublicKey;
  const amount = parseInt(args[0], 10);

  if (isNaN(amount) || amount <= 0) {
    console.error("Error: Amount must be a positive number");
    process.exit(1);
  }

  if (!stellarService.validateAddress(userAddress)) {
    console.error("Error: Invalid Stellar address");
    process.exit(1);
  }

  console.log("=".repeat(60));
  console.log("Minah NFT Minting Script");
  console.log("=".repeat(60));
  console.log(`User Address: ${userAddress}`);
  console.log(`Amount: ${amount}`);
  console.log("=".repeat(60));
  console.log("");

  try {
    const transactionHash = await stellarService.mintNFT(userAddress, amount);

    console.log("");
    console.log("=".repeat(60));
    console.log("✅ Minting Successful!");
    console.log("=".repeat(60));
    console.log(`Transaction Hash: ${transactionHash}`);
    console.log(
      `View on Stellar Expert: https://stellar.expert/explorer/testnet/tx/${transactionHash}`
    );
    console.log("=".repeat(60));

    process.exit(0);
  } catch (error) {
    console.error("");
    console.error("=".repeat(60));
    console.error("❌ Minting Failed!");
    console.error("=".repeat(60));
    console.error("Error:", error);
    console.error("=".repeat(60));
    process.exit(1);
  }
}

main();
