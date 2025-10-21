# API Testing Guide

## Setup

1. Start the server: `npm run dev`
2. Access Swagger UI: `http://localhost:8080/api-docs`

## Testing with cURL

### Create an Investor

```bash
curl -X POST http://localhost:8080/api/investors \
  -H "Content-Type: application/json" \
  -d '{
    "stellarAddress": "GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    "email": "investor@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "phoneNumber": "+1234567890",
    "country": "USA"
  }'
```

### Expected Success Response (201)

```json
{
  "success": true,
  "message": "Investor created successfully",
  "data": {
    "investor": {
      "id": "67123abc...",
      "stellarAddress": "GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
      "email": "investor@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "phoneNumber": "+1234567890",
      "country": "USA",
      "kycStatus": "pending",
      "nftBalance": 0,
      "totalInvested": 0,
      "claimedAmount": 0,
      "createdAt": "2025-10-21T12:00:00.000Z",
      "updatedAt": "2025-10-21T12:00:00.000Z"
    },
    "transactionHash": "abc123def456..."
  }
}
```

### Error Responses

#### Missing Required Fields (400)
```json
{
  "success": false,
  "message": "Missing required fields",
  "error": "stellarAddress, email, firstName, and lastName are required"
}
```

#### Invalid Email (400)
```json
{
  "success": false,
  "message": "Invalid email format"
}
```

#### Invalid Stellar Address (400)
```json
{
  "success": false,
  "message": "Invalid Stellar address format"
}
```

#### Investor Already Exists (409)
```json
{
  "success": false,
  "message": "Investor already exists",
  "error": "Email already registered"
}
```

#### Blockchain Error (500)
```json
{
  "success": false,
  "message": "Failed to create investor on blockchain",
  "error": "Stellar transaction failed: ..."
}
```

## Testing with Postman

Import this collection:

```json
{
  "info": {
    "name": "Minah API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Create Investor",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"stellarAddress\": \"GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX\",\n  \"email\": \"investor@example.com\",\n  \"firstName\": \"John\",\n  \"lastName\": \"Doe\",\n  \"phoneNumber\": \"+1234567890\",\n  \"country\": \"USA\"\n}"
        },
        "url": {
          "raw": "http://localhost:8080/api/investors",
          "protocol": "http",
          "host": ["localhost"],
          "port": "8080",
          "path": ["api", "investors"]
        }
      }
    },
    {
      "name": "Health Check",
      "request": {
        "method": "GET",
        "url": {
          "raw": "http://localhost:8080/health",
          "protocol": "http",
          "host": ["localhost"],
          "port": "8080",
          "path": ["health"]
        }
      }
    }
  ]
}
```

## Testing Flow

1. **Generate Stellar Keypair** (if needed):
   ```bash
   # Using Stellar CLI
   stellar keys generate investor1 --network testnet
   stellar keys address investor1
   ```

2. **Configure Environment**:
   - Ensure `.env` has valid MongoDB URI
   - Ensure `.env` has valid Stellar contract ID
   - Ensure `.env` has valid owner secret key

3. **Test the Endpoint**:
   - Use the generated Stellar address in the request
   - Verify investor is created in MongoDB
   - Verify transaction hash is returned
   - Check Stellar transaction on Stellar Expert

4. **Verify on Stellar Blockchain**:
   ```
   https://stellar.expert/explorer/testnet/tx/{transactionHash}
   ```

## Common Issues

### MongoDB Connection Failed
- Check your MongoDB Atlas connection string
- Ensure IP whitelist includes your IP
- Verify network connectivity

### Stellar Transaction Failed
- Verify contract is deployed and ID is correct
- Check owner account has sufficient XLM for fees
- Ensure owner secret key is correct
- Verify network (testnet vs mainnet)

### Investor Already Exists
- Each email and Stellar address must be unique
- Check MongoDB for existing records
- Use different email/address for testing

## Next Steps

After successfully testing investor creation:
1. Implement additional endpoints (get investor, update, etc.)
2. Add minting functionality
3. Add transfer/marketplace endpoints
4. Implement KYC verification workflow
5. Add authentication/authorization
