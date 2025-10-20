use soroban_sdk::{log, testutils::Address as _, Address, Env};

use crate::{
    tests::utils::{deploy_stablecoin_contract, mint_nft},
    Minah, MinahClient,
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

    let amount_for_8_percent = client.calculate_amount_to_release(&percent_8);

    assert_eq!(amount_for_8_percent, expected_amount_to_release_8);

    // --- Test 2: 108% ROI distribution (the final stage) ---
    let percent_108: i128 = 108;
    let expected_release_108 = (total_nfts_value * percent_108) / 100;

    log!(&env, "Expected release for 108%: {}", expected_release_108);
    let expected_amount_to_release_108: i128 = expected_release_108 * 10i128.pow(6); // considering 6 decimals of stablecoin

    let amount_for_108_percent = client.calculate_amount_to_release(&percent_108);

    assert_eq!(amount_for_108_percent, expected_amount_to_release_108);
}
