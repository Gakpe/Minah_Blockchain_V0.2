# Stellar Minah - Investment NFT Platform

A Soroban-based smart contract platform for managing investment NFTs with scheduled ROI (Return on Investment) distributions on the Stellar blockchain. The Minah contract allows investors to purchase NFTs and receive automated ROI distributions across 10 release stages at configurable time intervals.

## 🌟 Features

- ✅ **NFT-based Investment System** - Each NFT represents an investment unit
- ✅ **Structured ROI Distribution** - Automated distributions over 10 stages (configurable intervals)
- ✅ **Stablecoin Integration** - USDC-based payments and distributions
- ✅ **Investor Registry** - On-chain investor management and tracking
- ✅ **Time-based State Transitions** - Automatic phase progression based on elapsed time
- ✅ **Ownership Controls** - Admin-only functions for secure contract management
- ✅ **Minimum/Maximum Investment Limits** - Configurable min/max NFTs per investor
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

- NFT minting and management (total supply is configurable at deploy)
- Investor registration and validation
- Time-based chronometer for distribution timing
- Automated ROI distribution calculations
- State machine for investment phases

**Constructor Parameters (configurable at deploy):**

```
owner: Address                         # Contract administrator
stablecoin: Address                    # USDC contract address
receiver: Address                      # Receives mint payments
payer: Address                         # Pays ROI distributions
price: i128                            # NFT price in USDC whole units
total_supply: u32                      # Max NFTs
min_nfts_to_mint: u32                  # Minimum per mint
max_nfts_per_investor: u32             # Per-investor cap
distribution_intervals: Vec<u64>       # Seconds, length MUST be 10
roi_percentages: Vec<i128>             # Scaled by 10,000,000 (1e7), length MUST be 10

STABLECOIN_DECIMALS: 7 (Soroban USDC standard)
```

**Investment Phases (on-chain state machine):**

```
BuyingPhase → BeforeFirstRelease → Release1 → Release2 → Release3 → Release4
→ Release5 → Release6 → Release7 → Release8 → Release9 → Release10 → Ended
```

**Core Functions (selected):**

- `__constructor(owner, stablecoin, receiver, payer, price, total_supply, min_nfts_to_mint, max_nfts_per_investor, distribution_intervals[10], roi_percentages[10])`
- `set_stablecoin(stablecoin)` (owner) — Update stablecoin address
- `set_receiver(receiver)` (owner) — Update receiver address
- `set_payer(payer)` (owner) — Update payer address
- `create_investor(new_investor)` (owner) — Register an investor
- `mint(user, amount)` — Purchase/mint NFTs (user-authorized)
- `start_chronometer()` (owner) — Begin distribution countdown; mints remaining NFTs to owner and freezes supply
- `release_distribution()` (owner) — Triggers one or more ready stages and advances state
- `calculate_amount_to_release(percent)` — Calculate total distribution for given percentage (percent scaled by 10,000,000)

Marketplace helpers (post-buying phase):

- `buy_tokens(from, to, token_ids[])` — Buyer pays USDC, NFTs move from seller to buyer
- `sell_tokens(from, to, token_ids[])` — Seller receives USDC, NFTs move from seller to buyer

Transfers via standard `transfer/transfer_from` are disabled and will revert for Minah NFTs.

**Getter Functions (read-only):**

- `get_stablecoin()` — Stablecoin contract address
- `get_receiver()` — Payment receiver address
- `get_payer()` — Distribution payer address
- `get_begin_date()` — Chronometer start date (unix seconds)
- `is_chronometer_started()` — Whether countdown has started
- `get_current_supply()` — Current NFT supply
- `get_total_supply()` — Total supply cap
- `get_nft_price()` — NFT price (whole units)
- `get_min_nfts_to_mint()` — Minimum per mint
- `get_max_nfts_per_investor()` — Per-investor cap
- `get_nft_buying_phase_supply()` — NFTs sold during buying phase
- `get_distribution_intervals()` — All 10 intervals (seconds)
- `get_roi_percentages()` — All 10 ROI percentages (scaled by 10,000,000)
- `get_current_state()` — Current investment phase enum value
- `get_investors_array_length()` — Number of registered investors
- `see_claimed_amount(address)` — Total claimed for an investor (raw units)

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
stellar keys generate owner --network testnet --fund

# Generate investor accounts for testing
stellar keys generate investor1 --network testnet --fund
stellar keys generate investor2 --network testnet --fund
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
  --payer $(stellar keys address owner) \
  --price <PRICE_USDC_WHOLE_UNITS> \
  --total-supply <TOTAL_SUPPLY> \
  --min-nfts-to-mint <MIN_PER_MINT> \
  --max-nfts-per-investor <MAX_PER_INVESTOR> \
  --distribution-intervals '[<s1>,<s2>,<s3>,<s4>,<s5>,<s6>,<s7>,<s8>,<s9>,<s10>]' \
  --roi-percentages '["<p1>","<p2>","<p3>","<p4>","<p5>","<p6>","<p7>","<p8>","<p9>","<p10>"]'
```

Notes:

- `roi-percentages` are scaled by 10,000,000 (e.g., 4% = "40000000").
- `distribution-intervals` must have 10 elements (seconds) and map 1:1 to the 10 release stages.

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
# APPROVAL_AMOUNT = amount_to_mint * price * 10^7
stellar contract invoke \
  --id <STABLECOIN_CONTRACT_ID> \
  --source-account investor1 \
  --network testnet \
  -- \
  approve \
  --from $(stellar keys address investor1) \
  --spender <MINAH_CONTRACT_ID> \
  --amount <APPROVAL_AMOUNT>

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
  --percent 40000000   # 4% scaled by 10,000,000
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
  get_current_state

# Check investor NFT balance
stellar contract invoke \
  --id <MINAH_CONTRACT_ID> \
  --source-account owner \
  --network testnet \
  -- \
  balance \
  --account <INVESTOR_ADDRESS>

# Get claimed amount
stellar contract invoke \
  --id <MINAH_CONTRACT_ID> \
  --source-account owner \
  --network testnet \
  -- \
  see_claimed_amount \
  --investor <INVESTOR_ADDRESS>

# Get distribution intervals
stellar contract invoke \
  --id <MINAH_CONTRACT_ID> \
  --source-account owner \
  --network testnet \
  -- \
  get_distribution_intervals

# Get ROI percentages (scaled by 10,000,000)
stellar contract invoke \
  --id <MINAH_CONTRACT_ID> \
  --source-account owner \
  --network testnet \
  -- \
  get_roi_percentages
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

### Phase 3: Distribution Stages (10 stages)

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
