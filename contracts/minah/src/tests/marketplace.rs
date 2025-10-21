use soroban_sdk::{
    log,
    testutils::{Address as _, Ledger},
    Address, Env, Vec,
};

use crate::{
    tests::utils::{deploy_stablecoin_contract, mint_nft},
    InvestmentStatus, Minah, MinahClient, DISTRIBUTION_INTERVALS, PRICE, ROI_PERCENTAGES, TOTAL_SUPPLY,
};

#[test]
#[should_panic(expected = "TRANSFERS_DISABLED_FOR_MINAH_NFTS")]
fn test_transfer_nft() {
    let env = Env::default();

    let owner = Address::generate(&env);
    let stablecoin_address = deploy_stablecoin_contract(&env, &owner, 100_000_000 * 10i128.pow(6)); // Ensure huge supply
    let receiver = Address::generate(&env);
    let payer = Address::generate(&env);

    env.mock_all_auths();
    let contract_id = env.register(Minah, (&owner, &stablecoin_address, &receiver, &payer));
    let client = MinahClient::new(&env, &contract_id);

    // --- Setup Investor ---
    let investor = Address::generate(&env);
    let nft_amount: u32 = 40;

    mint_nft(
        &env,
        &client,
        &investor,
        nft_amount,
        &owner,
        &stablecoin_address,
        &contract_id,
    );

    let expected_current_supply = nft_amount;

    // CHECK: Total supply should be nft_amount
    assert_eq!(client.get_current_supply(), expected_current_supply);

    // --- Transfer NFTs between AN investor and normal user ---
    let normal_user = Address::generate(&env);

    // Transfer 1 NFTs from investor to normal_user
    client.transfer(&investor, &normal_user, &0);
}

#[test]
fn test_buy_tokens() {
    let env = Env::default();
    let owner = Address::generate(&env);
    let stablecoin_address = deploy_stablecoin_contract(&env, &owner, 100_000_000 * 10i128.pow(6)); // Ensure huge supply
    let receiver = Address::generate(&env);
    let payer = Address::generate(&env);

    env.mock_all_auths();
    let contract_id = env.register(Minah, (&owner, &stablecoin_address, &receiver, &payer));
    let client = MinahClient::new(&env, &contract_id);
    let stablecoin_client = stablecoin::StablecoinClient::new(&env, &stablecoin_address);

    // --- Setup Multiple Investors ---
    let investor1 = Address::generate(&env); // Will hold 100 NFTs
    let investor2 = Address::generate(&env); // Will hold 50 NFTs

    let nft_amount_1: u32 = 100;
    let nft_amount_2: u32 = 50;

    // Mint NFTs to investor1
    mint_nft(
        &env,
        &client,
        &investor1,
        nft_amount_1,
        &owner,
        &stablecoin_address,
        &contract_id,
    );

    // Mint NFTs to investor2
    mint_nft(
        &env,
        &client,
        &investor2,
        nft_amount_2,
        &owner,
        &stablecoin_address,
        &contract_id,
    );

    let expected_current_supply = nft_amount_1 + nft_amount_2;

    // CHECK: Total supply should be nft_amount_1 + nft_amount_2
    assert_eq!(client.get_current_supply(), expected_current_supply);

    // Start Chronmeter
    client.start_chronometer();

    // CHECK: Chronometer should be started
    assert!(client.is_chronometer_started());

    // Buy NFTs from investor1 to investor2
    let mut tokens_to_buy_from_investor1: Vec<u32> = Vec::new(&env);
    for i in 0..50 {
        tokens_to_buy_from_investor1.push_back(i);
    }

    // Investor 2 approves the contract to spend stablecoins on his behalf
    let total_price_in_stablecoin: i128 = 50 * PRICE * 10i128.pow(6); // 50 NFTs

    stablecoin_client.approve(&investor2, &contract_id, &total_price_in_stablecoin, &100);

    stablecoin_client.transfer(&owner, &investor2, &total_price_in_stablecoin);

    // Investor 1 approves the contract to transfer his all NFTs
    client.approve_for_all(&investor1, &contract_id, &100);

    // Investor2 buys 50 NFTs from investor1
    client.buy_tokens(&investor1, &investor2, &tokens_to_buy_from_investor1);

    // CHECK: Investor 2 should own 100 NFTs now
    let investor2_nft_balance = client.balance(&investor2);
    assert_eq!(investor2_nft_balance, 100);

    // CHECK: Investor 1 should own 50 NFTs now
    let investor1_nft_balance = client.balance(&investor1);
    assert_eq!(investor1_nft_balance, 50);

    // CHECK: Total supply should remain the same
    assert_eq!(client.get_current_supply(), TOTAL_SUPPLY);
}
