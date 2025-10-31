use soroban_sdk::{
    testutils::{Address as _, Ledger},
    Address, Env, Vec,
};

use crate::tests::utils::{
    create_client, deploy_stablecoin_contract, distribution_intervals_vec, mint_nft,
    roi_percentages_vec, DISTRIBUTION_INTERVALS, MAX_NFTS_PER_INVESTOR, MIN_NFTS_TO_MINT, PRICE,
    ROI_PERCENTAGES, TOTAL_SUPPLY, USDC_DECIMALS,
};

/// Full lifecycle test: mint -> start -> distribute -> trade -> distribute more
#[test]
fn test_full_investment_lifecycle() {
    let env = Env::default();
    let owner = Address::generate(&env);
    let stablecoin_address =
        deploy_stablecoin_contract(&env, &owner, 100_000_000 * 10i128.pow(USDC_DECIMALS));
    let receiver = Address::generate(&env);
    let payer = Address::generate(&env);

    let (client, contract_id) = create_client(
        &env,
        &owner,
        &stablecoin_address,
        &receiver,
        &payer,
        PRICE,
        TOTAL_SUPPLY,
        MIN_NFTS_TO_MINT,
        MAX_NFTS_PER_INVESTOR,
        distribution_intervals_vec(&env),
        roi_percentages_vec(&env),
    );

    let stablecoin_client = stablecoin::StablecoinClient::new(&env, &stablecoin_address);

    // Fund payer with enough stablecoin for distributions
    let payer_funding = 10_000_000 * 10i128.pow(USDC_DECIMALS);
    stablecoin_client.transfer(&owner, &payer, &payer_funding);

    // Phase 1: Buying Phase - Multiple investors mint NFTs
    let investor1 = Address::generate(&env);
    let investor2 = Address::generate(&env);
    let investor3 = Address::generate(&env);

    mint_nft(&env, &client, &investor1, 100, &owner, &stablecoin_address, &contract_id);
    mint_nft(&env, &client, &investor2, 50, &owner, &stablecoin_address, &contract_id);
    mint_nft(&env, &client, &investor3, 25, &owner, &stablecoin_address, &contract_id);

    assert_eq!(client.get_current_supply(), 175);
    assert_eq!(client.get_current_state(), crate::InvestmentStatus::BuyingPhase);

    // Phase 2: Start chronometer
    client.start_chronometer();
    let start_time = env.ledger().timestamp();

    assert_eq!(client.get_current_state(), crate::InvestmentStatus::BeforeFirstRelease);
    assert_eq!(client.get_current_supply(), TOTAL_SUPPLY); // Owner gets remaining
    assert_eq!(client.get_nft_buying_phase_supply(), 175);

    // Phase 3: First distribution
    env.ledger().set_timestamp(start_time + DISTRIBUTION_INTERVALS[0]);
    let percent_0 = ROI_PERCENTAGES[0];
    let amount_0 = client.calculate_amount_to_release(&percent_0);
    stablecoin_client.approve(&payer, &contract_id, &amount_0, &100);
    client.release_distribution();

    assert_eq!(client.get_current_state(), crate::InvestmentStatus::Release1);

    // Phase 4: Trading between investors
    let mut token_ids: Vec<u32> = Vec::new(&env);
    for i in 0..10 {
        token_ids.push_back(i);
    }

    let price_for_10 = 10 * PRICE * 10i128.pow(USDC_DECIMALS);
    stablecoin_client.transfer(&owner, &investor2, &price_for_10);
    stablecoin_client.approve(&investor2, &contract_id, &price_for_10, &100);
    client.approve_for_all(&investor1, &contract_id, &100);

    client.buy_tokens(&investor1, &investor2, &token_ids);

    // Verify balances changed
    assert_eq!(client.balance(&investor1), 90);
    assert_eq!(client.balance(&investor2), 60);

    // Phase 5: Second distribution
    env.ledger().set_timestamp(start_time + DISTRIBUTION_INTERVALS[1]);
    let percent_1 = ROI_PERCENTAGES[1];
    let amount_1 = client.calculate_amount_to_release(&percent_1);
    stablecoin_client.approve(&payer, &contract_id, &amount_1, &100);
    client.release_distribution();

    assert_eq!(client.get_current_state(), crate::InvestmentStatus::Release2);

    // Verify claimed amounts reflect both distributions
    let price = client.get_nft_price();
    let expected_investor1_stage0 = (100 * price * percent_0) / 100;
    let expected_investor1_stage1 = (90 * price * percent_1) / 100; // After selling 10
    let total_investor1 = expected_investor1_stage0 + expected_investor1_stage1;

    assert_eq!(client.see_claimed_amount(&investor1), total_investor1);
}

/// Test with maximum investors and full supply
#[test]
fn test_maximum_investors_scenario() {
    let env = Env::default();
    let owner = Address::generate(&env);
    let stablecoin_address =
        deploy_stablecoin_contract(&env, &owner, 100_000_000 * 10i128.pow(USDC_DECIMALS));
    let receiver = Address::generate(&env);
    let payer = Address::generate(&env);

    let (client, contract_id) = create_client(
        &env,
        &owner,
        &stablecoin_address,
        &receiver,
        &payer,
        PRICE,
        TOTAL_SUPPLY,
        MIN_NFTS_TO_MINT,
        MAX_NFTS_PER_INVESTOR,
        distribution_intervals_vec(&env),
        roi_percentages_vec(&env),
    );

    // Calculate how many investors needed to fill total supply
    let num_investors = TOTAL_SUPPLY / MAX_NFTS_PER_INVESTOR;

    // Create and mint for all investors
    for _ in 0..num_investors {
        let investor = Address::generate(&env);
        mint_nft(
            &env,
            &client,
            &investor,
            MAX_NFTS_PER_INVESTOR,
            &owner,
            &stablecoin_address,
            &contract_id,
        );
    }

    assert_eq!(client.get_current_supply(), TOTAL_SUPPLY);
    assert_eq!(client.get_investors_array_length(), num_investors);
}

/// Test distribution with investor who sold all their NFTs
#[test]
fn test_distribution_after_investor_sells_all() {
    let env = Env::default();
    let owner = Address::generate(&env);
    let stablecoin_address =
        deploy_stablecoin_contract(&env, &owner, 100_000_000 * 10i128.pow(USDC_DECIMALS));
    let receiver = Address::generate(&env);
    let payer = Address::generate(&env);

    let (client, contract_id) = create_client(
        &env,
        &owner,
        &stablecoin_address,
        &receiver,
        &payer,
        PRICE,
        TOTAL_SUPPLY,
        MIN_NFTS_TO_MINT,
        MAX_NFTS_PER_INVESTOR,
        distribution_intervals_vec(&env),
        roi_percentages_vec(&env),
    );

    let stablecoin_client = stablecoin::StablecoinClient::new(&env, &stablecoin_address);

    // Fund payer with enough stablecoin for distributions
    let payer_funding = 10_000_000 * 10i128.pow(USDC_DECIMALS);
    stablecoin_client.transfer(&owner, &payer, &payer_funding);

    let seller = Address::generate(&env);
    let buyer = Address::generate(&env);

    // Seller mints 50 NFTs
    mint_nft(&env, &client, &seller, 50, &owner, &stablecoin_address, &contract_id);

    client.start_chronometer();
    let start_time = env.ledger().timestamp();

    // First distribution
    env.ledger().set_timestamp(start_time + DISTRIBUTION_INTERVALS[0]);
    let percent_0 = ROI_PERCENTAGES[0];
    let amount_0 = client.calculate_amount_to_release(&percent_0);
    stablecoin_client.approve(&payer, &contract_id, &amount_0, &100);
    client.release_distribution();

    let claimed_after_first = client.see_claimed_amount(&seller);
    assert!(claimed_after_first > 0);

    // Seller sells all NFTs to buyer
    client.create_investor(&buyer);
    let mut token_ids: Vec<u32> = Vec::new(&env);
    for i in 0..50 {
        token_ids.push_back(i);
    }

    let total_price = 50 * PRICE * 10i128.pow(USDC_DECIMALS);
    stablecoin_client.transfer(&owner, &buyer, &total_price);
    stablecoin_client.approve(&buyer, &contract_id, &total_price, &100);
    client.approve_for_all(&seller, &contract_id, &100);

    client.buy_tokens(&seller, &buyer, &token_ids);

    // Verify seller has 0 NFTs
    assert_eq!(client.balance(&seller), 0);
    assert_eq!(client.balance(&buyer), 50);

    // Second distribution
    env.ledger().set_timestamp(start_time + DISTRIBUTION_INTERVALS[1]);
    let percent_1 = ROI_PERCENTAGES[1];
    let amount_1 = client.calculate_amount_to_release(&percent_1);
    stablecoin_client.approve(&payer, &contract_id, &amount_1, &100);
    client.release_distribution();

    // Seller's claimed amount should not increase (has 0 NFTs)
    assert_eq!(client.see_claimed_amount(&seller), claimed_after_first);

    // Buyer should have received distribution for their 50 NFTs
    let price = client.get_nft_price();
    let expected_buyer = (50 * price * percent_1) / 100;
    assert_eq!(client.see_claimed_amount(&buyer), expected_buyer);
}

/// Test complex trading scenario with multiple swaps
#[test]
fn test_complex_trading_scenario() {
    let env = Env::default();
    let owner = Address::generate(&env);
    let stablecoin_address =
        deploy_stablecoin_contract(&env, &owner, 100_000_000 * 10i128.pow(USDC_DECIMALS));
    let receiver = Address::generate(&env);
    let payer = Address::generate(&env);

    let (client, contract_id) = create_client(
        &env,
        &owner,
        &stablecoin_address,
        &receiver,
        &payer,
        PRICE,
        TOTAL_SUPPLY,
        MIN_NFTS_TO_MINT,
        MAX_NFTS_PER_INVESTOR,
        distribution_intervals_vec(&env),
        roi_percentages_vec(&env),
    );

    let stablecoin_client = stablecoin::StablecoinClient::new(&env, &stablecoin_address);

    let investor1 = Address::generate(&env);
    let investor2 = Address::generate(&env);
    let investor3 = Address::generate(&env);

    // Initial minting
    mint_nft(&env, &client, &investor1, 100, &owner, &stablecoin_address, &contract_id);
    mint_nft(&env, &client, &investor2, 50, &owner, &stablecoin_address, &contract_id);
    mint_nft(&env, &client, &investor3, 25, &owner, &stablecoin_address, &contract_id);

    client.start_chronometer();

    // Trade 1: investor1 sells 20 to investor2
    let mut token_ids_1: Vec<u32> = Vec::new(&env);
    for i in 0..20 {
        token_ids_1.push_back(i);
    }
    let price_20 = 20 * PRICE * 10i128.pow(USDC_DECIMALS);
    stablecoin_client.transfer(&owner, &investor2, &price_20);
    stablecoin_client.approve(&investor2, &contract_id, &price_20, &100);
    client.approve_for_all(&investor1, &contract_id, &100);
    client.buy_tokens(&investor1, &investor2, &token_ids_1);

    assert_eq!(client.balance(&investor1), 80);
    assert_eq!(client.balance(&investor2), 70);

    // Trade 2: investor2 sells 10 to investor3
    let mut token_ids_2: Vec<u32> = Vec::new(&env);
    for i in 0..10 {
        token_ids_2.push_back(i);
    }
    let price_10 = 10 * PRICE * 10i128.pow(USDC_DECIMALS);
    stablecoin_client.transfer(&owner, &investor3, &price_10);
    stablecoin_client.approve(&investor3, &contract_id, &price_10, &100);
    client.approve_for_all(&investor2, &contract_id, &100);
    client.buy_tokens(&investor2, &investor3, &token_ids_2);

    assert_eq!(client.balance(&investor1), 80);
    assert_eq!(client.balance(&investor2), 60);
    assert_eq!(client.balance(&investor3), 35);
}

