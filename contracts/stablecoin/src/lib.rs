#![no_std]

use soroban_sdk::{contract, contractimpl, Env, String};
use stellar_macros::default_impl;
use stellar_tokens::fungible::{Base, FungibleToken};

#[contract]
pub struct Stablecoin;

#[contractimpl]
impl Stablecoin {
    pub fn __constructor(e: &Env) {
        Base::set_metadata(
            e,
            6u32,
            String::from_str(e, "USDC Mock Token"),
            String::from_str(e, "USDC"),
        );
    }

    pub fn add(x: u32, y: u32) -> u32 {
        x.checked_add(y).expect("no overflow")
    }
}

#[default_impl]
#[contractimpl]
impl FungibleToken for Stablecoin {
    type ContractType = Base;
}

pub mod utils;

#[cfg(test)]
mod test;
