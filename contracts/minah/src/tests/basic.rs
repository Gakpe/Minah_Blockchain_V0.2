use crate::tests::utils::{create_client, USDC_ADDRESS};
use soroban_sdk::{testutils::Address as _, vec, Address, Env, String};

#[test]
fn test_hello() {
    let env = Env::default();
    let (client, _owner) = create_client(&env, USDC_ADDRESS);

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

    let (client, owner) = create_client(&env, USDC_ADDRESS);

    let usdc_address = Address::from_str(&env, USDC_ADDRESS);

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
