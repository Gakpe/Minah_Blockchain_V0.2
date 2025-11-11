# Minah Backend API

Backend API for the Minah investment platform built with Node.js, Express, TypeScript, MongoDB, and Stellar (Soroban) integration. This backend exposes REST endpoints to manage investors and vaults, query on-chain contract state, mint NFTs, and handle ROI distributions.

## Features

- ✅ RESTful API with Express
- ✅ TypeScript for type safety
- ✅ MongoDB Atlas integration with Mongoose
- ✅ Stellar blockchain smart contract integration
- ✅ ROI distribution calculation and release
- ✅ Chronometer management for distribution timing
- ✅ Investor and Vault management
- ✅ On-chain contract info endpoints (read-only)
- ✅ Swagger/OpenAPI documentation
- ✅ CORS enabled
- ✅ Environment-based configuration

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn package manager
- MongoDB Atlas account (or local MongoDB instance)
- Stellar testnet account(s) with secret key(s)
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

# Stellar Account Configuration (Owner/Admin)
STELLAR_OWNER_SECRET_KEY=your-secret-key
STELLAR_OWNER_PUBLIC_KEY=your-public-key

# Stellar Mint Account (used by the mint script)
STELLAR_MINT_SECRET_KEY=your-mint-secret-key
STELLAR_MINT_PUBLIC_KEY=your-mint-public-key
```

Notes:

- USDC token details used by the backend are configured in `src/config/index.ts` (hardcoded contractId/issuer/decimals). No `.env` values are required for USDC.
- Current USDC decimals used by the backend: 7.

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

### Health

- GET `/` — Server status and API information
- GET `/health` — Health check with timestamp

### Investors

- POST `/api/investors/create` — Create a new investor
  - Creates investor profile in MongoDB
  - Optionally registers investor on-chain if `walletAddress` is provided
  - Returns investor data and optional transaction hash
  - Body: `{ "walletAddress": string }`
- GET `/api/investors` — List all investors with on-chain NFT balances
- GET `/api/investors/count` — Total investor count (MongoDB)
- GET `/api/investors/{id}/claimed-amount` — Claimed amount for an investor
  - `id` can be a MongoDB ObjectId or a Stellar wallet address

### Hello (Test Endpoint)

- GET `/api/hello?to=<name>` — Calls the contract `hello` function
  - Calls the `hello` method on the Minah smart contract
  - Returns a greeting from the contract

### Chronometer

- POST `/api/chronometer/start` — Start the ROI distribution chronometer
  - Initiates the countdown for ROI distribution on-chain
  - Returns transaction hash
- GET `/api/chronometer/details` — Current chronometer status and begin date (if started)

### Release Distribution

- GET `/api/release/calculate/{percent}` — Calculate amount to release
  - `percent` is a human percentage number (e.g., `4` for 4%). Internally scaled by 10,000,000 (7 decimals) following USDC config.
  - Returns the calculated amount as a string (descaled for display)

- POST `/api/release/distribute` — Trigger ROI distribution for current stage
  - Validates chronometer timing and state
  - Approves USDC and releases distribution on-chain
  - Returns transaction hash

### Investment State

- GET `/api/investment-state` — Get current investment state and state name
- GET `/api/investment-state/nft-supply` — Get current NFT supply

### Contract Info (read-only)

- GET `/api/contract-info/stablecoin` — Stablecoin contract address
- GET `/api/contract-info/receiver` — Receiver address
- GET `/api/contract-info/payer` — Payer address
- GET `/api/contract-info/nft-price` — NFT price (integer, unscaled)
- GET `/api/contract-info/total-supply` — Total NFT supply cap
- GET `/api/contract-info/min-nfts-to-mint` — Minimum NFTs mintable per tx
- GET `/api/contract-info/max-nfts-per-investor` — Maximum NFTs one investor can hold
- GET `/api/contract-info/nft-buying-phase-supply` — NFTs minted during buying phase
- GET `/api/contract-info/distribution-intervals` — Distribution intervals (seconds)
- GET `/api/contract-info/roi-percentages` — ROI percentages per stage (contract units)
- GET `/api/contract-info/investors-array-length` — On-chain investors array length
- GET `/api/contract-info/is-investor/{address}` — Check if an address is an on-chain investor

### Vaults

- POST `/api/vaults` — Create a new vault in MongoDB
  - Body: `{ walletAddress?, InternalwalletAddress?, vaultID?, assetID?, name?, vaultAddress? }`

## Project Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── index.ts         # Environment configuration
│   │   ├── minah.ts         # Minah contract configuration
│   │   └── swagger.ts       # Swagger/OpenAPI configuration
│   ├── controllers/
│   │   ├── hello.controller.ts           # Hello test endpoint
│   │   ├── investor.controller.ts        # Investor logic
│   │   ├── chronometer.controller.ts     # Chronometer logic
│   │   ├── release.controller.ts         # Distribution release logic
│   │   ├── investment-state.controller.ts# Investment state queries
│   │   └── contract-info.controller.ts   # Read-only contract info
│   ├── database/
│   │   └── connection.ts    # MongoDB connection
│   ├── models/
│   │   └── Investor.ts      # Mongoose investor schema
│   ├── routes/
│   │   ├── chronometer.routes.ts       # Chronometer endpoints
│   │   ├── hello.routes.ts             # Hello test endpoint
│   │   ├── investor.routes.ts          # Investor endpoints
│   │   ├── release.routes.ts           # Release endpoints
│   │   ├── investment-state.routes.ts  # Investment state endpoints
│   │   └── contract-info.routes.ts     # Contract info endpoints
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

## MongoDB Schemas

### Investor

Stored in collection `investors` via `models/Investor.ts`.

Fields (all optional unless noted):

- autoFuel: boolean
- walletAddress: string
- InternalwalletAddress: string
- vaultID: string
- issuer: string
- nationality: string
- first_name: string
- last_name: string
- address: string
- profilePicture: string
- email: string
- investor: boolean
- loginCount: number
- accountVerified: boolean
- totalAmountInvested: number
- amountInvested: Array<{ amount: string; timestamp: Date }>
- lastLoginAt: Date
- createdAt: Date
- creationTransactionHash: string

### Vault

Stored in collection `vaults` via `models/Investor.ts` (Vault model).

Fields:

- walletAddress: string
- InternalwalletAddress: string
- vaultID: string
- assetID: string
- name: string
- vaultAddress: string

## Stellar Integration

The backend integrates with the Minah smart contract deployed on Stellar (Soroban). The `src/services/stellar.service.ts` handles:

- Investor management: create on-chain investor, validate addresses, fetch claimed amounts and NFT balances
- Chronometer: start, read status, get begin date
- Distribution: calculate amount to release, approve USDC, release distribution
- Contract info: read stablecoin/receiver/payer, supply/price/limits, ROI percentages and distribution intervals
- Token/NFT operations: minting with balance checks and approvals
- Transaction handling: building, preparing, signing, submitting, and polling transactions

## Scripts

- `npm run dev` — Start development server with hot reload (nodemon + ts-node)
- `npm run build` — Build TypeScript to `dist/`
- `npm start` — Build and start production server
- `npm run mint` — Mint NFTs using `src/mint.ts` (uses STELLAR*MINT*\* keys)
- `npm run trustline` — Add USDC trustline using `src/trustline.ts` (uses STELLAR*OWNER*\* or STELLAR*MINT*\* keys)
- `npm run lint` — ESLint
- `npm run format` — Prettier

### Mint Script

The mint script (`src/mint.ts`) allows you to mint NFTs to a specified address. It performs the following operations:

1. Validates the user address
2. Gets the NFT price from the contract
3. Checks the mint account's USDC balance
4. Approves the contract to spend USDC
5. Mints the NFT

**Usage:**

```bash
npm run mint <amount>
```

**Example:**

```bash
npm run mint 5
```

This will mint 5 NFTs to the address specified by `STELLAR_MINT_PUBLIC_KEY` in your `.env` file.

**Requirements:**

- The mint account must have sufficient USDC balance
- The mint account must have a USDC trustline established
- The contract must be in the NFT buying phase
- The amount must be within the allowed limits (min/max NFTs per transaction)

### Trustline Script

The trustline script (`src/trustline.ts`) adds a trustline for the USDC asset to a specified account. This is required before an account can hold or receive USDC tokens.

**Usage:**

```bash
npm run trustline <owner | minter>
```

**Examples:**

```bash
# Add trustline for the owner account
npm run trustline owner

# Add trustline for the minter account
npm run trustline minter
```

**What it does:**

1. Validates the account address based on the specified role
2. Adds the USDC trustline to the account using the account's secret key

**Requirements:**

- The account must have sufficient XLM balance for transaction fees
- Valid secret key must be configured in `.env` for the specified role:
  - `owner` role uses `STELLAR_OWNER_SECRET_KEY`
  - `minter` role uses `STELLAR_MINT_SECRET_KEY`

**Note:** You typically need to run this script once per account before that account can interact with USDC tokens (e.g., before minting NFTs or receiving distributions).

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

1. Set up MongoDB Atlas and get your connection string
2. Deploy the Minah smart contract to Stellar testnet (see `contracts/minah/notes.md`)
3. Ensure USDC is available and configured (see `src/config/index.ts`)
4. Configure `.env` with your credentials and the Minah contract ID
5. Start the server and open Swagger UI at `/api-docs`
6. Verify connectivity with `/api/hello`
7. Create investors via `/api/investors/create`
8. Mint NFTs for investor 
9. Start the chronometer with `/api/chronometer/start` and monitor `/api/chronometer/details`
10. Calculate and release distributions via `/api/release/*`

## Development Workflow

1. **Contract Deployment**: Deploy contracts from `contracts/` directory first
2. **Backend Setup**: Configure environment variables with deployed contract IDs
3. **Database Connection**: Ensure MongoDB is accessible
4. **Testing**: Use Swagger UI or cURL to test endpoints
5. **Monitoring**: Check transaction hashes on [Stellar Expert](https://stellar.expert/explorer/testnet)
