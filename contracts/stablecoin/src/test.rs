use soroban_sdk::{testutils::Address as _, Address, Env, String};

use crate::{Stablecoin, StablecoinClient};

pub fn deploy_stablecoin_contract(env: &Env, user: &Address, premint_amount: i128) -> Address {
    let contract_id = env.register(Stablecoin, (user, premint_amount));

    contract_id
}

#[test]
fn test_deploy_stablecoin() {
    let env = Env::default();
    let user = Address::generate(&env);
    let premint_amount = 100000000000000000000000;
    let contract_id = deploy_stablecoin_contract(&env, &user, premint_amount);
    let stablecoin_client = StablecoinClient::new(&env, &contract_id);

    // Verify metadata
    let name = stablecoin_client.name();
    let symbol = stablecoin_client.symbol();
    let decimals = stablecoin_client.decimals();
    let user_balance = stablecoin_client.balance(&user);

    let expected_name = String::from_str(&env, "USDC Mock Token");
    let expected_symbol = String::from_str(&env, "USDC");
    let expected_decimals = 7u32;
    let expected_user_balance = premint_amount;

    assert_eq!(name, expected_name);
    assert_eq!(symbol, expected_symbol);
    assert_eq!(decimals, expected_decimals);
    assert_eq!(user_balance, expected_user_balance);
}
