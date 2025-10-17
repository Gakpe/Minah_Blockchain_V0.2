use soroban_sdk::{testutils::Address as _, Address, Env};
use stablecoin::utils::deploy_stablecoin_contract;

use crate::{tests::utils::create_client, Minah, MinahClient};

#[test]
#[should_panic(expected = "USER_NOT_AN_INVESTOR")]
fn test_mint_nft_to_non_investor() {
    let env = Env::default();
    let owner = Address::generate(&env);
    let stablecoin_address = deploy_stablecoin_contract(&env, &owner, 1000000);
    let receiver = Address::generate(&env);
    let payer = Address::generate(&env);
    let client = create_client(&env, &owner, &stablecoin_address, &receiver, &payer);

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
    let client = create_client(&env, &owner, &stablecoin_address, &receiver, &payer);

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
    let client = create_client(&env, &owner, &stablecoin_address, &receiver, &payer);

    let nft_receiver = Address::generate(&env);

    let nft_amount: u32 = 40;

    // Create An investor before minting
    client.create_investor(&nft_receiver);

    // CHECK: Is the investor created successfully?
    let is_investor = client.is_investor(&nft_receiver);
    assert!(is_investor);

    // Transfer The Required Stablecoin Amount to the nft receiver so that the minting can proceed
    let nft_price = client.get_nft_price();

    let total_amount = nft_price * (nft_amount as i128) * 10i128.pow(6);

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

    env.mock_all_auths();

    let contract_id = env.register(Minah, (&owner, &stablecoin_address, &receiver, &payer));

    let client = MinahClient::new(&env, &contract_id);

    let nft_receiver = Address::generate(&env);

    let nft_amount: u32 = 40;

    // Create An investor before minting
    client.create_investor(&nft_receiver);

    // CHECK: Is the investor created successfully?
    let is_investor = client.is_investor(&nft_receiver);
    assert!(is_investor);

    // Transfer The Required Stablecoin Amount to the nft receiver so that the minting can proceed
    let nft_price = client.get_nft_price();

    let total_amount = nft_price * (nft_amount as i128) * 10i128.pow(6);

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

    client.mint(&nft_receiver, &nft_amount);
}
