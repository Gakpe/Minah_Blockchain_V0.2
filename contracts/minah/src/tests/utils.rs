use soroban_sdk::{Address, Env};

use crate::{Minah, MinahClient};

pub fn create_client<'a>(
    env: &Env,
    owner: &Address,
    stablecoin_address: &Address,
    receiver: &Address,
    payer: &Address,
) -> MinahClient<'a> {
    env.mock_all_auths();

    let contract_id = env.register(Minah, (owner, stablecoin_address, receiver, payer));

    MinahClient::new(env, &contract_id)
}
