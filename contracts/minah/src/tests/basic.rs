use crate::tests::utils::{create_client, USDC_ADDRESS};
use soroban_sdk::{vec, Env, String};

#[test]
fn test_hello() {
    let env = Env::default();
    let (client, _owner) = create_client(&env, USDC_ADDRESS);

    let words = client.hello(&String::from_str(&env, "Dev"));
    assert_eq!(
        words,
        vec![
            &env,
            String::from_str(&env, "Hello"),
            String::from_str(&env, "Dev"),
        ]
    );
}
