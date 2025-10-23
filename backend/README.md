# Minah Backend API

Backend API for the Minah investment platform built with Node.js, Express, TypeScript, MongoDB, and Stellar blockchain integration. This backend provides a complete REST API for managing investors, NFT minting, and ROI distribution through the Stellar blockchain.

## Features

- ✅ RESTful API with Express
- ✅ TypeScript for type safety
- ✅ MongoDB Atlas integration with Mongoose
- ✅ Stellar blockchain smart contract integration
- ✅ ROI distribution calculation and release
- ✅ Chronometer management for distribution timing
- ✅ Investor registration and management
- ✅ Swagger/OpenAPI documentation
- ✅ CORS enabled
- ✅ Environment-based configuration

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn package manager
- MongoDB Atlas account (or local MongoDB instance)
- Stellar testnet account with secret key
- Deployed Minah smart contract on Stellar
- Deployed stablecoin contract on Stellar

## Tech Stack

### Core Technologies
- **Node.js** - JavaScript runtime
- **Express.js v5** - Web application framework
- **TypeScript** - Type-safe JavaScript
- **MongoDB** - NoSQL database
- **Mongoose v8** - MongoDB ODM

### Blockchain Integration
- **@stellar/stellar-sdk v14** - Stellar blockchain SDK
- **Soroban** - Stellar smart contract platform
- **viem** - Ethereum-style utilities for number formatting

### API Documentation
- **Swagger UI Express** - Interactive API documentation
- **Swagger JSDoc** - JSDoc-based OpenAPI specification

### Development Tools
- **ts-node** - TypeScript execution for Node.js
- **nodemon** - Auto-restart development server
- **ESLint** - Code linting
- **Prettier** - Code formatting

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
USDC_CONTRACT_ID=your-stablecoin-contract-id

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
- `GET /` - Server status and API information
- `GET /health` - Health check endpoint with timestamp

### Investors
- `POST /api/investors` - Create a new investor
  - Creates investor profile in MongoDB
  - Registers investor on Stellar blockchain
  - Returns investor data and transaction hash
  - **Required fields:** `stellarAddress`, `email`, `firstName`, `lastName`

### Hello (Test Endpoint)
- `GET /api/hello?to=<name>` - Test the Stellar contract hello function
  - Calls the `hello` method on the Minah smart contract
  - Returns a greeting from the contract

### Chronometer
- `POST /api/start_chronometer` - Start the ROI distribution chronometer
  - Initiates the countdown for ROI distribution on the blockchain
  - Returns transaction hash

### Release Distribution
- `POST /api/release/calculate` - Calculate the amount to release
  - **Required body:** `{ "percent": <number> }`
  - Calculates total amount to release based on ROI percentage
  - Returns the calculated amount in USDC

- `POST /api/release/distribute` - Trigger ROI distribution
  - Releases the current stage distribution to all investors
  - Returns transaction hash

## Project Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── index.ts         # Environment configuration
│   │   ├── minah.ts         # Minah contract configuration
│   │   └── swagger.ts       # Swagger/OpenAPI configuration
│   ├── controllers/
│   │   ├── hello.controller.ts     # Hello test endpoint
│   │   ├── investor.controller.ts  # Investor & chronometer logic
│   │   └── release.controller.ts   # Distribution release logic
│   ├── database/
│   │   └── connection.ts    # MongoDB connection
│   ├── models/
│   │   └── Investor.ts      # Mongoose investor schema
│   ├── routes/
│   │   ├── chronometer.routes.ts  # Chronometer endpoints
│   │   ├── hello.routes.ts        # Hello test endpoint
│   │   ├── investor.routes.ts     # Investor endpoints
│   │   └── release.routes.ts      # Release endpoints
│   ├── services/
│   │   └── stellar.service.ts  # Stellar blockchain service
│   ├── types/
│   │   └── api.types.ts     # TypeScript type definitions
│   ├── app.ts               # Express app configuration
│   ├── mint.ts              # NFT minting script
│   └── server.ts            # Server entry point
├── .env.example
├── package.json
├── tsconfig.json
├── API_TESTING.md           # Comprehensive API testing guide
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
  nftBalance: Number (default: 0),
  totalInvested: Number (default: 0),
  claimedAmount: Number (default: 0),
  createdAt: Date (auto),
  updatedAt: Date (auto)
}
```

## Stellar Integration

The backend integrates with the Minah smart contract deployed on Stellar blockchain. The `stellar.service.ts` handles:

- **Investor Management:**
  - Creating investors on the blockchain via `create_investor` contract function
  - Validating Stellar addresses
  
- **Distribution Management:**
  - Starting the chronometer via `start_chronometer` function
  - Calculating release amounts via `calculate_amount_to_release` function
  - Releasing distributions via `release_distribution` function
  
- **Token Operations:**
  - Integration with USDC stablecoin contract
  - Decimal precision handling (7 decimals for USDC)
  
- **Transaction Handling:**
  - Transaction signing and submission
  - Error handling for blockchain operations
  - Transaction hash retrieval for verification

## Scripts

- `npm run dev` - Start development server with hot reload (uses nodemon and ts-node)
- `npm run build` - Build TypeScript to JavaScript (outputs to `dist/` folder)
- `npm start` - Build and run production server
- `npm run mint` - Run NFT minting script (`src/mint.ts`)
- `npm run lint` - Run ESLint for code quality
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
2. Deploy Minah smart contract to Stellar testnet (see `contracts/minah/notes.md`)
3. Deploy stablecoin contract for testing (see `contracts/stablecoin/`)
4. Configure `.env` with your credentials and contract IDs
5. Test endpoints using Swagger UI at `/api-docs`
6. Follow the `API_TESTING.md` guide for comprehensive testing
7. Use the `/api/hello` endpoint to verify contract connectivity
8. Create investors via `/api/investors`
9. Start the chronometer with `/api/start_chronometer`
10. Calculate and release distributions via `/api/release/*` endpoints

## Development Workflow

1. **Contract Deployment**: Deploy contracts from `contracts/` directory first
2. **Backend Setup**: Configure environment variables with deployed contract IDs
3. **Database Connection**: Ensure MongoDB is accessible
4. **Testing**: Use Swagger UI or cURL to test endpoints
5. **Monitoring**: Check transaction hashes on [Stellar Expert](https://stellar.expert/explorer/testnet)

## API Testing

See `API_TESTING.md` for detailed testing instructions, including:
- cURL examples for all endpoints
- Expected request/response formats
- Error handling scenarios
- Postman collection
- Testing workflow and troubleshooting

## Support

For issues or questions:
- Check `API_TESTING.md` for common issues and solutions
- Review contract deployment in `contracts/minah/notes.md`
- Refer to the main project `ARCHITECTURE.md` for system overview
