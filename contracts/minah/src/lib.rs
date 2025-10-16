#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, vec, Address, Env, String, Symbol, Vec};
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
    pub current_supply: u128,
    pub begin_date: u64,
    pub current_stage_release: u128,
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
const ITEM_ID: u128 = 0;
const TOTAL_SUPPLY: u128 = 4500;
const PRICE: u128 = 455;

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

const ROI_PERCENTAGES: [u128; 10] = [8, 8, 8, 8, 8, 8, 8, 8, 8, 108];

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
        e.storage().instance().set(&DataKey::CurrentSupply, &0u128);
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
        e.storage().instance().set(
            &DataKey::ClaimedAmount(new_investor.clone()),
            &0u128,
        );

        // Emit INVESTOR_CREATED event
        emit_investor_created_event(&e, new_investor);
    }

    /// Mints a new NFT to the specified address.
    /// TODO: Add payment verification logic.
    pub fn mint(e: &Env, to: Address, _amount: u128) {
        Base::sequential_mint(e, &to);
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

    /// Returns the address of the payer.
    pub fn get_payer(e: &Env) -> Address {
        e.storage()
            .instance()
            .get(&DataKey::Payer)
            .expect("Payer not set")
    }

    /// Get claimed amount for an investor
    pub fn see_claimed_amount(e: Env, investor: Address) -> u128 {
        e.storage()
            .instance()
            .get(&DataKey::ClaimedAmount(investor))
            .unwrap_or(0)
    }

    /// Get current supply
    pub fn get_current_supply(e: Env) -> u128 {
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
