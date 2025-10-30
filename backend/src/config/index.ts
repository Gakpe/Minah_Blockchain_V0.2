import * as dotenv from "dotenv";

dotenv.config();

export const CONFIG = {
  port: process.env.PORT || 8080,
  mongodb: {
    uri: process.env.MONGODB_URI || "",
  },
  stellar: {
    usdc: {
      contractId: "CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA",
      asset_issuer: "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5",
      asset_code: "USDC",
      decimals: 7,
    },

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

export const stateNames = [
  "BuyingPhase",
  "BeforeFirstRelease",
  "Release1",
  "Release2",
  "Release3",
  "Release4",
  "Release5",
  "Release6",
  "Release7",
  "Release8",
  "Release9",
  "Release10",
  "Ended",
];
