use soroban_sdk::{
    log,
    testutils::{Address as _, Ledger},
    Address, Env,
};

use crate::{
    tests::utils::{deploy_stablecoin_contract, mint_nft, USDC_DECIMALS},
    InvestmentStatus, Minah, MinahClient, DISTRIBUTION_INTERVALS, ROI_PERCENTAGES,
};

#[test]
fn test_calculate_amount_to_release() {
    let env = Env::default();
    let owner = Address::generate(&env);
    let stablecoin_address = deploy_stablecoin_contract(&env, &owner, 100_000_000 * 10i128.pow(6)); // Ensure huge supply
    let receiver = Address::generate(&env);
    let payer = Address::generate(&env);

    env.mock_all_auths();
    let contract_id = env.register(Minah, (&owner, &stablecoin_address, &receiver, &payer));
    let client = MinahClient::new(&env, &contract_id);

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

    let total_nfts_value: i128 = (expected_current_supply as i128) * client.get_nft_price();

    // --- Test 1: 8% ROI distribution ---
    let percent_8: i128 = 8;
    let expected_release_8 = (total_nfts_value * percent_8) / 100;

    log!(&env, "Expected release for 8%: {}", expected_release_8);

    // Total NFT value: 150 NFTs * PRICE 1 USDC = 150 USDC base value
    // Expected release in USDC (unscaled): 150 * 8% = 12 USDC
    // Expected release (scaled): 12 * 10^6 (for 6 decimals)
    let expected_amount_to_release_8: i128 = expected_release_8 * 10i128.pow(6); // considering 6 decimals of stablecoin

    let scaled_percent_8 = percent_8 * 10i128.pow(6);

    let amount_for_8_percent = client.calculate_amount_to_release(&scaled_percent_8);

    assert_eq!(amount_for_8_percent, expected_amount_to_release_8);

    // --- Test 2: 108% ROI distribution (the final stage) ---
    let percent_108: i128 = 108;
    let expected_release_108 = (total_nfts_value * percent_108) / 100;

    log!(&env, "Expected release for 108%: {}", expected_release_108);
    let expected_amount_to_release_108: i128 = expected_release_108 * 10i128.pow(6); // considering 6 decimals of stablecoin

    let scaled_percent_108 = percent_108 * 10i128.pow(6);

    let amount_for_108_percent = client.calculate_amount_to_release(&scaled_percent_108);

    assert_eq!(amount_for_108_percent, expected_amount_to_release_108);
}

#[test]
#[should_panic(expected = "DISTRIBUTION_NOT_READY_YET")]
fn test_release_distribution_before_time_pass() {
    let env = Env::default();
    let owner = Address::generate(&env);
    let stablecoin_address = deploy_stablecoin_contract(&env, &owner, 100_000_000 * 10i128.pow(6)); // Ensure huge supply
    let receiver = Address::generate(&env);
    let payer = Address::generate(&env);

    env.mock_all_auths();
    let contract_id = env.register(Minah, (&owner, &stablecoin_address, &receiver, &payer));
    let client = MinahClient::new(&env, &contract_id);

    // --- Setup Multiple Investors ---
    let investor1 = Address::generate(&env); // Will hold 100 NFTs

    let nft_amount_1: u32 = 100;

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

    let expected_current_supply = nft_amount_1;

    // CHECK: Total supply should be nft_amount_1
    assert_eq!(client.get_current_supply(), expected_current_supply);

    // Start the chronometer
    client.start_chronometer();

    // CHECK: Chronometer should be started
    let is_started = client.is_chronometer_started();
    assert!(is_started);

    // CHECK: Verify that the start time is set to the current ledger timestamp
    let start_time = client.get_begin_date();
    let current_time = env.ledger().timestamp();
    assert_eq!(start_time, current_time);

    // --- Attempt to release distribution immediately (should panic) ---
    client.release_distribution();
}

#[test]
fn test_release_distribution() {
    let env = Env::default();
    let owner = Address::generate(&env);
    let stablecoin_address = deploy_stablecoin_contract(&env, &owner, 100_000_000 * 10i128.pow(6)); // Ensure huge supply
    let receiver = Address::generate(&env);
    let payer = Address::generate(&env);

    env.mock_all_auths();
    let contract_id = env.register(Minah, (&owner, &stablecoin_address, &receiver, &payer));
    let client = MinahClient::new(&env, &contract_id);

    // --- Setup Multiple Investors ---
    let investor1 = Address::generate(&env); // Will hold 100 NFTs

    let nft_amount_1: u32 = 100;

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

    let expected_current_supply = nft_amount_1;

    // CHECK: Total supply should be nft_amount_1
    assert_eq!(client.get_current_supply(), expected_current_supply);

    // Start the chronometer
    client.start_chronometer();

    // CHECK: Chronometer should be started
    let is_started = client.is_chronometer_started();
    assert!(is_started);

    // CHECK: Verify that the start time is set to the current ledger timestamp
    let start_time = client.get_begin_date();
    let current_time = env.ledger().timestamp();
    assert_eq!(start_time, current_time);

    // --- Prepare Payer (must approve the contract to spend the ROI stablecoin) ---
    // The total possible ROI is for 10 distribution stages: 2.67*9 + 4 = 24.03 +  4 = 28.03%
    // Total ROI amount to be transferred over time for 100 NFTs:
    // (100 NFTs * PRICE * 28.03% of investment) = 100 * 1 * 28.03 / 100 = 28.03 stablecoins worth of value.
    // Scaled: 28.03 * stablecoin_scale
    let stablecoin_scale: i128 = 10i128.pow(USDC_DECIMALS); // 7 decimals
    let max_roi_amount_f64 = 28.03 * stablecoin_scale as f64;
    let max_roi_amount = max_roi_amount_f64 as i128;

    log!(
        &env,
        "Max ROI amount to be transferred to payer: {}",
        max_roi_amount
    );

    // Transfer stablecoins to payer
    let stablecoin_client = stablecoin::StablecoinClient::new(&env, &stablecoin_address);

    stablecoin_client.transfer(&owner, &payer, &max_roi_amount);

    // Initial check on claimed amount
    let initial_claimed = client.see_claimed_amount(&investor1);
    assert_eq!(initial_claimed, 0);

    // --- Simulate Time Passage and Distribution ---
    let timestamp = env.ledger().timestamp();

    log!(
        &env,
        "Initial ledger timestamp: {}",
        env.ledger().timestamp()
    );

    // Advance timestamp for the first distribution interval (6 months) and perform distributions
    let new_timestamp = timestamp + DISTRIBUTION_INTERVALS[0]; // 6 months in seconds

    env.ledger().set_timestamp(new_timestamp);

    log!(
        &env,
        "New ledger timestamp after 6 months: {}",
        env.ledger().timestamp()
    );

    // Calculate amount to be released for that first interval
    let perceent_0 = ROI_PERCENTAGES[0];
    let amount_to_release_0 = client.calculate_amount_to_release(&perceent_0);
    let expected_amount_to_release_0: i128 =
        nft_amount_1 as i128 * client.get_nft_price() * perceent_0 / 100;

    assert_eq!(amount_to_release_0, expected_amount_to_release_0);

    log!(
        &env,
        "Amount to release for first interval: {}",
        amount_to_release_0
    );

    // Approve the contract to spend from payer
    stablecoin_client.approve(&payer, &contract_id, &amount_to_release_0, &100);

    // Release distribution for the first interval
    client.release_distribution();

    // CHECK: claimed amount should be updated correctly
    let claimed_after_first = client.see_claimed_amount(&investor1);
    assert_eq!(claimed_after_first, amount_to_release_0);

    // CHECK: state should be updated correctly
    let state_after_first = client.get_current_state();
    assert_eq!(state_after_first, InvestmentStatus::SixMonthsDone);

    // Pass to the next intervals similarly...
    let new_timestamp = timestamp + DISTRIBUTION_INTERVALS[1]; // Ten months in seconds
    env.ledger().set_timestamp(new_timestamp);

    let perceent_1 = ROI_PERCENTAGES[1];
    let amount_to_release_1 = client.calculate_amount_to_release(&perceent_1);
    let expected_amount_to_release_1: i128 =
        nft_amount_1 as i128 * client.get_nft_price() * perceent_1 / 100;

    assert_eq!(amount_to_release_1, expected_amount_to_release_1);

    log!(
        &env,
        "Amount to release for second interval: {}",
        amount_to_release_1
    );

    // Approve the contract to spend from payer
    stablecoin_client.approve(&payer, &contract_id, &amount_to_release_1, &100);

    // Release distribution for the second interval
    client.release_distribution();

    // CHECK: claimed amount should be updated correctly
    let claimed_after_second = client.see_claimed_amount(&investor1);
    assert_eq!(
        claimed_after_second,
        amount_to_release_0 + amount_to_release_1
    );

    // CHECK: state should be updated correctly
    let state_after_second = client.get_current_state();
    assert_eq!(state_after_second, InvestmentStatus::TenMonthsDone);

    // PASS the rest of the intervals by passing the timestamp to the end directly
    let final_timestamp = timestamp + DISTRIBUTION_INTERVALS.last().unwrap();
    env.ledger().set_timestamp(final_timestamp);

    let approve_amount: i128 = max_roi_amount - (claimed_after_second); // Approve the remaining amount

    stablecoin_client.approve(&payer, &contract_id, &approve_amount, &100);

    // Release distribution for the final interval
    client.release_distribution();

    // CHECK: claimed amount should be updated correctly
    let claimed_after_final = client.see_claimed_amount(&investor1);
    assert_eq!(claimed_after_final, max_roi_amount);

    // CHECK: state should be updated correctly
    let state_after_final = client.get_current_state();
    assert_eq!(state_after_final, InvestmentStatus::Ended);
}
