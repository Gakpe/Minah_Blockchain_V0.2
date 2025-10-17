use soroban_sdk::{Address, Env};

use crate::Stablecoin;

pub fn deploy_stablecoin_contract(env: &Env, user: &Address, premint_amount: i128) -> Address {
    let contract_id = env.register(Stablecoin, (user, premint_amount));

    contract_id
}
