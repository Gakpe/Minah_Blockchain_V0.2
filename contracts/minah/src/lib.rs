#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, log, token, vec, Address, Env, String, Symbol, Vec,
};
use stellar_access::ownable::{self as ownable, Ownable};
use stellar_macros::{default_impl, only_owner};
use stellar_tokens::non_fungible::{Base, NonFungibleToken};

#[derive(Clone, Copy, PartialEq, Eq)]
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

#[contracttype]
pub struct Config {
    pub stablecoin: Address,
    pub receiver: Address,
    pub payer: Address,
    pub current_supply: i128,
    pub begin_date: u64,
    pub current_stage_release: i128,
    pub countdown_start: bool,
    pub state: InvestmentStatus,
}

//////////////////////// EVENTS ////////////////////////////////

fn emit_investor_created_event(e: &Env, investor: Address) {
    let topics = (Symbol::new(e, "InvestorCreated"), investor);
    e.events().publish(topics, ());
}

#[contract]
pub struct Minah;

// Constants
const TOTAL_SUPPLY: u32 = 4500;
const PRICE: i128 = 1;
const STABLECOIN_SCALE: u32 = 10u32.pow(6); // USDC has 6 decimals

// Distribution intervals in seconds
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

const ROI_PERCENTAGES: [i128; 10] = [8, 8, 8, 8, 8, 8, 8, 8, 8, 108];

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

        log!(&e, "Minting {} NFTs to {}", amount, user);

        // CHECK: Amount should be >= 40
        assert!(amount >= 40, "MINIMUM_INVESTMENT_NOT_MET");

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

        // CHECK: Investor NFTS should not exceed 150
        let investor_balance = Self::balance(&e, user.clone());

        assert!(
            investor_balance + amount <= 150,
            "MAXIMUM_NFTS_PER_INVESTOR_EXCEEDED"
        );

        log!(
            &e,
            "Current supply: {}, New supply: {}",
            current_supply,
            new_supply
        );

        let usd_amount = PRICE * amount as i128 * STABLECOIN_SCALE as i128;

        // CHECK: User has enough balance of stablecoin
        let stablecoin_address: Address = e
            .storage()
            .instance()
            .get(&DataKey::StableCoin)
            .expect("Stablecoin not set");

        log!(&e, "Using stablecoin at address: {}", stablecoin_address);

        let stablecoin_client = token::Client::new(&e, &stablecoin_address);

        log!(
            &e,
            "Stablecoin client created for address: {}",
            stablecoin_address
        );

        let user_balance = stablecoin_client.balance(&user);

        log!(
            &e,
            "User balance: {}, Required amount: {}",
            user_balance,
            usd_amount
        );

        assert!(user_balance >= usd_amount, "INSUFFICIENT_BALANCE");

        // CHECK: User has enough balance of stablecoin
        let current_address = e.current_contract_address();

        let user_allowance = stablecoin_client.allowance(&user, &current_address);

        assert!(user_allowance >= usd_amount, "INSUFFICIENT_ALLOWANCE");

        let receiver: Address = e
            .storage()
            .instance()
            .get(&DataKey::Receiver)
            .expect("Receiver not set");

        // Do the transfer of stablecoin from user to the receiver address
        stablecoin_client.transfer_from(&user, &user, &receiver, &usd_amount);

        // Update current supply to new supply
        e.storage()
            .instance()
            .set(&DataKey::CurrentSupply, &new_supply);

        // Mint the requested amount of NFTs to the specified address
        for _ in 0..amount {
            // Mint the NFT
            Base::sequential_mint(&e, &user);
        }

        // TODO: emit NFT_MINTED event
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

            for _ in 0..remaining {
                Base::sequential_mint(&e, &owner);
            }
        }
    }

    /// Calculate amount to release for a given percentage
    /// Function to know how much to approve() on the STABLECOIN smart contract before releasing the amount to all investors.
    /// Arguments:
    /// * `percentage`: the percentage of ROI to be released for the current stage.
    pub fn calculate_amount_to_release(e: Env, percent: i128) -> i128 {
        let investors: Vec<Address> = e
            .storage()
            .instance()
            .get(&DataKey::InvestorsArray)
            .expect("InvestorsArray not set");

        let mut amount_to_release: i128 = 0;
        let scaled_percent = percent * 1_000_000;

        for i in 0..investors.len() {
            let investor = investors.get(i).expect("Investor not found");
            let balance = Base::balance(&e, &investor) as i128;
            let investor_amount = ((balance * scaled_percent) / 100i128) * PRICE;

            amount_to_release += investor_amount;
        }

        amount_to_release
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

        let elapsed = e.ledger().timestamp() - begin_date;

        let mut state: InvestmentStatus = e
            .storage()
            .instance()
            .get(&DataKey::State)
            .expect("State not set");

        let mut current_stage_index = (state as u32) - 1;
        let mut distributed = false;

        while (current_stage_index as usize) < DISTRIBUTION_INTERVALS.len()
            && elapsed >= DISTRIBUTION_INTERVALS[current_stage_index as usize]
        {
            // Distribute for this stage
            Self::distribute(&e, ROI_PERCENTAGES[current_stage_index as usize]);

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

            // Saturate to avoid overflow(If the calculation overflows the min value of the type, it will be set to the min value)
            current_stage_index = (state as u32).saturating_sub(1);
            distributed = true;

            if state == InvestmentStatus::ThreeYearsSixMonthsDone {
                e.storage()
                    .instance()
                    .set(&DataKey::State, &InvestmentStatus::Ended);
                break;
            }
        }

        assert!(distributed, "DISTRIBUTION_NOT_READY_YET");
    }

    /// Internal distribution function
    /// The function called from releaseDistribution() and used to distribute to investors what they earned during the current period/stage.
    /// Arguments:
    /// * `percent`: the percentage of ROI to be released for the current stage.
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
        let scaled_percent = percent * 1_000_000;
        let mut verify_released_amount: i128 = 0;

        for i in 0..investors.len() {
            let investor = investors.get(i).unwrap();
            let balance = Base::balance(&e, &investor) as i128;
            let investor_amount = ((balance * scaled_percent) / 100) * PRICE;

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
            token_client.transfer_from(&payer, &payer, &investor, &investor_amount);
        }

        // CHECK: verify released amount should be equal to amount to release
        assert!(
            verify_released_amount == amount_to_release,
            "DISTRIBUTION_AMOUNT_MISMATCH"
        );
    }

    //////////////////////// Getters ////////////////////////////////

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
    pub fn get_current_supply(e: Env) -> i128 {
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
    type ContractType = Base;
}

#[default_impl]
#[contractimpl]
impl Ownable for Minah {}

#[cfg(test)]
mod tests;
