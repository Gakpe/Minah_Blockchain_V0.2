use soroban_sdk::{Address, Env};
use stablecoin::Stablecoin;

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

pub fn deploy_stablecoin_contract(env: &Env, user: &Address, premint_amount: i128) -> Address {
    let contract_id = env.register(Stablecoin, (user, premint_amount));

    contract_id
}
