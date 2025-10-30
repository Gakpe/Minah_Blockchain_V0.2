use soroban_sdk::{Address, Env, Vec};
use stablecoin::Stablecoin;

use crate::{Minah, MinahClient};

pub fn create_client<'a>(
    env: &Env,
    owner: &Address,
    stablecoin_address: &Address,
    receiver: &Address,
    payer: &Address,
    price: i128,
    total_supply: u32,
    min_nfts_to_mint: u32,
    max_nfts_per_investor: u32,
    distribution_intervals: Vec<u64>,
    roi_percentages: Vec<i128>,
) -> (MinahClient<'a>, Address) {
    env.mock_all_auths();

    let contract_id = env.register(
        Minah,
        (
            owner,
            stablecoin_address,
            receiver,
            payer,
            price,
            total_supply,
            min_nfts_to_mint,
            max_nfts_per_investor,
            distribution_intervals,
            roi_percentages,
        ),
    );

    let client = MinahClient::new(env, &contract_id);

    (client, contract_id)
}

pub fn deploy_stablecoin_contract(env: &Env, user: &Address, premint_amount: i128) -> Address {
    let contract_id = env.register(Stablecoin, (user, premint_amount));

    contract_id
}

pub fn mint_nft(
    env: &Env,
    client: &MinahClient,
    nft_receiver: &Address,
    nft_amount: u32,
    owner: &Address,
    stablecoin_address: &Address,
    contract_id: &Address,
) {
    // Create An investor before minting
    client.create_investor(&nft_receiver);

    // CHECK: Is the investor created successfully?
    let is_investor = client.is_investor(&nft_receiver);
    assert!(is_investor);

    // Transfer The Required Stablecoin Amount to the nft receiver so that the minting can proceed
    let nft_price = client.get_nft_price();

    let total_amount = nft_price * (nft_amount as i128) * 10i128.pow(USDC_DECIMALS);

    let stablecoin_client = stablecoin::StablecoinClient::new(&env, &stablecoin_address);

    // Transfer stablecoin to the nft_receiver
    stablecoin_client.transfer(&owner, &nft_receiver, &total_amount);

    // CHECK: balance of nft_receiver should be equal to total_amount
    let nft_receiver_balance = stablecoin_client.balance(&nft_receiver);
    assert_eq!(nft_receiver_balance, total_amount);

    // Increase Allowance for the payer to allow the contract to spend stablecoin on behalf of nft_receiver
    stablecoin_client.approve(&nft_receiver, &contract_id, &total_amount, &100);

    let allowance = stablecoin_client.allowance(&nft_receiver, &contract_id);

    // CHECK: allowance should be equal to total_amount
    assert_eq!(allowance, total_amount);

    // Mint the NFTs
    client.mint(&nft_receiver, &nft_amount);

    // CHECK: NFT balance of nft_receiver should be
    let nft_balance = client.balance(&nft_receiver);

    assert_eq!(nft_balance, nft_amount);
}

pub const USDC_DECIMALS: u32 = 7;
pub const TOTAL_SUPPLY: u32 = 4500;
pub const PRICE: i128 = 1; // in stablecoin units
pub const MIN_NFTS_TO_MINT: u32 = 10;
pub const MAX_NFTS_PER_INVESTOR: u32 = 500;

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

pub const DISTRIBUTION_INTERVALS: [u64; 10] = [
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
pub const ROI_PERCENTAGES: [i128; 10] = [
    40_000_000, 26_700_000, 26_700_000, 26_700_000, 26_700_000, 26_700_000, 26_700_000, 26_700_000,
    26_700_000, 26_700_000,
];

pub fn roi_percentages_vec(env: &Env) -> Vec<i128> {
    let mut vec: Vec<i128> = Vec::new(env);

    for percentage in ROI_PERCENTAGES.iter() {
        vec.push_back(*percentage);
    }
    vec
}

pub fn distribution_intervals_vec(env: &Env) -> Vec<u64> {
    let mut vec: Vec<u64> = Vec::new(env);

    for interval in DISTRIBUTION_INTERVALS.iter() {
        vec.push_back(*interval);
    }
    vec
}
