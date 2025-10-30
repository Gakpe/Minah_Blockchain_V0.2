import swaggerJsdoc from "swagger-jsdoc";
import { SwaggerUiOptions } from "swagger-ui-express";

const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "Minah Investment Platform API",
    version: "1.0.0",
    description:
      "REST API for Minah - A Stellar blockchain-based investment platform with NFT tokenization",
    contact: {
      name: "Minah Team",
    },
  },
  servers: [
    {
      url: "http://localhost:8080",
      description: "Development server",
    },
  ],
  tags: [
    {
      name: "Debug",
      description: "Debugging endpoints that has no effect on the workflow.",
    },
    {
      name: "Investors",
      description: "Investor management endpoints",
    },
    {
      name: "Vaults",
      description: "Vault management endpoints",
    },
    {
      name: "Investment State",
      description: "Investment state management endpoints",
    },
    {
      name: "Release",
      description: "ROI distribution release management endpoints",
    },

    {
      name: "Chronometer",
      description: "Chronometer management endpoints",
    },
  ],
  components: {
    schemas: {
      Investor: {
        type: "object",
        properties: {
          autoFuel: {
            type: "boolean",
            description: "Auto fuel setting for the investor",
            example: false,
          },
          walletAddress: {
            type: "string",
            description: "External wallet address of the investor",
            example: "GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
          },
          InternalwalletAddress: {
            type: "string",
            description: "Internal wallet address of the investor",
            example: "GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
          },
          vaultID: {
            type: "string",
            description: "Vault identifier",
            example: "vault_123",
          },
          issuer: {
            type: "string",
            description: "Issuer information",
            example: "Issuer Corp",
          },
          nationality: {
            type: "string",
            description: "Nationality of the investor",
            example: "US",
          },
          first_name: {
            type: "string",
            description: "First name of the investor",
            example: "John",
          },
          last_name: {
            type: "string",
            description: "Last name of the investor",
            example: "Doe",
          },
          address: {
            type: "string",
            description: "Physical address of the investor",
            example: "123 Main St, City, Country",
          },
          profilePicture: {
            type: "string",
            description: "URL to profile picture",
            example: "https://example.com/profile.jpg",
          },
          email: {
            type: "string",
            format: "email",
            description: "Email address of the investor",
            example: "investor@example.com",
          },
          investor: {
            type: "boolean",
            description: "Whether the user is an investor",
            example: true,
          },
          loginCount: {
            type: "number",
            description: "Number of times the user has logged in",
            example: 5,
          },
          accountVerified: {
            type: "boolean",
            description: "Whether the account is verified",
            example: false,
          },
          totalAmountInvested: {
            type: "number",
            description: "Total amount invested",
            example: 10000,
          },
          amountInvested: {
            type: "array",
            description: "Array of investment amounts with timestamps",
            items: {
              type: "object",
              properties: {
                amount: {
                  type: "string",
                  description: "Investment amount",
                  example: "1000",
                },
                timestamp: {
                  type: "string",
                  format: "date-time",
                  description: "Timestamp of investment",
                },
              },
            },
          },
          lastLoginAt: {
            type: "string",
            format: "date-time",
            description: "Timestamp of last login",
          },
          createdAt: {
            type: "string",
            format: "date-time",
            description: "Timestamp of investor creation",
          },
        },
      },
      Vault: {
        type: "object",
        properties: {
          walletAddress: {
            type: "string",
            description: "External wallet address associated with the vault",
            example: "GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
          },
          InternalwalletAddress: {
            type: "string",
            description: "Internal wallet address associated with the vault",
            example: "GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
          },
          vaultID: {
            type: "string",
            description: "Unique vault identifier",
            example: "vault_123",
          },
          assetID: {
            type: "string",
            description: "Asset identifier in the vault",
            example: "asset_456",
          },
          name: {
            type: "string",
            description: "Name of the vault",
            example: "My Investment Vault",
          },
          vaultAddress: {
            type: "string",
            description: "Vault contract address",
            example: "GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
          },
        },
      },
      InvestmentState: {
        type: "object",
        properties: {
          state: {
            type: "number",
            description: "Current investment state as enum value",
            example: 1,
          },
          stateName: {
            type: "string",
            description: "Human-readable state name",
            example: "BeforeFirstRelease",
            enum: [
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
            ],
          },
        },
      },
      Error: {
        type: "object",
        properties: {
          success: {
            type: "boolean",
            example: false,
          },
          message: {
            type: "string",
            description: "Error message",
            example: "An error occurred",
          },
          error: {
            type: "string",
            description: "Detailed error information",
          },
        },
      },
      Success: {
        type: "object",
        properties: {
          success: {
            type: "boolean",
            example: true,
          },
          message: {
            type: "string",
            description: "Success message",
          },
          data: {
            type: "object",
            description: "Response data",
          },
        },
      },
      ChronometerDetails: {
        type: "object",
        properties: {
          isStarted: {
            type: "boolean",
            description: "Whether the chronometer has been started",
            example: true,
          },
          beginDate: {
            type: "string",
            description: "The begin date as a timestamp string (seconds since epoch)",
            example: "1698403320",
            nullable: true,
          },
          beginDateISO: {
            type: "string",
            format: "date-time",
            description: "The begin date in ISO 8601 format",
            example: "2024-10-27T10:15:30.000Z",
            nullable: true,
          },
        },
      },
      NFTSupply: {
        type: "object",
        properties: {
          currentSupply: {
            type: "number",
            description: "Current number of NFTs minted",
            example: 150,
          },
        },
      },
      ClaimedAmount: {
        type: "object",
        properties: {
          claimedAmount: {
            type: "string",
            description: "Claimed amount in base units (raw blockchain value)",
            example: "5000000000",
          },
          claimedAmountFormatted: {
            type: "string",
            description: "Claimed amount formatted for display with decimals",
            example: "50.0",
          },
          walletAddress: {
            type: "string",
            description: "Stellar wallet address of the investor",
            example: "GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
          },
        },
      },
    },
  },
};

const options: swaggerJsdoc.Options = {
  swaggerDefinition,
  apis: ["./src/routes/*.ts", "./src/controllers/*.ts"],
};

export const swaggerSpec = swaggerJsdoc(options);

export const swaggerUiOptions: SwaggerUiOptions = {
  customCss: ".swagger-ui .topbar { display: none }",
  customSiteTitle: "Minah API Documentation",
};
