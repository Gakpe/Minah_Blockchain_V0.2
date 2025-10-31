use soroban_sdk::{testutils::Address as _, Address, Env, Vec};

use crate::tests::utils::{
    create_client, deploy_stablecoin_contract, distribution_intervals_vec, mint_nft,
    roi_percentages_vec, MAX_NFTS_PER_INVESTOR, MIN_NFTS_TO_MINT, PRICE, TOTAL_SUPPLY,
    USDC_DECIMALS,
};

#[test]
#[should_panic(expected = "TRANSFERS_DISABLED_FOR_MINAH_NFTS")]
fn test_transfer_nft() {
    let env = Env::default();

    let owner = Address::generate(&env);
    let stablecoin_address = deploy_stablecoin_contract(&env, &owner, 100_000_000 * 10i128.pow(6)); // Ensure huge supply
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
    let stablecoin_address =
        deploy_stablecoin_contract(&env, &owner, 100_000_000 * 10i128.pow(USDC_DECIMALS)); // Ensure huge supply
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
    let total_price_in_stablecoin: i128 = 50 * PRICE * 10i128.pow(USDC_DECIMALS); // 50 NFTs

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

#[test]
fn test_sell_tokens() {
    let env = Env::default();
    let owner = Address::generate(&env);
    let stablecoin_address =
        deploy_stablecoin_contract(&env, &owner, 100_000_000 * 10i128.pow(USDC_DECIMALS)); // Ensure huge supply
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

    // Sell NFTs from investor1 to investor2
    let mut tokens_to_sell_from_investor1: Vec<u32> = Vec::new(&env);
    for i in 0..50 {
        tokens_to_sell_from_investor1.push_back(i);
    }

    // Investor 2 approves the contract to spend stablecoins on his behalf
    let total_price_in_stablecoin: i128 = 50 * PRICE * 10i128.pow(USDC_DECIMALS); // 50 NFTs

    stablecoin_client.approve(&investor2, &contract_id, &total_price_in_stablecoin, &100);

    stablecoin_client.transfer(&owner, &investor2, &total_price_in_stablecoin);

    // Investor 1 approves the contract to transfer his all NFTs
    client.approve_for_all(&investor1, &contract_id, &100);

    // Investor1 sells 50 NFTs to investor2
    client.sell_tokens(&investor1, &investor2, &tokens_to_sell_from_investor1);

    // CHECK: Investor 2 should own 100 NFTs now
    let investor2_nft_balance = client.balance(&investor2);
    assert_eq!(investor2_nft_balance, 100);

    // CHECK: Investor 1 should own 50 NFTs now
    let investor1_nft_balance = client.balance(&investor1);
    assert_eq!(investor1_nft_balance, 50);

    // CHECK: Total supply should remain the same
    assert_eq!(client.get_current_supply(), TOTAL_SUPPLY);
}

#[test]
#[should_panic(expected = "NFT_TRANSFERS_NOT_ALLOWED_DURING_BUYING_PHASE")]
fn test_buy_tokens_in_buying_phase_should_panic() {
    let env = Env::default();
    let owner = Address::generate(&env);
    let stablecoin_address =
        deploy_stablecoin_contract(&env, &owner, 100_000_000 * 10i128.pow(USDC_DECIMALS)); // Ensure huge supply
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

    // --- Setup Investors ---
    let investor1 = Address::generate(&env);
    let investor2 = Address::generate(&env);

    // Mint NFTs to investor1 and investor2
    mint_nft(
        &env,
        &client,
        &investor1,
        100,
        &owner,
        &stablecoin_address,
        &contract_id,
    );

    mint_nft(
        &env,
        &client,
        &investor2,
        50,
        &owner,
        &stablecoin_address,
        &contract_id,
    );

    // Do NOT start chronometer -> still in BuyingPhase
    // Attempt to buy tokens while in buying phase should panic
    let mut tokens_to_buy_from_investor1: Vec<u32> = Vec::new(&env);
    for i in 0..10 {
        tokens_to_buy_from_investor1.push_back(i);
    }

    // Provide stablecoin balance and allowance to buyer so checks advance to the transfer assertion
    let total_price_in_stablecoin: i128 = 10 * PRICE * 10i128.pow(USDC_DECIMALS);
    stablecoin_client.transfer(&owner, &investor2, &total_price_in_stablecoin);
    stablecoin_client.approve(&investor2, &contract_id, &total_price_in_stablecoin, &100);

    // Attempt the buy - should panic early with NFT_TRANSFERS_NOT_ALLOWED_DURING_BUYING_PHASE
    client.buy_tokens(&investor1, &investor2, &tokens_to_buy_from_investor1);
}

#[test]
#[should_panic(expected = "SPENDER_NOT_APPROVED_FOR_ALL")]
fn test_buy_tokens_without_from_approval_should_panic() {
    let env = Env::default();
    let owner = Address::generate(&env);
    let stablecoin_address =
        deploy_stablecoin_contract(&env, &owner, 100_000_000 * 10i128.pow(USDC_DECIMALS)); // Ensure huge supply
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

    // --- Setup Investors ---
    let investor1 = Address::generate(&env);
    let investor2 = Address::generate(&env);

    // Mint NFTs to investor1 and investor2
    mint_nft(
        &env,
        &client,
        &investor1,
        100,
        &owner,
        &stablecoin_address,
        &contract_id,
    );

    mint_nft(
        &env,
        &client,
        &investor2,
        50,
        &owner,
        &stablecoin_address,
        &contract_id,
    );

    // Start chronometer so transfers are allowed
    client.start_chronometer();

    // Prepare buyer stablecoin balance and approve
    let mut tokens_to_buy_from_investor1: Vec<u32> = Vec::new(&env);
    for i in 0..50 {
        tokens_to_buy_from_investor1.push_back(i);
    }

    let total_price_in_stablecoin: i128 = 50 * PRICE * 10i128.pow(USDC_DECIMALS);
    stablecoin_client.transfer(&owner, &investor2, &total_price_in_stablecoin);
    stablecoin_client.approve(&investor2, &contract_id, &total_price_in_stablecoin, &100);

    // NOTE: Do NOT call approve_for_all on investor1 - this should trigger SPENDER_NOT_APPROVED_FOR_ALL

    // Attempt buy should panic when batch transfer checks for approval for all
    client.buy_tokens(&investor1, &investor2, &tokens_to_buy_from_investor1);
}

#[test]
#[should_panic(expected = "FROM_ADDRESS_NOT_INVESTOR_OR_OWNER")]
fn test_buy_tokens_from_not_investor_nor_owner() {
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

    // Setup one investor who owns NFTs
    let investor = Address::generate(&env);
    mint_nft(
        &env,
        &client,
        &investor,
        20,
        &owner,
        &stablecoin_address,
        &contract_id,
    );

    // Start chronometer to enable marketplace
    client.start_chronometer();

    // Normal (non investor) user tries to sell their non-existing NFTs to investor -> should fail on FROM validation
    let normal_user = Address::generate(&env);

    let mut token_ids: Vec<u32> = Vec::new(&env);
    for i in 0..5 {
        token_ids.push_back(i);
    }

    client.buy_tokens(&normal_user, &investor, &token_ids);
}

#[test]
#[should_panic(expected = "TO_ADDRESS_NOT_INVESTOR_OR_OWNER")]
fn test_buy_tokens_to_not_investor_nor_owner() {
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

    // Setup investor who owns NFTs
    let seller = Address::generate(&env);
    mint_nft(
        &env,
        &client,
        &seller,
        20,
        &owner,
        &stablecoin_address,
        &contract_id,
    );

    client.start_chronometer();

    // Buyer is not investor nor owner
    let non_investor_buyer = Address::generate(&env);

    let mut token_ids: Vec<u32> = Vec::new(&env);
    for i in 0..5 {
        token_ids.push_back(i);
    }

    // Attempt to buy should panic with TO_ADDRESS_NOT_INVESTOR_OR_OWNER
    client.buy_tokens(&seller, &non_investor_buyer, &token_ids);
}

#[test]
#[should_panic(expected = "INSUFFICIENT_BALANCE_TO_BUY_NFTS")]
fn test_buy_tokens_insufficient_balance() {
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

    let seller = Address::generate(&env);
    let buyer = Address::generate(&env);

    // Create buyer as investor
    client.create_investor(&buyer);

    // Mint to seller and start chronometer
    mint_nft(
        &env,
        &client,
        &seller,
        10,
        &owner,
        &stablecoin_address,
        &contract_id,
    );
    client.start_chronometer();

    // Prepare token ids to buy; do NOT fund buyer with stablecoin
    let mut token_ids: Vec<u32> = Vec::new(&env);
    for i in 0..5 {
        token_ids.push_back(i);
    }

    // Approve for all for seller so we reach the balance check for buyer
    client.approve_for_all(&seller, &contract_id, &100);

    // Attempt to buy should panic due to insufficient stablecoin balance
    client.buy_tokens(&seller, &buyer, &token_ids);
}

#[test]
#[should_panic(expected = "INSUFFICIENT_ALLOWANCE_TO_BUY_NFTS")]
fn test_buy_tokens_insufficient_allowance() {
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

    let seller = Address::generate(&env);
    let buyer = Address::generate(&env);

    // Create buyer as investor
    client.create_investor(&buyer);

    // Mint to seller and start chronometer
    mint_nft(
        &env,
        &client,
        &seller,
        10,
        &owner,
        &stablecoin_address,
        &contract_id,
    );
    client.start_chronometer();

    // Fund buyer with just enough but set insufficient allowance
    let mut token_ids: Vec<u32> = Vec::new(&env);
    for i in 0..5 {
        token_ids.push_back(i);
    }
    let total_price_in_stablecoin: i128 = 5 * PRICE * 10i128.pow(USDC_DECIMALS);
    stablecoin_client.transfer(&owner, &buyer, &total_price_in_stablecoin);

    // Approve less than required
    let insufficient_allowance = total_price_in_stablecoin - 1;
    stablecoin_client.approve(&buyer, &contract_id, &insufficient_allowance, &100);

    // Seller approves NFTs for transfer
    client.approve_for_all(&seller, &contract_id, &100);

    // Attempt to buy should panic due to insufficient allowance
    client.buy_tokens(&seller, &buyer, &token_ids);
}

#[test]
#[should_panic(expected = "TO_ADDRESS_NOT_INVESTOR_OR_OWNER")]
fn test_sell_tokens_to_not_investor_nor_owner() {
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

    let seller = Address::generate(&env);
    let buyer = Address::generate(&env); // Will be non-investor

    // Mint to seller and start chronometer
    mint_nft(
        &env,
        &client,
        &seller,
        10,
        &owner,
        &stablecoin_address,
        &contract_id,
    );
    client.start_chronometer();

    // Fund buyer and approve so checks go through to TO validation
    let mut token_ids: Vec<u32> = Vec::new(&env);
    for i in 0..5 {
        token_ids.push_back(i);
    }
    let total_price_in_stablecoin: i128 = 5 * PRICE * 10i128.pow(USDC_DECIMALS);
    stablecoin_client.transfer(&owner, &buyer, &total_price_in_stablecoin);
    stablecoin_client.approve(&buyer, &contract_id, &total_price_in_stablecoin, &100);

    // NOTE: Do not create buyer as investor

    // Seller approves NFTs for transfer
    client.approve_for_all(&seller, &contract_id, &100);

    // Attempt to sell should panic due to TO not investor nor owner
    client.sell_tokens(&seller, &buyer, &token_ids);
}

#[test]
#[should_panic(expected = "INSUFFICIENT_BALANCE_TO_SELL_NFTS")]
fn test_sell_tokens_insufficient_balance() {
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

    let seller = Address::generate(&env);
    let buyer = Address::generate(&env);

    // Create buyer as investor
    client.create_investor(&buyer);

    // Mint to seller and start chronometer
    mint_nft(
        &env,
        &client,
        &seller,
        10,
        &owner,
        &stablecoin_address,
        &contract_id,
    );
    client.start_chronometer();

    // Not funding buyer with stablecoin should trigger balance panic
    let mut token_ids: Vec<u32> = Vec::new(&env);
    for i in 0..5 {
        token_ids.push_back(i);
    }

    // Seller approves NFTs for transfer
    client.approve_for_all(&seller, &contract_id, &100);

    client.sell_tokens(&seller, &buyer, &token_ids);
}

#[test]
#[should_panic(expected = "INSUFFICIENT_ALLOWANCE_TO_SELL_NFTS")]
fn test_sell_tokens_insufficient_allowance() {
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

    let seller = Address::generate(&env);
    let buyer = Address::generate(&env);

    // Create buyer as investor
    client.create_investor(&buyer);

    // Mint to seller and start chronometer
    mint_nft(
        &env,
        &client,
        &seller,
        10,
        &owner,
        &stablecoin_address,
        &contract_id,
    );
    client.start_chronometer();

    let mut token_ids: Vec<u32> = Vec::new(&env);
    for i in 0..5 {
        token_ids.push_back(i);
    }
    let total_price_in_stablecoin: i128 = 5 * PRICE * 10i128.pow(USDC_DECIMALS);
    stablecoin_client.transfer(&owner, &buyer, &total_price_in_stablecoin);

    // Approve less than required for buyer
    let insufficient_allowance = total_price_in_stablecoin - 1;
    stablecoin_client.approve(&buyer, &contract_id, &insufficient_allowance, &100);

    // Seller approves NFTs for transfer
    client.approve_for_all(&seller, &contract_id, &100);

    // Attempt to sell should panic due to insufficient allowance
    client.sell_tokens(&seller, &buyer, &token_ids);
}

#[test]
#[should_panic(expected = "NFT_TRANSFERS_NOT_ALLOWED_DURING_BUYING_PHASE")]
fn test_buy_tokens_during_buying_phase() {
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

    let seller = Address::generate(&env);
    let buyer = Address::generate(&env);

    // Mint to seller but DON'T start chronometer
    mint_nft(
        &env,
        &client,
        &seller,
        10,
        &owner,
        &stablecoin_address,
        &contract_id,
    );

    // Create buyer as investor
    client.create_investor(&buyer);

    let mut token_ids: Vec<u32> = Vec::new(&env);
    token_ids.push_back(0);

    // Attempt to buy during buying phase - should panic
    client.buy_tokens(&seller, &buyer, &token_ids);
}

#[test]
#[should_panic(expected = "NFT_TRANSFERS_NOT_ALLOWED_DURING_BUYING_PHASE")]
fn test_sell_tokens_during_buying_phase() {
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

    let seller = Address::generate(&env);
    let buyer = Address::generate(&env);

    // Mint to seller but DON'T start chronometer
    mint_nft(
        &env,
        &client,
        &seller,
        10,
        &owner,
        &stablecoin_address,
        &contract_id,
    );

    // Create buyer as investor
    client.create_investor(&buyer);

    let mut token_ids: Vec<u32> = Vec::new(&env);
    token_ids.push_back(0);

    // Attempt to sell during buying phase - should panic
    client.sell_tokens(&seller, &buyer, &token_ids);
}

#[test]
#[should_panic(expected = "FROM_ADDRESS_NOT_INVESTOR_OR_OWNER")]
fn test_buy_tokens_from_non_investor() {
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

    let seller = Address::generate(&env);
    let buyer = Address::generate(&env);

    // Mint to seller
    mint_nft(
        &env,
        &client,
        &seller,
        10,
        &owner,
        &stablecoin_address,
        &contract_id,
    );
    client.start_chronometer();

    // Create a non-investor address
    let non_investor = Address::generate(&env);

    let mut token_ids: Vec<u32> = Vec::new(&env);
    token_ids.push_back(0);

    // Create buyer as investor
    client.create_investor(&buyer);

    // Fund buyer
    let total_price = PRICE * 10i128.pow(USDC_DECIMALS);
    stablecoin_client.transfer(&owner, &buyer, &total_price);
    stablecoin_client.approve(&buyer, &contract_id, &total_price, &100);

    // Approve NFTs for transfer
    client.approve_for_all(&non_investor, &contract_id, &100);

    // Attempt to buy from non-investor - should panic
    client.buy_tokens(&non_investor, &buyer, &token_ids);
}

#[test]
#[should_panic(expected = "TO_ADDRESS_NOT_INVESTOR_OR_OWNER")]
fn test_buy_tokens_to_non_investor() {
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

    let seller = Address::generate(&env);

    // Mint to seller
    mint_nft(
        &env,
        &client,
        &seller,
        10,
        &owner,
        &stablecoin_address,
        &contract_id,
    );
    client.start_chronometer();

    // Create a non-investor address
    let non_investor = Address::generate(&env);

    let mut token_ids: Vec<u32> = Vec::new(&env);
    token_ids.push_back(0);

    // Fund non-investor
    let total_price = PRICE * 10i128.pow(USDC_DECIMALS);
    stablecoin_client.transfer(&owner, &non_investor, &total_price);
    stablecoin_client.approve(&non_investor, &contract_id, &total_price, &100);

    // Approve NFTs for transfer
    client.approve_for_all(&seller, &contract_id, &100);

    // Attempt to buy to non-investor - should panic
    client.buy_tokens(&seller, &non_investor, &token_ids);
}

#[test]
fn test_owner_can_buy_tokens_from_investor() {
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

    let seller = Address::generate(&env);

    // Mint to seller
    mint_nft(
        &env,
        &client,
        &seller,
        10,
        &owner,
        &stablecoin_address,
        &contract_id,
    );
    client.start_chronometer();

    let mut token_ids: Vec<u32> = Vec::new(&env);
    for i in 0..5 {
        token_ids.push_back(i);
    }

    let total_price = 5 * PRICE * 10i128.pow(USDC_DECIMALS);

    // Owner already has stablecoin balance, approve it
    stablecoin_client.approve(&owner, &contract_id, &total_price, &100);

    // Seller approves NFTs for transfer
    client.approve_for_all(&seller, &contract_id, &100);

    let seller_balance_before = client.balance(&seller);
    let owner_balance_before = client.balance(&owner);

    // Owner buys from investor
    client.buy_tokens(&seller, &owner, &token_ids);

    let seller_balance_after = client.balance(&seller);
    let owner_balance_after = client.balance(&owner);

    // Verify balances changed correctly
    assert_eq!(seller_balance_after, seller_balance_before - 5);
    assert_eq!(owner_balance_after, owner_balance_before + 5);
}
