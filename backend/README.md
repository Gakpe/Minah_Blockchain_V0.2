# Minah Backend API

Backend API for the Minah investment platform built with Node.js, Express, TypeScript, MongoDB, and Stellar blockchain integration.

## Features

- ✅ RESTful API with Express
- ✅ TypeScript for type safety
- ✅ MongoDB Atlas integration with Mongoose
- ✅ Stellar blockchain smart contract integration
- ✅ Swagger/OpenAPI documentation
- ✅ CORS enabled
- ✅ Environment-based configuration

## Prerequisites

- Node.js (v18 or higher)
- MongoDB Atlas account
- Stellar testnet account with secret key
- Deployed Minah smart contract on Stellar

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

3. Configure your environment variables in `.env`:
```env
# Server Configuration
PORT=8080

# MongoDB Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority

# Stellar Network Configuration
STELLAR_NETWORK=testnet
STELLAR_RPC_URL=https://soroban-testnet.stellar.org:443

# Minah Contract Configuration
MINAH_CONTRACT_ID=your-deployed-contract-id

# Stellar Account Configuration (Owner/Admin)
STELLAR_OWNER_SECRET_KEY=your-secret-key
STELLAR_OWNER_PUBLIC_KEY=your-public-key
```

## Running the Application

### Development Mode
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

## API Documentation

Once the server is running, access the interactive Swagger documentation at:
```
http://localhost:8080/api-docs
```

## Available Endpoints

### Health Check
- `GET /` - Server status
- `GET /health` - Health check endpoint

### Investors
- `POST /api/investors` - Create a new investor
  - Creates investor profile in MongoDB
  - Registers investor on Stellar blockchain
  - Returns transaction hash

## Project Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── index.ts         # Environment configuration
│   │   └── swagger.ts       # Swagger/OpenAPI configuration
│   ├── controllers/
│   │   └── investor.controller.ts  # Investor business logic
│   ├── database/
│   │   └── connection.ts    # MongoDB connection
│   ├── models/
│   │   └── Investor.ts      # Mongoose investor schema
│   ├── routes/
│   │   └── investor.routes.ts  # Investor API routes
│   ├── services/
│   │   └── stellar.service.ts  # Stellar blockchain service
│   ├── app.ts              # Express app configuration
│   └── server.ts           # Server entry point
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
```

## MongoDB Schema

### Investor Model
```typescript
{
  stellarAddress: String (unique, required),
  email: String (unique, required),
  firstName: String (required),
  lastName: String (required),
  phoneNumber: String (optional),
  country: String (optional),
  kycStatus: "pending" | "approved" | "rejected",
  nftBalance: Number (default: 0),
  totalInvested: Number (default: 0),
  claimedAmount: Number (default: 0),
  createdAt: Date (auto),
  updatedAt: Date (auto)
}
```

## Stellar Integration

The backend integrates with the Minah smart contract deployed on Stellar blockchain. The `stellar.service.ts` handles:

- Creating investors on the blockchain via `create_investor` contract function
- Validating Stellar addresses
- Transaction signing and submission
- Error handling for blockchain operations

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Run production server
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## Error Handling

The API returns consistent error responses:
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error information"
}
```

## Success Response Format

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data
  }
}
```

## Security Notes

- Never commit `.env` file to version control
- Keep your Stellar secret keys secure
- Use environment variables for all sensitive data
- Enable MongoDB IP whitelist for production

## Next Steps

1. Set up MongoDB Atlas cluster and get connection string
2. Deploy Minah smart contract to Stellar testnet
3. Configure `.env` with your credentials
4. Test the `/api/investors` endpoint using Swagger UI
5. Implement additional endpoints (mint, transfer, etc.)

## Support

For issues or questions, please refer to the main project documentation.
