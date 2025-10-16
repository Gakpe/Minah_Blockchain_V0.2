use crate::tests::utils::{create_client, USDC_ADDRESS};
use soroban_sdk::{testutils::Address as _, vec, Address, Env, String};

#[test]
fn test_hello() {
    let env = Env::default();
    let receiver = Address::generate(&env);
    let payer = Address::generate(&env);
    let (client, _owner) = create_client(&env, USDC_ADDRESS, &receiver, &payer);

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

    let usdc_address = Address::from_str(&env, USDC_ADDRESS);
    let receiver = Address::generate(&env);
    let payer = Address::generate(&env);

    let (client, _owner) = create_client(&env, USDC_ADDRESS, &receiver, &payer);

    // Initially, the stablecoin should be set to USDC_ADDRESS
    let initial_stablecoin = client.get_stablecoin();
    assert_eq!(initial_stablecoin, usdc_address);

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
    let (client, _owner) = create_client(&env, USDC_ADDRESS, &initial_receiver, &initial_payer);

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
    let (client, _owner) = create_client(&env, USDC_ADDRESS, &receiver, &payer);

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
    let (client, _owner) = create_client(&env, USDC_ADDRESS, &receiver, &payer);

    let new_investor = Address::generate(&env);
    client.create_investor(&new_investor);

    // Check if the investor was created successfully
    let is_investor = client.is_investor(&new_investor);
    assert!(is_investor);

    // Attempt to create the same investor again, which should panic
    client.create_investor(&new_investor);
}
