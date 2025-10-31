use soroban_sdk::{testutils::Address as _, Address, Env};

use crate::tests::utils::{
    create_client, deploy_stablecoin_contract, distribution_intervals_vec, mint_nft,
    roi_percentages_vec, MAX_NFTS_PER_INVESTOR, MIN_NFTS_TO_MINT, PRICE, TOTAL_SUPPLY,
    USDC_DECIMALS,
};

#[test]
fn test_nft_metadata() {
    let env = Env::default();
    let receiver = Address::generate(&env);
    let payer = Address::generate(&env);
    let owner = Address::generate(&env);
    let stablecoin_address = deploy_stablecoin_contract(&env, &owner, 1000000);

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

    // Check NFT metadata
    let name = client.name();
    let symbol = client.symbol();

    assert_eq!(name, soroban_sdk::String::from_str(&env, "Minah"));
    assert_eq!(symbol, soroban_sdk::String::from_str(&env, "MNH"));
}

#[test]
fn test_balance_queries_for_non_holders() {
    let env = Env::default();
    let receiver = Address::generate(&env);
    let payer = Address::generate(&env);
    let owner = Address::generate(&env);
    let stablecoin_address = deploy_stablecoin_contract(&env, &owner, 1000000);

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

    let random_address = Address::generate(&env);

    // Balance should be 0 for non-holders
    assert_eq!(client.balance(&random_address), 0);
}

#[test]
fn test_investor_status_for_non_investors() {
    let env = Env::default();
    let receiver = Address::generate(&env);
    let payer = Address::generate(&env);
    let owner = Address::generate(&env);
    let stablecoin_address = deploy_stablecoin_contract(&env, &owner, 1000000);

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

    let random_address = Address::generate(&env);

    // Should return false for non-investors
    assert!(!client.is_investor(&random_address));
}

#[test]
fn test_claimed_amount_for_non_investors() {
    let env = Env::default();
    let receiver = Address::generate(&env);
    let payer = Address::generate(&env);
    let owner = Address::generate(&env);
    let stablecoin_address = deploy_stablecoin_contract(&env, &owner, 1000000);

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

    let random_address = Address::generate(&env);

    // Should return 0 for non-investors
    assert_eq!(client.see_claimed_amount(&random_address), 0);
}

#[test]
fn test_owner_of_nft() {
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

    let investor = Address::generate(&env);
    let nft_amount = 10u32;

    mint_nft(
        &env,
        &client,
        &investor,
        nft_amount,
        &owner,
        &stablecoin_address,
        &contract_id,
    );

    // Check ownership of minted NFTs
    for i in 0..nft_amount {
        let nft_owner = client.owner_of(&i);
        assert_eq!(nft_owner, investor);
    }
}

#[test]
fn test_approval_for_all() {
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

    let investor = Address::generate(&env);
    let operator = Address::generate(&env);

    mint_nft(
        &env,
        &client,
        &investor,
        10,
        &owner,
        &stablecoin_address,
        &contract_id,
    );

    // Initially, operator should not be approved
    assert!(!client.is_approved_for_all(&investor, &operator));

    // Approve operator
    client.approve_for_all(&investor, &operator, &100);

    // Now operator should be approved
    assert!(client.is_approved_for_all(&investor, &operator));
}

#[test]
fn test_zero_investors_array_length_initially() {
    let env = Env::default();
    let receiver = Address::generate(&env);
    let payer = Address::generate(&env);
    let owner = Address::generate(&env);
    let stablecoin_address = deploy_stablecoin_contract(&env, &owner, 1000000);

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

    // Initially, no investors
    assert_eq!(client.get_investors_array_length(), 0);
}

#[test]
fn test_mint_increments_investor_balance() {
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
    let investor = Address::generate(&env);

    // Mint first batch
    mint_nft(
        &env,
        &client,
        &investor,
        50,
        &owner,
        &stablecoin_address,
        &contract_id,
    );

    assert_eq!(client.balance(&investor), 50);

    // Mint second batch - manually without creating investor again
    let nft_amount = 30u32;
    let nft_price = client.get_nft_price();
    let total_amount = nft_price * (nft_amount as i128) * 10i128.pow(USDC_DECIMALS);

    // Transfer stablecoin to the investor
    stablecoin_client.transfer(&owner, &investor, &total_amount);

    // Approve contract to spend
    stablecoin_client.approve(&investor, &contract_id, &total_amount, &100);

    // Mint the NFTs
    client.mint(&investor, &nft_amount);

    // Balance should be cumulative
    assert_eq!(client.balance(&investor), 80);
}

#[test]
fn test_state_progression_through_releases() {
    let env = Env::default();
    let owner = Address::generate(&env);
    let stablecoin_address = deploy_stablecoin_contract(&env, &owner, 100_000_000 * 10i128.pow(6));
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

    // Initial state
    assert_eq!(client.get_current_state(), crate::InvestmentStatus::BuyingPhase);

    let investor = Address::generate(&env);
    mint_nft(
        &env,
        &client,
        &investor,
        50,
        &owner,
        &stablecoin_address,
        &contract_id,
    );

    // Start chronometer changes state
    client.start_chronometer();
    assert_eq!(
        client.get_current_state(),
        crate::InvestmentStatus::BeforeFirstRelease
    );
}

