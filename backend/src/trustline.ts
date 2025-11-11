import { CONFIG } from "./config";
import { stellarService } from "./services/stellar.service";


/** * Add Trustline Script
 *
 * This script adds a trustline for the USDC asset to a specified user address.
 * It performs the following steps:
 * 1. Validates the user address
 * 2. Adds the trustline
 *
 * Usage:
 *   npm run trustline <owner | minter>
 *   or
 *   ts-node src/trustline.ts <owner | minter>
 *
 * Example:
 *   npm run trustline minter
 */

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.error("Usage: npm run trustline <owner | minter>");
    console.error("Example: npm run trustline minter");
    process.exit(1);
  }

  const role = args[0];

  let userAddress: string;
  let secretKey: string;

  if (role === "owner") {
    userAddress = CONFIG.stellar.ownerPublicKey;
    secretKey = CONFIG.stellar.ownerSecretKey;
  } else if (role === "minter") {
    userAddress = CONFIG.stellar.mintPublicKey;
    secretKey = CONFIG.stellar.mintSecretKey;
  } else {
    console.error("Error: Role must be either 'owner' or 'minter'");
    console.error("Usage: npm run trustline <owner | minter>");
    process.exit(1);
  }

  console.log("=".repeat(60));
  console.log("Minah Add trustline Script");
  console.log("=".repeat(60));
  console.log(`User Address: ${userAddress}`);
  console.log(`Role: ${role}`);
  console.log("=".repeat(60));
  console.log("");

  try {
    await stellarService.changeTrustline(secretKey);

    console.log("");
    console.log("=".repeat(60));
    console.log("✅ Trustline Added Successfully!");
    console.log("=".repeat(60));
    console.log(`Address: ${userAddress}`);
    console.log("=".repeat(60));

    process.exit(0);
  } catch (error) {
    console.error("");
    console.error("=".repeat(60));
    console.error("❌ Adding Trustline Failed!");
    console.error("=".repeat(60));
    console.error("Error:", error);
    console.error("=".repeat(60));
    process.exit(1);
  }
}



main();