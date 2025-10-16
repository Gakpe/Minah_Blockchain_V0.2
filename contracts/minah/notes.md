## Deploy Smart Contract CMD

```bash
stellar contract deploy \
  --wasm target/wasm32v1-none/release/minah.wasm \
  --source-account alice \
  --network testnet \
  --alias minah_1 \
  -- \
  --owner $(stellar keys address alice) \
  --stablecoin GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5 \
  --receiver $(stellar keys address alice) \
  --payer $(stellar keys address alice)
```

## Deployed Address

CCSN3TSGYB2AWBS535AN5CGKUYBFGTAK62GEZL45S3I5JUU556ZWYJDP
