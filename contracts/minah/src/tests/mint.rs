use soroban_sdk::{testutils::Address as _, Address, Env};

use crate::{
    tests::utils::{
        create_client, deploy_stablecoin_contract, distribution_intervals_vec, mint_nft,
        roi_percentages_vec, MAX_NFTS_PER_INVESTOR, MIN_NFTS_TO_MINT, PRICE, TOTAL_SUPPLY,
        USDC_DECIMALS,
    },
    InvestmentStatus, STABLECOIN_DECIMALS,
};

#[test]
#[should_panic(expected = "USER_NOT_AN_INVESTOR")]
fn test_mint_nft_to_non_investor() {
    let env = Env::default();
    let owner = Address::generate(&env);
    let stablecoin_address = deploy_stablecoin_contract(&env, &owner, 1000000);
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

    let nft_receiver = Address::generate(&env);

    client.mint(&nft_receiver, &40);
}

#[test]
#[should_panic(expected = "INSUFFICIENT_BALANCE")]
fn test_mint_nft_insufficient_balance() {
    let env = Env::default();
    let owner = Address::generate(&env);
    let stablecoin_address = deploy_stablecoin_contract(&env, &owner, 1000000);
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

    let nft_receiver = Address::generate(&env);

    // Create An investor before minting
    client.create_investor(&nft_receiver);

    // CHECK: Is the investor created successfully?
    let is_investor = client.is_investor(&nft_receiver);
    assert!(is_investor);

    client.mint(&nft_receiver, &40);
}

#[test]
#[should_panic(expected = "INSUFFICIENT_ALLOWANCE")]
fn test_mint_nft_insufficient_allowance() {
    let env = Env::default();

    let premint_amount: i128 = 100000000;
    let scaled_premint_amount = premint_amount * 10i128.pow(6);

    let owner = Address::generate(&env);
    let stablecoin_address = deploy_stablecoin_contract(&env, &owner, scaled_premint_amount);
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

    let nft_receiver = Address::generate(&env);

    let nft_amount: u32 = 40;

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

    client.mint(&nft_receiver, &nft_amount);
}

#[test]
fn test_mint_nft() {
    let env = Env::default();

    let premint_amount: i128 = 100000000;
    let scaled_premint_amount = premint_amount * 10i128.pow(6);

    let owner = Address::generate(&env);
    let stablecoin_address = deploy_stablecoin_contract(&env, &owner, scaled_premint_amount);
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

    let nft_receiver = Address::generate(&env);

    let nft_amount: u32 = 40;

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

#[test]
fn test_start_chronometer() {
    let env = Env::default();

    let premint_amount: i128 = 100000000;
    let scaled_premint_amount = premint_amount * 10i128.pow(6);

    let owner = Address::generate(&env);
    let stablecoin_address = deploy_stablecoin_contract(&env, &owner, scaled_premint_amount);
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

    let nft_receiver = Address::generate(&env);

    let nft_amount: u32 = 150;

    // Mint NFTs to set up the chronometer test
    mint_nft(
        &env,
        &client,
        &nft_receiver,
        nft_amount,
        &owner,
        &stablecoin_address,
        &contract_id,
    );

    // Initially, the chronometer should not be started
    let is_started = client.is_chronometer_started();
    assert!(!is_started);

    // Start the chronometer
    client.start_chronometer();

    // Verify that the chronometer has been started
    let is_started = client.is_chronometer_started();
    assert!(is_started);

    // Verify that the start time is set to the current ledger timestamp
    let start_time = client.get_begin_date();
    let current_time = env.ledger().timestamp();
    assert_eq!(start_time, current_time);
}

#[test]
#[should_panic(expected = "MAXIMUM_NFTS_PER_INVESTOR_EXCEEDED")]
fn test_exceed_max_nfts_per_investor() {
    let env = Env::default();
    let owner = Address::generate(&env);
    let stablecoin_address =
        deploy_stablecoin_contract(&env, &owner, 100_000_000 * 10i128.pow(STABLECOIN_DECIMALS));
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

    let nft_amount = MAX_NFTS_PER_INVESTOR + 1;

    // First mint exactly the maximum allowed
    mint_nft(
        &env,
        &client,
        &investor,
        nft_amount,
        &owner,
        &stablecoin_address,
        &contract_id,
    );
}

#[test]
#[should_panic(expected = "MINIMUM_INVESTMENT_NOT_MET")]
fn test_minimum_investment_not_met() {
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

    let investor = Address::generate(&env);
    client.create_investor(&investor);

    // Try to mint less than minimum required
    let below_min = MIN_NFTS_TO_MINT - 1;
    client.mint(&investor, &below_min);
}

#[test]
#[should_panic(expected = "MAXIMUM_SUPPLY_EXCEEDED")]
fn test_exceed_total_supply() {
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

    let investor_len = TOTAL_SUPPLY / MAX_NFTS_PER_INVESTOR;

    // Mint All the Total supply
    for _ in 0..investor_len {
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

    // Now try to mint one more NFT which should exceed total supply
    let extra_investor = Address::generate(&env);
    mint_nft(
        &env,
        &client,
        &extra_investor,
        MIN_NFTS_TO_MINT,
        &owner,
        &stablecoin_address,
        &contract_id,
    );
}

#[test]
fn test_exact_total_supply_boundary() {
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

    let investor_len = TOTAL_SUPPLY / MAX_NFTS_PER_INVESTOR;

    // Mint All the Total supply
    for _ in 0..investor_len {
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

    // Verify total supply is exactly reached
    let current_supply = client.get_current_supply();
    assert_eq!(current_supply, TOTAL_SUPPLY);
}

#[test]
fn test_exact_min_investment_boundary() {
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

    let investor = Address::generate(&env);

    // Should be able to mint exactly the minimum
    mint_nft(
        &env,
        &client,
        &investor,
        MIN_NFTS_TO_MINT,
        &owner,
        &stablecoin_address,
        &contract_id,
    );

    let balance = client.balance(&investor);
    assert_eq!(balance, MIN_NFTS_TO_MINT);
}

#[test]
fn test_exact_max_nfts_per_investor_boundary() {
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

    let investor = Address::generate(&env);

    // Should be able to mint exactly the maximum per investor
    mint_nft(
        &env,
        &client,
        &investor,
        MAX_NFTS_PER_INVESTOR,
        &owner,
        &stablecoin_address,
        &contract_id,
    );

    let balance = client.balance(&investor);
    assert_eq!(balance, MAX_NFTS_PER_INVESTOR);
}

#[test]
#[should_panic(expected = "INVESTMENT_NOT_IN_BUYING_PHASE")]
fn test_mint_in_wrong_state() {
    let env = Env::default();
    let owner = Address::generate(&env);
    let stablecoin_address = deploy_stablecoin_contract(&env, &owner, 100_000_000 * 10i128.pow(7));
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

    // First mint some NFTs to have something to work with
    mint_nft(
        &env,
        &client,
        &investor,
        50,
        &owner,
        &stablecoin_address,
        &contract_id,
    );

    // Start chronometer to change state
    client.start_chronometer();

    // Verify state has changed
    let state = client.get_current_state();
    assert_eq!(state, InvestmentStatus::BeforeFirstRelease);

    // Now try to mint - should panic
    let new_investor = Address::generate(&env);
    mint_nft(
        &env,
        &client,
        &new_investor,
        50,
        &owner,
        &stablecoin_address,
        &contract_id,
    );
}

#[test]
fn test_start_chronometer_mints_remaining_to_owner() {
    let env = Env::default();
    let owner = Address::generate(&env);
    let stablecoin_address = deploy_stablecoin_contract(&env, &owner, 100_000_000 * 10i128.pow(7));
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
    let minted_amount = 100u32;

    // Mint some NFTs to investor
    mint_nft(
        &env,
        &client,
        &investor,
        minted_amount,
        &owner,
        &stablecoin_address,
        &contract_id,
    );

    // Check current supply
    assert_eq!(client.get_current_supply(), minted_amount);

    // Owner should have 0 NFTs initially
    let owner_balance_before = client.balance(&owner);
    assert_eq!(owner_balance_before, 0);

    // Start chronometer
    client.start_chronometer();

    // Check that total supply is now at maximum
    assert_eq!(client.get_current_supply(), TOTAL_SUPPLY);

    // Owner should have received the remaining NFTs
    let owner_balance_after = client.balance(&owner);
    let expected_owner_balance = TOTAL_SUPPLY - minted_amount;
    assert_eq!(owner_balance_after, expected_owner_balance);
}

#[test]
#[should_panic(expected = "CHRONOMETER_ALREADY_STARTED")]
fn test_double_chronometer_start() {
    let env = Env::default();
    let owner = Address::generate(&env);
    let stablecoin_address = deploy_stablecoin_contract(&env, &owner, 100_000_000 * 10i128.pow(7));
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

    // Mint some NFTs first
    mint_nft(
        &env,
        &client,
        &investor,
        50,
        &owner,
        &stablecoin_address,
        &contract_id,
    );

    // Start chronometer
    client.start_chronometer();

    // Try to start again - should panic
    client.start_chronometer();
}
