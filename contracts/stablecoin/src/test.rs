use soroban_sdk::{Address, Env, String};

use crate::{utils::deploy_stablecoin_contract, Stablecoin, StablecoinClient};



#[test]
fn test_deploy_stablecoin() {
    let env = Env::default();
    let contract_id = deploy_stablecoin_contract(&env);
    let stablecoin_client = StablecoinClient::new(&env, &contract_id);

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
