#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, log, token, vec, Address, Env, String, Symbol, Vec,
};
use stellar_access::ownable::{self as ownable, Ownable};
use stellar_macros::{default_impl, only_owner};
use stellar_tokens::non_fungible::{
    consecutive::{Consecutive, NonFungibleConsecutive},
    Base, NonFungibleToken,
};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
#[contracttype]
pub enum InvestmentStatus {
    BuyingPhase = 0,
    BeforeFirstRelease = 1,
    SixMonthsDone = 2,
    TenMonthsDone = 3,
    OneYearTwoMonthsDone = 4,
    OneYearSixMonthsDone = 5,
    OneYearTenMonthsDone = 6,
    TwoYearsTwoMonthsDone = 7,
    TwoYearsSixMonthsDone = 8,
    TwoYearsTenMonthsDone = 9,
    ThreeYearsTwoMonthsDone = 10,
    ThreeYearsSixMonthsDone = 11,
    Ended = 12,
}

#[contracttype]
pub enum DataKey {
    StableCoin,
    CurrentSupply,
    BeginDate,
    AmountToReleaseForCurrentStage,
    Receiver,
    Payer,
    InvestorsArray,
    CountdownStart,
    State,
    Investor(Address),
    ClaimedAmount(Address),
}

//////////////////////// EVENTS ////////////////////////////////

fn emit_investor_created_event(e: &Env, investor: Address) {
    let topics = (Symbol::new(e, "InvestorCreated"), investor);
    e.events().publish(topics, ());
}

fn emit_started_chronometer_event(e: &Env) {
    let topics = (Symbol::new(e, "ChronometerStarted"),);
    e.events().publish(topics, ());
}

fn emit_tokens_bought_event(e: &Env, from: Address, to: Address, amount: u32) {
    let topics = (Symbol::new(e, "TokensBought"), from, to);
    e.events().publish(topics, amount);
}

fn emit_tokens_sold_event(e: &Env, from: Address, to: Address, amount: u32) {
    let topics = (Symbol::new(e, "TokensSold"), from, to);
    e.events().publish(topics, amount);
}

fn emit_batch_transfer_event(e: &Env, from: &Address, to: &Address, token_ids: Vec<u32>) {
    let topics = (Symbol::new(e, "BatchTransfer"), from, to);
    e.events().publish(topics, token_ids);
}

#[contract]
pub struct Minah;

// Constants
const STABLECOIN_DECIMALS: u32 = 7;
const TOTAL_SUPPLY: u32 = 4500;
const PRICE: i128 = 1; // TODO: change to 455 for production
const STABLECOIN_SCALE: u32 = 10u32.pow(STABLECOIN_DECIMALS);
// // Maximum NFTs allowed per transaction during marketplace operations (transfers)
// const MAXIMUM_NFTS_PER_TRANSACTION: i128 = 150;
// Maximum NFTs allowed per investor
const MAX_NFTS_PER_INVESTOR: u32 = 150;
// Minimum NFTs to mint at once
const MIN_NFTS_TO_MINT: u32 = 40;

// Distribution intervals in seconds
// TODO: UNCOMMENT FOR PRODUCTION
// const DISTRIBUTION_INTERVALS: [u64; 10] = [
//     15_768_000,  // 6 months
//     26_280_000,  // 10 months
//     36_792_000,  // 1 year 2 months
//     47_304_000,  // 1 year 6 months
//     57_816_000,  // 1 year 10 months
//     68_328_000,  // 2 years 2 months
//     78_840_000,  // 2 years 6 months
//     89_352_000,  // 2 years 10 months
//     99_864_000,  // 3 years 2 months
//     110_376_000, // 3 years 6 months
// ];

// TODO: COMMENT FOR PRODUCTION
const DISTRIBUTION_INTERVALS: [u64; 10] = [
    60,  // 1 minute
    120, // 2 minutes
    180, // 3 minutes
    240, // 4 minutes
    300, // 5 minutes
    360, // 6 minutes
    420, // 7 minutes
    480, // 8 minutes
    540, // 9 minutes
    600, // 10 minutes
];

// ROI percentages are scaled by 10_000_000 to handle decimal percentages (7 decimal places)
// ROI_PERCENTAGES = [4, 2.67, 2.67, 2.67, 2.67, 2.67, 2.67, 2.67, 2.67, 2.67]
const ROI_PERCENTAGES: [i128; 10] = [
    40_000_000, 26_700_000, 26_700_000, 26_700_000, 26_700_000, 26_700_000, 26_700_000, 26_700_000,
    26_700_000, 26_700_000,
];

#[contractimpl]
impl Minah {
    pub fn __constructor(
        e: &Env,
        owner: Address,
        stablecoin: Address,
        receiver: Address,
        payer: Address,
    ) {
        // Ownner should authorize this call
        owner.require_auth();

        let uri = String::from_str(e, "");
        let name = String::from_str(e, "Minah");
        let symbol = String::from_str(e, "MNH");

        Base::set_metadata(e, uri, name, symbol);
        ownable::set_owner(e, &owner);

        // Initialize Storage
        e.storage()
            .instance()
            .set(&DataKey::StableCoin, &stablecoin);
        e.storage().instance().set(&DataKey::Receiver, &receiver);
        e.storage().instance().set(&DataKey::Payer, &payer);
        e.storage().instance().set(&DataKey::CurrentSupply, &0u32);
        e.storage().instance().set(&DataKey::BeginDate, &0u64);
        e.storage()
            .instance()
            .set(&DataKey::AmountToReleaseForCurrentStage, &0i128);
        e.storage().instance().set(&DataKey::CountdownStart, &false);
        e.storage()
            .instance()
            .set(&DataKey::State, &InvestmentStatus::BuyingPhase);

        let empty_investors: Vec<Address> = vec![&e];
        e.storage()
            .instance()
            .set(&DataKey::InvestorsArray, &empty_investors);
    }

    /// Sets a new stablecoin address. Only the contract owner can call this function.
    #[only_owner]
    pub fn set_stablecoin(e: &Env, stablecoin: Address) {
        e.storage()
            .instance()
            .set(&DataKey::StableCoin, &stablecoin);
    }

    /// Creates a new investor.
    /// Function called from the backend when a user creates a profile on the Minah platform
    /// # Arguments
    /// * `newInvestor` : the fireblocks address generated for the new user. To store in the backend.
    #[only_owner]
    pub fn create_investor(e: Env, new_investor: Address) {
        // Check if investor already exists
        let is_investor = e
            .storage()
            .instance()
            .get(&DataKey::Investor(new_investor.clone()))
            .unwrap_or(false);

        assert!(!is_investor, "INVESTOR_ALREADY_EXISTS");

        // Add to investors mapping
        e.storage()
            .instance()
            .set(&DataKey::Investor(new_investor.clone()), &true);

        // Add to investors array
        let mut investors: Vec<Address> = e
            .storage()
            .instance()
            .get(&DataKey::InvestorsArray)
            .unwrap_or(vec![&e]);
        investors.push_back(new_investor.clone());
        e.storage()
            .instance()
            .set(&DataKey::InvestorsArray, &investors);

        // Initialize claimed amount to 0
        e.storage()
            .instance()
            .set(&DataKey::ClaimedAmount(new_investor.clone()), &0i128);

        // Emit INVESTOR_CREATED event
        emit_investor_created_event(&e, new_investor);
    }

    /// Mints a new NFT to the specified address.
    pub fn mint(e: Env, user: Address, amount: u32) {
        // User should authorize this call
        user.require_auth();

        // CHECK: Amount should be >= MIN_NFTS_TO_MINT
        assert!(amount >= MIN_NFTS_TO_MINT, "MINIMUM_INVESTMENT_NOT_MET");

        // CHECK: Current state should be BuyingPhase
        let current_state: InvestmentStatus = e
            .storage()
            .instance()
            .get(&DataKey::State)
            .expect("State not set");

        assert!(
            current_state == InvestmentStatus::BuyingPhase,
            "INVESTMENT_NOT_IN_BUYING_PHASE"
        );

        // CHECK: User should be an investor
        let is_investor = e
            .storage()
            .instance()
            .get(&DataKey::Investor(user.clone()))
            .unwrap_or(false);

        assert!(is_investor, "USER_NOT_AN_INVESTOR");

        // CHECK: Total supply should not be exceeded
        let current_supply: u32 = e
            .storage()
            .instance()
            .get(&DataKey::CurrentSupply)
            .unwrap_or(0);

        let new_supply = current_supply + amount;

        assert!(new_supply <= TOTAL_SUPPLY, "MAXIMUM_SUPPLY_EXCEEDED");

        // CHECK: Investor NFTS should not exceed MAX_NFTS_PER_INVESTOR
        let investor_balance = Self::balance(&e, user.clone());

        assert!(
            investor_balance + amount <= MAX_NFTS_PER_INVESTOR,
            "MAXIMUM_NFTS_PER_INVESTOR_EXCEEDED"
        );

        let usd_amount = PRICE * amount as i128 * STABLECOIN_SCALE as i128;

        // CHECK: User has enough balance of stablecoin
        let stablecoin_address: Address = e
            .storage()
            .instance()
            .get(&DataKey::StableCoin)
            .expect("Stablecoin not set");

        let stablecoin_client = token::Client::new(&e, &stablecoin_address);

        let user_balance = stablecoin_client.balance(&user);

        assert!(user_balance >= usd_amount, "INSUFFICIENT_BALANCE");

        // CHECK: User has enough allowance of stablecoin
        let current_address = e.current_contract_address();

        let user_allowance = stablecoin_client.allowance(&user, &current_address);

        assert!(user_allowance >= usd_amount, "INSUFFICIENT_ALLOWANCE");

        let receiver: Address = e
            .storage()
            .instance()
            .get(&DataKey::Receiver)
            .expect("Receiver not set");

        // Do the transfer of stablecoin from user to the receiver address
        // NOTE: The user must have approved the contract to spend the stablecoin on their behalf
        stablecoin_client.transfer_from(&current_address, &user, &receiver, &usd_amount);

        // Update current supply to new supply
        e.storage()
            .instance()
            .set(&DataKey::CurrentSupply, &new_supply);

        // Mint the requested amount of NFTs to the specified address
        Consecutive::batch_mint(&e, &user, amount);
    }

    /// Start the chronometer for ROI distribution
    #[only_owner]
    pub fn start_chronometer(e: Env) {
        let countdown_start: bool = e
            .storage()
            .instance()
            .get(&DataKey::CountdownStart)
            .expect("CountdownStart not set");

        let begin_date: u64 = e
            .storage()
            .instance()
            .get(&DataKey::BeginDate)
            .expect("BeginDate not set");

        assert!(
            !countdown_start && begin_date == 0,
            "CHRONOMETER_ALREADY_STARTED"
        );

        // Set begin date and countdown
        e.storage()
            .instance()
            .set(&DataKey::BeginDate, &e.ledger().timestamp());
        e.storage().instance().set(&DataKey::CountdownStart, &true);
        e.storage()
            .instance()
            .set(&DataKey::State, &InvestmentStatus::BeforeFirstRelease);

        // Mint remaining NFTs to owner
        let current_supply: u32 = e
            .storage()
            .instance()
            .get(&DataKey::CurrentSupply)
            .expect("CurrentSupply not set");

        let remaining = TOTAL_SUPPLY - current_supply;

        // Update current supply to total supply
        e.storage()
            .instance()
            .set(&DataKey::CurrentSupply, &TOTAL_SUPPLY);

        if remaining > 0 {
            // Mint the remaining amount of NFTs to the owner
            let owner = ownable::get_owner(&e).expect("Owner not set");

            Consecutive::batch_mint(&e, &owner, remaining);
        }

        // Emit CHRONOMETER_STARTED event
        emit_started_chronometer_event(&e);
    }

    /// Calculate amount to release for a given percentage
    /// Function to know how much to approve() on the STABLECOIN smart contract before releasing the amount to all investors.
    /// Arguments:
    /// * `percentage`: the percentage of ROI to be released for the current stage.(Scaled by 10_000_000 to handle decimal percentages)
    pub fn calculate_amount_to_release(e: Env, percent: i128) -> i128 {
        let investors: Vec<Address> = e
            .storage()
            .instance()
            .get(&DataKey::InvestorsArray)
            .expect("InvestorsArray not set");

        let mut total_invested_nfts: i128 = 0;

        for investor in investors.iter() {
            let balance = Base::balance(&e, &investor) as i128;

            total_invested_nfts += balance;
        }

        total_invested_nfts * PRICE * percent / 100
    }

    /// Releases the distribution for the current stage.
    /// This function needs to be called by the owner at the end of every distribution period/stage to trigger the current release and next stage.
    #[only_owner]
    pub fn release_distribution(e: &Env) {
        // CHECK: Countdown should be started
        let countdown_start: bool = e
            .storage()
            .instance()
            .get(&DataKey::CountdownStart)
            .expect("CountdownStart not set");

        assert!(countdown_start, "COUNDOWN_NOT_STARTED");

        let begin_date: u64 = e
            .storage()
            .instance()
            .get(&DataKey::BeginDate)
            .expect("BeginDate not set");

        let current_time = e.ledger().timestamp();

        assert!(current_time >= begin_date, "INVALID_LEDGER_TIME");

        let elapsed = current_time - begin_date;

        let mut state: InvestmentStatus = e
            .storage()
            .instance()
            .get(&DataKey::State)
            .expect("State not set");

        // SUB is safe here because of the check(countdownStart should be true)
        // We start from (state - 1) because the state enum starts from 1 for BeforeFirstRelease
        // Cast to usize cause we will use it for indexing arrays which uses usize by default in rust
        let mut current_stage_index = ((state as u32) - 1) as usize;
        let mut distributed = false;

        // Loop through all stages that are ready for distribution
        while (current_stage_index) < DISTRIBUTION_INTERVALS.len()
            && elapsed >= DISTRIBUTION_INTERVALS[current_stage_index]
        {
            // Distribute for this stage
            Self::distribute(&e, ROI_PERCENTAGES[current_stage_index]);

            // Update state
            state = match state {
                InvestmentStatus::BeforeFirstRelease => InvestmentStatus::SixMonthsDone,
                InvestmentStatus::SixMonthsDone => InvestmentStatus::TenMonthsDone,
                InvestmentStatus::TenMonthsDone => InvestmentStatus::OneYearTwoMonthsDone,
                InvestmentStatus::OneYearTwoMonthsDone => InvestmentStatus::OneYearSixMonthsDone,
                InvestmentStatus::OneYearSixMonthsDone => InvestmentStatus::OneYearTenMonthsDone,
                InvestmentStatus::OneYearTenMonthsDone => InvestmentStatus::TwoYearsTwoMonthsDone,
                InvestmentStatus::TwoYearsTwoMonthsDone => InvestmentStatus::TwoYearsSixMonthsDone,
                InvestmentStatus::TwoYearsSixMonthsDone => InvestmentStatus::TwoYearsTenMonthsDone,
                InvestmentStatus::TwoYearsTenMonthsDone => {
                    InvestmentStatus::ThreeYearsTwoMonthsDone
                }
                InvestmentStatus::ThreeYearsTwoMonthsDone => {
                    InvestmentStatus::ThreeYearsSixMonthsDone
                }
                InvestmentStatus::ThreeYearsSixMonthsDone => InvestmentStatus::Ended,
                _ => InvestmentStatus::Ended,
            };

            e.storage().instance().set(&DataKey::State, &state);

            // SUB is safe here because of the check(countdownStart should be true)
            current_stage_index = ((state as u32) - 1) as usize;
            distributed = true;

            // This is needed to break the loop when the last distribution is done so when we get out of the loop the state will be Ended instead of ThreeYearsSixMonthsDone Cause due to the while condition it will not be able to enter the loop again so the state will not be updated to Ended
            if state == InvestmentStatus::ThreeYearsSixMonthsDone {
                e.storage()
                    .instance()
                    .set(&DataKey::State, &InvestmentStatus::Ended);
                break;
            }
        }

        assert!(distributed, "DISTRIBUTION_NOT_READY_YET");
    }

    //////////////////////////////// Getters ////////////////////////////////

    /// Check if an address is an investor
    pub fn is_investor(e: &Env, investor: Address) -> bool {
        e.storage()
            .instance()
            .get(&DataKey::Investor(investor))
            .unwrap_or(false)
    }

    /// Get investors array length
    pub fn get_investors_array_length(e: Env) -> u32 {
        let investors: Vec<Address> = e
            .storage()
            .instance()
            .get(&DataKey::InvestorsArray)
            .unwrap_or(vec![&e]);
        investors.len()
    }

    /// Returns the address of the stablecoin used for investments.
    pub fn get_stablecoin(e: &Env) -> Address {
        e.storage()
            .instance()
            .get(&DataKey::StableCoin)
            .expect("Stablecoin not set")
    }

    /// Returns the address of the receiver.
    pub fn get_receiver(e: &Env) -> Address {
        e.storage()
            .instance()
            .get(&DataKey::Receiver)
            .expect("Receiver not set")
    }

    /// Returns the start time of the chronometer.
    pub fn get_begin_date(e: &Env) -> u64 {
        e.storage()
            .instance()
            .get(&DataKey::BeginDate)
            .expect("BeginDate not set")
    }

    /// Returns whether the chronometer has started.
    pub fn is_chronometer_started(e: &Env) -> bool {
        e.storage()
            .instance()
            .get(&DataKey::CountdownStart)
            .expect("CountdownStart not set")
    }

    /// Returns the address of the payer.
    pub fn get_payer(e: &Env) -> Address {
        e.storage()
            .instance()
            .get(&DataKey::Payer)
            .expect("Payer not set")
    }

    /// Get claimed amount for an investor
    pub fn see_claimed_amount(e: Env, investor: Address) -> i128 {
        e.storage()
            .instance()
            .get(&DataKey::ClaimedAmount(investor))
            .unwrap_or(0)
    }

    /// Get current supply
    pub fn get_current_supply(e: Env) -> u32 {
        e.storage()
            .instance()
            .get(&DataKey::CurrentSupply)
            .unwrap_or(0)
    }

    /// Get current state
    pub fn get_current_state(e: Env) -> InvestmentStatus {
        e.storage()
            .instance()
            .get(&DataKey::State)
            .expect("State not set")
    }

    /// Get NFT PRICE
    pub fn get_nft_price(_e: Env) -> i128 {
        PRICE
    }

    //////////////////////// NFT MARKETPLACE ////////////////////////////////

    pub fn buy_tokens(e: Env, from: Address, to: Address, token_ids: Vec<u32>) {
        // To should authorize this call
        to.require_auth();

        // CHECK: Current state should not be BuyingPhase
        let current_state: InvestmentStatus = e
            .storage()
            .instance()
            .get(&DataKey::State)
            .expect("State not set");

        assert!(
            current_state != InvestmentStatus::BuyingPhase,
            "NFT_TRANSFERS_NOT_ALLOWED_DURING_BUYING_PHASE"
        );

        // CHECK: Both from and to addresses should be either investors or owner
        let is_from_investor = e
            .storage()
            .instance()
            .get(&DataKey::Investor(from.clone()))
            .unwrap_or(false);

        let is_to_investor = e
            .storage()
            .instance()
            .get(&DataKey::Investor(to.clone()))
            .unwrap_or(false);

        let owner = ownable::get_owner(&e).expect("OWNER_NOT_SET");

        assert!(
            is_from_investor || from == owner,
            "FROM_ADDRESS_NOT_INVESTOR_OR_OWNER"
        );

        assert!(
            is_to_investor || to == owner,
            "TO_ADDRESS_NOT_INVESTOR_OR_OWNER"
        );

        let nft_amount = token_ids.len() as i128;

        // CHECK: nft_amount should be less than or equal to maximum allowed per transaction
        // assert!(
        //     nft_amount <= MAXIMUM_NFTS_PER_TRANSACTION,
        //     "MAXIMUM_NFTS_PER_TRANSACTION_EXCEEDED"
        // );

        // CHECK: from should have enough NFTs to sell
        let from_balance = Self::balance(&e, from.clone());

        assert!(
            from_balance as i128 >= nft_amount,
            "INSUFFICIENT_FROM_NFT_BALANCE"
        );

        // CHECK: to stablecoin balance should be enough to cover the buying fee
        let stablecoin_address: Address = e
            .storage()
            .instance()
            .get(&DataKey::StableCoin)
            .expect("STABLECOIN_NOT_SET");

        let price_per_nft = PRICE * STABLECOIN_SCALE as i128;
        let total_price = nft_amount * price_per_nft;

        let stablecoin_client = token::Client::new(&e, &stablecoin_address);

        let to_balance = stablecoin_client.balance(&to);

        assert!(
            to_balance >= total_price,
            "INSUFFICIENT_BALANCE_TO_BUY_NFTS"
        );

        // Get contract address
        let current_address = e.current_contract_address();

        // CHECK: to allowance should be enough to cover the buying fee
        let to_allowance = stablecoin_client.allowance(&to, &current_address);

        assert!(
            to_allowance >= total_price,
            "INSUFFICIENT_ALLOWANCE_TO_BUY_NFTS"
        );

        // DO: Trasnfer stablecoin total_price
        stablecoin_client.transfer_from(&e.current_contract_address(), &to, &from, &total_price);

        // DO: Transfer NFTs
        Self::batch_transfer_from(&e, &current_address, &from, &to, token_ids);

        // Emit TOKENS_BOUGHT event
        emit_tokens_bought_event(&e, from, to, nft_amount as u32);
    }

    pub fn sell_tokens(e: Env, from: Address, to: Address, token_ids: Vec<u32>) {
        // From should authorize this call
        from.require_auth();

        // CHECK: Current state should not be BuyingPhase
        let current_state: InvestmentStatus = e
            .storage()
            .instance()
            .get(&DataKey::State)
            .expect("State not set");

        assert!(
            current_state != InvestmentStatus::BuyingPhase,
            "NFT_TRANSFERS_NOT_ALLOWED_DURING_BUYING_PHASE"
        );

        // CHECK: Both from and to addresses should be either investors or owner
        let is_from_investor = e
            .storage()
            .instance()
            .get(&DataKey::Investor(from.clone()))
            .unwrap_or(false);

        let is_to_investor = e
            .storage()
            .instance()
            .get(&DataKey::Investor(to.clone()))
            .unwrap_or(false);

        let owner = ownable::get_owner(&e).expect("OWNER_NOT_SET");

        assert!(
            is_from_investor || from == owner,
            "FROM_ADDRESS_NOT_INVESTOR_OR_OWNER"
        );

        assert!(
            is_to_investor || to == owner,
            "TO_ADDRESS_NOT_INVESTOR_OR_OWNER"
        );

        let nft_amount = token_ids.len() as i128;

        // CHECK: nft_amount should be less than or equal to maximum allowed per transaction
        // assert!(
        //     nft_amount <= MAXIMUM_NFTS_PER_TRANSACTION,
        //     "MAXIMUM_NFTS_PER_TRANSACTION_EXCEEDED"
        // );

        // CHECK: from should have enough NFTs to sell
        let from_balance = Self::balance(&e, from.clone());

        assert!(
            from_balance as i128 >= nft_amount,
            "INSUFFICIENT_FROM_NFT_BALANCE"
        );

        // CHECK: to stablecoin balance should be enough to cover the selling fee
        let stablecoin_address: Address = e
            .storage()
            .instance()
            .get(&DataKey::StableCoin)
            .expect("STABLECOIN_NOT_SET");

        let stablecoin_client = token::Client::new(&e, &stablecoin_address);

        let price_per_nft = PRICE * STABLECOIN_SCALE as i128;
        let total_price = nft_amount * price_per_nft;

        let to_balance = stablecoin_client.balance(&to);

        assert!(
            to_balance >= total_price,
            "INSUFFICIENT_BALANCE_TO_SELL_NFTS"
        );

        // CHECK: to allowance should be enough to cover the selling fee
        let current_address = e.current_contract_address();

        let to_allowance = stablecoin_client.allowance(&to, &current_address);

        assert!(
            to_allowance >= total_price,
            "INSUFFICIENT_ALLOWANCE_TO_SELL_NFTS"
        );

        // DO: Trasnfer stablecoin total_price
        stablecoin_client.transfer_from(&e.current_contract_address(), &to, &from, &total_price);

        // DO: Transfer NFTs
        Self::batch_transfer_from(&e, &current_address, &from, &to, token_ids);

        // Emit TOKENS_SOLD event
        emit_tokens_sold_event(&e, from, to, nft_amount as u32);
    }

    //////////////////////// INTERNALS ////////////////////////////////

    fn batch_transfer_from(
        e: &Env,
        spender: &Address,
        from: &Address,
        to: &Address,
        token_ids: Vec<u32>,
    ) {
        spender.require_auth();

        let has_spender_approval_for_all = Base::is_approved_for_all(e, from, spender);

        assert!(has_spender_approval_for_all, "SPENDER_NOT_APPROVED_FOR_ALL");

        for i in 0..token_ids.len() {
            let token_id = token_ids.get(i).expect("Token id not found");
            Consecutive::update(e, Some(from), Some(to), token_id);
        }

        emit_batch_transfer_event(e, from, to, token_ids);
    }

    /// Internal distribution function
    /// The function called from releaseDistribution() and used to distribute to investors what they earned during the current period/stage.
    /// Arguments:
    /// * `percent`: the percentage of ROI to be released for the current stage.(Scaled by 10_000_000 to handle decimal percentages)
    fn distribute(e: &Env, percent: i128) {
        // CHECK: State should not be Ended
        let state: InvestmentStatus = e
            .storage()
            .instance()
            .get(&DataKey::State)
            .expect("State not set");

        assert!(
            state != InvestmentStatus::Ended,
            "DISTRIBUTION_ALREADY_ENDED"
        );

        // CALCULATE amount to release for the current stage
        let amount_to_release = Self::calculate_amount_to_release(e.clone(), percent);
        e.storage()
            .instance()
            .set(&DataKey::AmountToReleaseForCurrentStage, &amount_to_release);

        let stablecoin: Address = e
            .storage()
            .instance()
            .get(&DataKey::StableCoin)
            .expect("Stablecoin not set");
        let payer: Address = e.storage().instance().get(&DataKey::Payer).unwrap();
        let investors: Vec<Address> = e
            .storage()
            .instance()
            .get(&DataKey::InvestorsArray)
            .expect("InvestorsArray not set");

        let token_client = token::Client::new(&e, &stablecoin);
        let mut verify_released_amount: i128 = 0;

        let current_address = e.current_contract_address();

        for investor in investors.iter() {
            let balance = Base::balance(&e, &investor) as i128;
            let investor_amount = ((balance * percent) / 100) * PRICE;

            // Update claimed amount for the investor
            let mut claimed: i128 = e
                .storage()
                .instance()
                .get(&DataKey::ClaimedAmount(investor.clone()))
                .unwrap_or(0);

            claimed += investor_amount;

            e.storage()
                .instance()
                .set(&DataKey::ClaimedAmount(investor.clone()), &claimed);

            // Increase the verify released amount by the investor amount
            verify_released_amount += investor_amount;

            // Do the transfer from payer to investor
            // NOTE: The payer must have approved the contract to spend the stablecoin on their behalf
            token_client.transfer_from(&current_address, &payer, &investor, &investor_amount);
        }

        // CHECK: verify released amount should be equal to amount to release
        assert!(
            verify_released_amount == amount_to_release,
            "DISTRIBUTION_AMOUNT_MISMATCH"
        );
    }

    //////////////////////// TO DELETE FOR PROD ////////////////////////////////

    /// Sets a new receiver address. Only the contract owner can call this function.
    #[only_owner]
    pub fn set_receiver(e: &Env, receiver: Address) {
        e.storage().instance().set(&DataKey::Receiver, &receiver);
    }

    /// Sets a new payer address. Only the contract owner can call this function.
    #[only_owner]
    pub fn set_payer(e: &Env, payer: Address) {
        e.storage().instance().set(&DataKey::Payer, &payer);
    }

    pub fn hello(env: Env, to: String) -> Vec<String> {
        vec![&env, String::from_str(&env, "Hello"), to]
    }
}

#[default_impl]
#[contractimpl]
impl NonFungibleToken for Minah {
    type ContractType = Consecutive;

    fn transfer(_e: &Env, _from: Address, _to: Address, _token_id: u32) {
        panic!("TRANSFERS_DISABLED_FOR_MINAH_NFTS");
    }

    fn transfer_from(_e: &Env, _spender: Address, _from: Address, _to: Address, _token_id: u32) {
        panic!("TRANSFERS_DISABLED_FOR_MINAH_NFTS");
    }
}

impl NonFungibleConsecutive for Minah {}

#[default_impl]
#[contractimpl]
impl Ownable for Minah {}

#[cfg(test)]
mod tests;
