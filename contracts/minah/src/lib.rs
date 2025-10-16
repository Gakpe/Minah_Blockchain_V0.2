#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, vec, Address, Env, String, Vec};
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
    pub current_stage_release: i128,
    pub countdown_start: bool,
    pub state: InvestmentStatus,
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

    /// Returns the address of the stablecoin used for investments.
    pub fn get_stablecoin(e: &Env) -> Address {
        e.storage()
            .instance()
            .get(&DataKey::StableCoin)
            .expect("Stablecoin not set")
    }

    /// Sets a new stablecoin address. Only the contract owner can call this function.
    #[only_owner]
    pub fn set_stablecoin(e: &Env, stablecoin: Address) {
        e.storage()
            .instance()
            .set(&DataKey::StableCoin, &stablecoin);
    }

    pub fn get_receiver(e: &Env) -> Address {
        e.storage()
            .instance()
            .get(&DataKey::Receiver)
            .expect("Receiver not set")
    }

    pub fn get_payer(e: &Env) -> Address {
        e.storage()
            .instance()
            .get(&DataKey::Payer)
            .expect("Payer not set")
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
impl Ownable for Minah {}

#[cfg(test)]
mod tests;
