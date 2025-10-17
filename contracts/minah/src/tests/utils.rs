use soroban_sdk::{testutils::Address as _, vec, Address, Env, String};

use crate::{Minah, MinahClient};

pub const USDC_ADDRESS: &str = "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5";

// mod stablecoin_contract {
//     soroban_sdk::contractimport!(file = "../../target/wasm32v1-none/release/stablecoin.wasm");
// }

pub fn create_client<'a>(
    env: &Env,
    stablecoin_address: &Address,
    receiver: &Address,
    payer: &Address,
) -> (MinahClient<'a>, Address) {
    env.mock_all_auths();

    let owner = Address::generate(&env);

    let contract_id = env.register(Minah, (&owner, stablecoin_address, receiver, payer));
    (MinahClient::new(env, &contract_id), owner)
}
