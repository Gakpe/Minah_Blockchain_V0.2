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
  ],
  components: {
    schemas: {
      Investor: {
        type: "object",
        required: ["stellarAddress", "email", "firstName", "lastName"],
        properties: {
          stellarAddress: {
            type: "string",
            description: "Stellar blockchain address of the investor",
            example: "GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
          },
          email: {
            type: "string",
            format: "email",
            description: "Email address of the investor",
            example: "investor@example.com",
          },
          firstName: {
            type: "string",
            description: "First name of the investor",
            example: "John",
          },
          lastName: {
            type: "string",
            description: "Last name of the investor",
            example: "Doe",
          },
          phoneNumber: {
            type: "string",
            description: "Phone number of the investor",
            example: "+1234567890",
          },
          country: {
            type: "string",
            description: "Country of residence",
            example: "USA",
          },
          kycStatus: {
            type: "string",
            enum: ["pending", "approved", "rejected"],
            description: "KYC verification status",
            example: "pending",
          },
          nftBalance: {
            type: "number",
            description: "Number of NFTs owned",
            example: 0,
          },
          totalInvested: {
            type: "number",
            description: "Total amount invested in USD",
            example: 0,
          },
          claimedAmount: {
            type: "number",
            description: "Total amount claimed from ROI distributions",
            example: 0,
          },
          createdAt: {
            type: "string",
            format: "date-time",
            description: "Timestamp of investor creation",
          },
          updatedAt: {
            type: "string",
            format: "date-time",
            description: "Timestamp of last update",
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
