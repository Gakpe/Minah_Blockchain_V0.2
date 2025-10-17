use crate::tests::utils::create_client;
use soroban_sdk::{testutils::Address as _, vec, Address, Env, String};
use stablecoin::{utils::deploy_stablecoin_contract, StablecoinClient};

#[test]
fn test_hello() {
    let env = Env::default();
    let receiver = Address::generate(&env);
    let payer = Address::generate(&env);
    let owner = Address::generate(&env);
    let stablecoin_address = deploy_stablecoin_contract(&env, &owner, 1000000);
    let client = create_client(&env, &owner, &stablecoin_address, &receiver, &payer);

    let words = client.hello(&String::from_str(&env, "Dev"));
    assert_eq!(
        words,
        vec![
            &env,
            String::from_str(&env, "Hello"),
            String::from_str(&env, "Dev"),
        ]
    );
}

#[test]
fn test_stablecoin_setter_getter() {
    let env = Env::default();

    let receiver = Address::generate(&env);
    let payer = Address::generate(&env);
    let owner = Address::generate(&env);
    let stablecoin_address = deploy_stablecoin_contract(&env, &owner, 1000000);
    let client = create_client(&env, &owner, &stablecoin_address, &receiver, &payer);

    // Initially, the stablecoin should be set to stablecoin_address
    let initial_stablecoin = client.get_stablecoin();
    assert_eq!(initial_stablecoin, stablecoin_address);

    // Change the stablecoin address
    let new_stablecoin = Address::generate(&env);

    client.set_stablecoin(&new_stablecoin);

    // Verify that the stablecoin address has been updated
    let updated_stablecoin = client.get_stablecoin();

    assert_eq!(updated_stablecoin, new_stablecoin);
}

// add test of setters getters for reciever and payer
#[test]
fn test_receiver_payer_setter_getter() {
    let env = Env::default();
    let initial_receiver = Address::generate(&env);
    let initial_payer = Address::generate(&env);
    let owner = Address::generate(&env);
    let stablecoin_address = deploy_stablecoin_contract(&env, &owner, 1000000);
    let client = create_client(
        &env,
        &owner,
        &stablecoin_address,
        &initial_receiver,
        &initial_payer,
    );

    // Initially, the receiver and payer should be set to initial_receiver and initial_payer
    let receiver = client.get_receiver();
    let payer = client.get_payer();
    assert_eq!(receiver, initial_receiver);
    assert_eq!(payer, initial_payer);

    // Change the receiver and payer addresses
    let new_receiver = Address::generate(&env);
    let new_payer = Address::generate(&env);
    client.set_receiver(&new_receiver);
    client.set_payer(&new_payer);

    // Verify that the receiver and payer addresses have been updated
    let updated_receiver = client.get_receiver();
    let updated_payer = client.get_payer();
    assert_eq!(updated_receiver, new_receiver);
    assert_eq!(updated_payer, new_payer);
}

#[test]
fn test_investor_creation() {
    let env = Env::default();
    let receiver = Address::generate(&env);
    let payer = Address::generate(&env);
    let owner = Address::generate(&env);
    let stablecoin_address = deploy_stablecoin_contract(&env, &owner, 1000000);

    let client = create_client(&env, &owner, &stablecoin_address, &receiver, &payer);

    let new_investor = Address::generate(&env);
    client.create_investor(&new_investor);

    // Check if the investor was created successfully
    let is_investor = client.is_investor(&new_investor);
    assert!(is_investor);

    // Check if the investors array length is 1
    let investors_array_length = client.get_investors_array_length();
    assert_eq!(investors_array_length, 1);

    // Check of the claimed amount for the new investor is initialized to 0
    let claimed_amount = client.see_claimed_amount(&new_investor);
    assert_eq!(claimed_amount, 0);
}

#[test]
#[should_panic(expected = "INVESTOR_ALREADY_EXISTS")]
fn test_double_investor_creation() {
    let env = Env::default();
    let receiver = Address::generate(&env);
    let payer = Address::generate(&env);
    let owner = Address::generate(&env);
    let stablecoin_address = deploy_stablecoin_contract(&env, &owner, 1000000);

    let client = create_client(&env, &owner, &stablecoin_address, &receiver, &payer);

    let new_investor = Address::generate(&env);
    client.create_investor(&new_investor);

    // Check if the investor was created successfully
    let is_investor = client.is_investor(&new_investor);
    assert!(is_investor);

    // Attempt to create the same investor again, which should panic
    client.create_investor(&new_investor);
}

#[test]
fn test_start_chronometer() {
    let env = Env::default();
    let receiver = Address::generate(&env);
    let payer = Address::generate(&env);
    let owner = Address::generate(&env);
    let stablecoin_address = deploy_stablecoin_contract(&env, &owner, 1000000);
    let client = create_client(&env, &owner, &stablecoin_address, &receiver, &payer);

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
fn test_deploy_mock_stablecoin() {
    let env = Env::default();

    let owner = Address::generate(&env);
    let stablecoin_address = deploy_stablecoin_contract(&env, &owner, 1000000);
    let stablecoin_client = StablecoinClient::new(&env, &stablecoin_address);

    // Verify metadata
    let name = stablecoin_client.name();
    let symbol = stablecoin_client.symbol();
    let decimals = stablecoin_client.decimals();

    let expected_name = String::from_str(&env, "USDC Mock Token");
    let expected_symbol = String::from_str(&env, "USDC");
    let expected_decimals = 6u32;

    assert_eq!(name, expected_name);
    assert_eq!(symbol, expected_symbol);
    assert_eq!(decimals, expected_decimals);
}
