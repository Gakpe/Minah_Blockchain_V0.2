# Minah Contract Tests

This package contains unit tests that cover the Minah smart contract behaviors, including:

- Initialization and getters/setters
- Investor onboarding, minting constraints, and supply caps
- Chronometer start and buying-phase supply snapshot
- ROI distribution scheduling across stages and claimed amount accounting
- Marketplace buy/sell flows with validations (state, investor/owner status, balances, allowances)

## Run tests

From repository root:

```
zsh
cargo test -p minah
```

## Notes

- Tests use `env.mock_all_auths()` to simplify authorization in the unit environment.
- Stablecoin mock contract is used for balance and allowance checks.
- Distribution intervals in tests are short (seconds) to speed up test execution.
