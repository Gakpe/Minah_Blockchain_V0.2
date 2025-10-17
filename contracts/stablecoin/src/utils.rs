use soroban_sdk::{Address, Env};

use crate::Stablecoin;

pub fn deploy_stablecoin_contract(env: &Env) -> Address {
    let contract_id = env.register(Stablecoin, ());

    contract_id
}
