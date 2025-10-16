use soroban_sdk::{testutils::Address as _, vec, Address, Env, String};

use crate::{Minah, MinahClient};

pub const USDC_ADDRESS: &str = "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5";

pub fn create_client<'a>(env: &Env, stablecoin_address: &str) -> (MinahClient<'a>, Address) {
    env.mock_all_auths();

    let owner = Address::generate(&env);

    let stablecoin = Address::from_str(&env, stablecoin_address);

    let contract_id = env.register(Minah, (&owner, &stablecoin));
    (MinahClient::new(env, &contract_id), owner)
}
