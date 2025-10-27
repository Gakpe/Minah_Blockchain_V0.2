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
      name: "Investors",
      description: "Investor management endpoints",
    },
    {
      name: "Vaults",
      description: "Vault management endpoints",
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
