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

pub const USDC_DECIMALS: u32 = 7;

pub fn mint_nft(
    env: &Env,
    client: &MinahClient,
    nft_receiver: &Address,
    nft_amount: u32,
    owner: &Address,
    stablecoin_address: &Address,
    contract_id: &Address,
) {
    // Create An investor before minting
    client.create_investor(&nft_receiver);

    // CHECK: Is the investor created successfully?
    let is_investor = client.is_investor(&nft_receiver);
    assert!(is_investor);

    // Transfer The Required Stablecoin Amount to the nft receiver so that the minting can proceed
    let nft_price = client.get_nft_price();

    let total_amount = nft_price * (nft_amount as i128) * 10i128.pow(USDC_DECIMALS);

    let stablecoin_client = stablecoin::StablecoinClient::new(&env, &stablecoin_address);

    // Transfer stablecoin to the nft_receiver
    stablecoin_client.transfer(&owner, &nft_receiver, &total_amount);

    // CHECK: balance of nft_receiver should be equal to total_amount
    let nft_receiver_balance = stablecoin_client.balance(&nft_receiver);
    assert_eq!(nft_receiver_balance, total_amount);

    // Increase Allowance for the payer to allow the contract to spend stablecoin on behalf of nft_receiver
    stablecoin_client.approve(&nft_receiver, &contract_id, &total_amount, &100);

    let allowance = stablecoin_client.allowance(&nft_receiver, &contract_id);

    // CHECK: allowance should be equal to total_amount
    assert_eq!(allowance, total_amount);

    // Mint the NFTs
    client.mint(&nft_receiver, &nft_amount);

    // CHECK: NFT balance of nft_receiver should be
    let nft_balance = client.balance(&nft_receiver);

    assert_eq!(nft_balance, nft_amount);
}
