#![no_std]

use soroban_sdk::{contract, contractimpl};

#[contract]
pub struct Stablecoin;

#[contractimpl]
impl Stablecoin {
    pub fn add(x: u32, y: u32) -> u32 {
        x.checked_add(y).expect("no overflow")
    }
}

#[cfg(test)]
mod test;
