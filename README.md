# Stellar Minah - Investment NFT Platform

A Soroban-based smart contract platform for managing investment NFTs with scheduled ROI (Return on Investment) distributions on the Stellar blockchain. The Minah contract allows investors to purchase NFTs and receive automated ROI distributions over a 3-year period at predefined intervals.

## 🌟 Features

- ✅ **NFT-based Investment System** - Each NFT represents an investment unit
- ✅ **Structured ROI Distribution** - Automated distributions over 3 years (11 stages)
- ✅ **Stablecoin Integration** - USDC-based payments and distributions
- ✅ **Investor Registry** - On-chain investor management and tracking
- ✅ **Time-based State Transitions** - Automatic phase progression based on elapsed time
- ✅ **Ownership Controls** - Admin-only functions for secure contract management
- ✅ **Minimum/Maximum Investment Limits** - 40-150 NFTs per investor
- ✅ **Event Emissions** - On-chain events for tracking all activities

## 📋 Table of Contents

- [Project Structure](#project-structure)
- [Smart Contracts](#smart-contracts)
  - [Minah Contract](#minah-contract)
  - [Stablecoin Contract](#stablecoin-contract)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Building Contracts](#building-contracts)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contract Usage](#contract-usage)
- [Investment Lifecycle](#investment-lifecycle)
- [ROI Distribution Schedule](#roi-distribution-schedule)
- [Backend API](#backend-api)
- [Architecture](#architecture)

## 📁 Project Structure

```
stellar-minah/
├── contracts/
│   ├── minah/              # Main investment NFT contract
│   │   ├── src/
│   │   │   ├── lib.rs      # Contract implementation
│   │   │   └── tests/      # Unit tests
│   │   ├── Cargo.toml
│   │   ├── Makefile
│   │   └── notes.md        # Deployment notes
│   └── stablecoin/         # Mock USDC stablecoin contract
│       ├── src/
│       │   ├── lib.rs      # Fungible token implementation
│       │   └── test.rs     # Unit tests
│       ├── Cargo.toml
│       └── Makefile
├── backend/                # Node.js/Express REST API
│   └── README.md          # See backend documentation
├── Cargo.toml             # Workspace configuration
├── ARCHITECTURE.md        # Detailed architecture documentation
└── README.md
```

## 🔐 Smart Contracts

### Minah Contract

The core investment NFT contract that manages the entire investment lifecycle.

**Key Features:**

- NFT minting and management (4,500 total supply)
- Investor registration and validation
- Time-based chronometer for distribution timing
- Automated ROI distribution calculations
- State machine for investment phases

**Contract Constants:**

```rust
TOTAL_SUPPLY: 4500 NFTs
PRICE: 455 USDC per NFT (configurable)
MIN_NFTS_TO_MINT: 40 NFTs minimum purchase
MAX_NFTS_PER_INVESTOR: 150 NFTs maximum per investor
STABLECOIN_DECIMALS: 7 (Soroban USDC standard)
```

**Investment Phases:**

```
BuyingPhase → BeforeFirstRelease → SixMonthsDone → TenMonthsDone
→ OneYearTwoMonthsDone → OneYearSixMonthsDone → OneYearTenMonthsDone
→ TwoYearsTwoMonthsDone → TwoYearsSixMonthsDone → TwoYearsTenMonthsDone
→ ThreeYearsTwoMonthsDone → ThreeYearsSixMonthsDone → Ended
```

**Core Functions:**

- `__constructor(owner, stablecoin, receiver, payer)` - Initialize contract
- `create_investor(new_investor)` - Register new investor (owner only)
- `mint(user, amount)` - Purchase NFTs with stablecoins
- `start_chronometer()` - Begin distribution countdown (owner only)
- `release_distribution()` - Trigger ROI distribution for current stage (owner only)
- `calculate_amount_to_release(percent)` - Calculate distribution amount
- `distribute(percent)` - Execute distribution to all investors

**Getter Functions:**

- `get_stablecoin()` - Get stablecoin contract address
- `get_current_supply()` - Get current NFT supply
- `get_begin_date()` - Get chronometer start date
- `get_receiver()` - Get payment receiver address
- `get_payer()` - Get distribution payer address
- `get_investors_array()` - Get list of all investors
- `get_state()` - Get current investment phase
- `is_investor(address)` - Check if address is registered
- `get_claimed_amount(address)` - Get total claimed by investor

### Stablecoin Contract

A mock USDC fungible token contract for testing purposes (7 decimals precision).

**Key Features:**

- Standard fungible token implementation
- 7 decimal precision (Soroban standard for USDC)
- Pre-minting capability for testing
- Full ERC-20-like interface

**Core Functions:**

- `__constructor(user, premint_amount)` - Deploy with initial supply
- `transfer(from, to, amount)` - Transfer tokens
- `approve(from, spender, amount)` - Approve spending
- `transfer_from(spender, from, to, amount)` - Spend approved tokens
- `balance(address)` - Get token balance
- `allowance(from, spender)` - Get spending allowance

## 🛠️ Prerequisites

- **Rust** (latest stable) - Install from [rustup.rs](https://rustup.rs/)
- **Stellar CLI** - Install from [Stellar Docs](https://soroban.stellar.org/docs/getting-started/setup)
- **Stellar testnet account** with XLM for fees

## 📦 Installation

1. **Clone the repository:**

```bash
git clone https://github.com/ayoubbuoya/stellar-minah.git
cd stellar-minah
```

2. **Generate Stellar keypairs (if needed):**

```bash
# Generate owner account
stellar keys generate owner --network testnet

# Generate investor accounts for testing
stellar keys generate investor1 --network testnet
stellar keys generate investor2 --network testnet

# Fund accounts from friendbot
stellar keys fund owner --network testnet
stellar keys fund investor1 --network testnet
```

## 🔨 Building Contracts

### Build All Contracts

```bash
# Build all contracts in the workspace
stellar contract build
```

The compiled WASM files will be located at:

```
target/wasm32v1-none/release/minah.wasm
target/wasm32v1-none/release/stablecoin.wasm
```

## 🧪 Testing

### Run All Tests

```bash
# Run all tests in the workspace
cargo test

# Run tests with output
cargo test -- --nocapture
```

### Run Contract-Specific Tests

```bash
# Test Minah contract
cargo test -p minah

# Test Stablecoin contract
cargo test -p stablecoin

# Run specific test
cargo test -p minah test_name
```

## 🚀 Deployment

### Deploy Minah Contract

```bash
stellar contract deploy \
  --wasm target/wasm32v1-none/release/minah.wasm \
  --source-account owner \
  --network testnet \
  --alias minah \
  -- \
  --owner $(stellar keys address owner) \
  --stablecoin <STABLECOIN_CONTRACT_ID> \
  --receiver $(stellar keys address owner) \
  --payer $(stellar keys address owner)
```

**Parameters:**

- `owner` - Contract administrator address (can create investors, start chronometer, release distributions)
- `stablecoin` - Address of the stablecoin contract (USDC)
- `receiver` - Address that receives NFT purchase payments
- `payer` - Address that pays out ROI distributions (must have sufficient USDC)

### 3. Note the Contract Address

Save the deployed contract ID for use with the backend API and future interactions.

## 📖 Contract Usage

### Register an Investor

```bash
stellar contract invoke \
  --id <MINAH_CONTRACT_ID> \
  --source-account owner \
  --network testnet \
  -- \
  create_investor \
  --new_investor <INVESTOR_ADDRESS>
```

### Purchase NFTs (Mint)

```bash
# 1. First approve the Minah contract to spend stablecoins
stellar contract invoke \
  --id <STABLECOIN_CONTRACT_ID> \
  --source-account investor1 \
  --network testnet \
  -- \
  approve \
  --from $(stellar keys address investor1) \
  --spender <MINAH_CONTRACT_ID> \
  --amount 18200000000

# 2. Mint 40 NFTs (minimum)
stellar contract invoke \
  --id <MINAH_CONTRACT_ID> \
  --source-account investor1 \
  --network testnet \
  -- \
  mint \
  --user $(stellar keys address investor1) \
  --amount 40
```

### Start the Chronometer

```bash
stellar contract invoke \
  --id <MINAH_CONTRACT_ID> \
  --source-account owner \
  --network testnet \
  -- \
  start_chronometer
```

### Calculate Release Amount

```bash
stellar contract invoke \
  --id <MINAH_CONTRACT_ID> \
  --source-account owner \
  --network testnet \
  -- \
  calculate_amount_to_release \
  --percent 4000000
```

### Release Distribution

```bash
# 1. First ensure the payer has approved sufficient stablecoins
stellar contract invoke \
  --id <STABLECOIN_CONTRACT_ID> \
  --source-account payer \
  --network testnet \
  -- \
  approve \
  --from $(stellar keys address payer) \
  --spender <MINAH_CONTRACT_ID> \
  --amount <TOTAL_DISTRIBUTION_AMOUNT>

# 2. Release the distribution
stellar contract invoke \
  --id <MINAH_CONTRACT_ID> \
  --source-account owner \
  --network testnet \
  -- \
  release_distribution
```

### Query Contract State

```bash
# Get current investment phase
stellar contract invoke \
  --id <MINAH_CONTRACT_ID> \
  --source-account owner \
  --network testnet \
  -- \
  get_state

# Check investor balance
stellar contract invoke \
  --id <MINAH_CONTRACT_ID> \
  --source-account owner \
  --network testnet \
  -- \
  balance_of \
  --owner <INVESTOR_ADDRESS>

# Get claimed amount
stellar contract invoke \
  --id <MINAH_CONTRACT_ID> \
  --source-account owner \
  --network testnet \
  -- \
  get_claimed_amount \
  --address <INVESTOR_ADDRESS>
```

## 📈 Investment Lifecycle

### Phase 1: Buying Phase

- Contract owner registers investors via `create_investor()`
- Investors approve stablecoin spending
- Investors call `mint()` to purchase NFTs (40-150 NFTs per investor)
- Stablecoins are transferred to the receiver address
- NFTs are minted to investors

### Phase 2: Before First Release

- Owner calls `start_chronometer()` when buying phase ends
- Any remaining unsold NFTs are minted to the owner
- Begin date is recorded on-chain
- State transitions to `BeforeFirstRelease`

### Phase 3: Distribution Stages (11 stages over 3 years)

- At each interval, owner calls `release_distribution()`
- Contract validates elapsed time meets the requirement
- Distribution amount is calculated based on current stage percentage
- Payer must have approved sufficient stablecoins
- Stablecoins are distributed proportionally to all investors
- State advances to next stage
- Claimed amounts are updated

### Phase 4: Ended

- All 11 distributions have been completed
- Contract state is `Ended`
- No further distributions possible

## 🔌 Backend API

A comprehensive REST API is provided for easier interaction with the smart contracts. The backend handles:

- Investor registration and management
- NFT minting operations
- Chronometer management
- Distribution calculations and execution
- MongoDB integration for off-chain data
- Swagger/OpenAPI documentation

**For complete backend documentation, see:** [`backend/README.md`](./backend/README.md)

### Quick Start (Backend)

```bash
cd backend
npm install
cp .env.example .env
# Configure .env with contract IDs and MongoDB URI
npm run dev
# Access API docs at http://localhost:8080/api-docs
```

## 🏗️ Architecture

For detailed architecture documentation including:

- System diagrams and flow charts
- State transition models
- Component interactions
- Sequence diagrams
- Security considerations

**See:** [`ARCHITECTURE.md`](./ARCHITECTURE.md)

## 🔧 Development

### Code Style

The project follows Rust and Soroban best practices:

- Uses `#![no_std]` for WASM compatibility
- Implements traits from `stellar-tokens` and `stellar-access`
- Uses macros from `stellar-macros` for common patterns
- Follows the `DataKey` enum pattern for storage

### Key Dependencies

```toml
soroban-sdk = "22.0.8"
stellar-access = "0.4.1"         # Ownable trait
stellar-contract-utils = "0.4.1" # Utility functions
stellar-tokens = "0.4.1"         # NFT/Fungible token traits
stellar-macros = "0.4.1"         # Helper macros
```

### Adding New Distribution Stages

To modify the distribution schedule:

1. Update `InvestmentStatus` enum in `contracts/minah/src/lib.rs`
2. Update `DISTRIBUTION_INTERVALS` array with new time intervals
3. Update the `release_distribution()` logic for new stages
4. Update tests to reflect changes
5. Rebuild and redeploy contract

## 🛡️ Security Considerations

- **Ownership Controls**: Critical functions protected with `#[only_owner]` macro
- **Balance Checks**: Validates sufficient stablecoin balance and allowance before transfers
- **State Validation**: Enforces correct phase transitions
- **Time Validation**: Verifies required time has elapsed before distributions
- **Authorization**: Uses `require_auth()` for investor actions
- **Investment Limits**: Enforces min/max NFT purchase amounts
- **Supply Cap**: Total NFT supply is capped at 4,500