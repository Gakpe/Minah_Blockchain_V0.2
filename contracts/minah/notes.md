## Deploy Smart Contract CMD

```bash
 stellar contract deploy \                              130 ↵ ──(Thu,Oct30)─┘
 --wasm target/wasm32v1-none/release/minah.wasm \
 --source-account alice \
 --network testnet \
 --alias minah_2 \
 -- \
 --owner $(stellar keys address alice) \
 --stablecoin CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA \
 --receiver $(stellar keys address alice) \
 --payer $(stellar keys address alice) \
 --price 1 \
 --total-supply 4500 \
 --min-nfts-to-mint 40 \
 --max-nfts-per-investor 150 \
 --distribution-intervals '[60,120,180,240,300,360,420,480,540,600]' \
 --roi-percentages '["40000000", "26700000", "26700000", "26700000", "26700000", "26700000", "26700000", "26700000", "26700000", "26700000"]'
```

## Test Hello CMD

```bash
stellar contract invoke \
  --id CCLYOFOQRM337RESE7WVBY6U3WL7IJKCWE7JES3J2L6OYMHBZ3USJW4A \
  --source-account alice \
  --network testnet \
  -- \
  hello \
  --to Buoya
```

## Create Investor CMD

```bash
stellar contract invoke \
  --id CCLYOFOQRM337RESE7WVBY6U3WL7IJKCWE7JES3J2L6OYMHBZ3USJW4A \
  --source-account alice \
  --network testnet \
  -- \
  create_investor \
  --new_investor GALXBNO5FE4BGADFPNHNLOKCEHD6B7CBVE57BN6AXQQY5EYK4Q7IYTGM
```

## Deployed Address

CCLYOFOQRM337RESE7WVBY6U3WL7IJKCWE7JES3J2L6OYMHBZ3USJW4A
