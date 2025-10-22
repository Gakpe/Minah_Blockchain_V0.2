import * as dotenv from "dotenv";

dotenv.config();

export const CONFIG = {
  port: process.env.PORT || 8080,
  mongodb: {
    uri: process.env.MONGODB_URI || "",
  },
  stellar: {
    network: process.env.STELLAR_NETWORK || "testnet",
    rpcUrl:
      process.env.STELLAR_RPC_URL || "https://soroban-testnet.stellar.org:443",
    contractId: process.env.MINAH_CONTRACT_ID || "",
    ownerSecretKey: process.env.STELLAR_OWNER_SECRET_KEY || "",
    ownerPublicKey: process.env.STELLAR_OWNER_PUBLIC_KEY || "",
    mintSecretKey: process.env.STELLAR_MINT_SECRET_KEY || "",
    mintPublicKey: process.env.STELLAR_MINT_PUBLIC_KEY || "",
  },
};
