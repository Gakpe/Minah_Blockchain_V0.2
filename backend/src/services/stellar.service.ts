import {
  Keypair,
  Contract,
  Address,
  TransactionBuilder,
  BASE_FEE,
  Networks,
  rpc as StellarRpc,
  nativeToScVal,
} from "@stellar/stellar-sdk";
import { CONFIG } from "../config";
import * as MinahClient from "../config/minah";
import { parseUnits } from "viem";

class StellarService {
  private server: StellarRpc.Server;
  private network: string;
  private contractId: string;
  private ownerKeypair: Keypair;

  constructor() {
    this.network = CONFIG.stellar.network;
    this.server = new StellarRpc.Server(CONFIG.stellar.rpcUrl);

    this.contractId = CONFIG.stellar.contractId;

    if (!CONFIG.stellar.ownerSecretKey) {
      throw new Error("STELLAR_OWNER_SECRET_KEY not configured");
    }

    this.ownerKeypair = Keypair.fromSecret(CONFIG.stellar.ownerSecretKey);
  }

  /**
   * Create an investor on the Stellar smart contract
   * @param investorAddress - The Stellar address of the new investor
   * @returns Transaction hash
   */
  async createInvestor(investorAddress: string): Promise<string> {
    try {
      // Build the contract invocation
      const contract = new Contract(this.contractId);

      // Transactions require a valid sequence number (which varies from one
      // account to another). We fetch this sequence number from the RPC server.
      const ownerAccount = await this.server.getAccount(
        this.ownerKeypair.publicKey()
      );

      // Prepare the create_investor function call
      const operation = contract.call(
        "create_investor",
        Address.fromString(investorAddress).toScVal()
      );

      // Build the transaction
      const builtTransaction = new TransactionBuilder(ownerAccount, {
        fee: BASE_FEE,
        networkPassphrase:
          this.network === "testnet" ? Networks.TESTNET : Networks.PUBLIC,
      })
        .addOperation(operation)
        .setTimeout(30)
        .build();

      // / We use the RPC server to "prepare" the transaction. This simulating the
      // transaction, discovering the storage footprint, and updating the
      // transaction to include that footprint. If you know the footprint ahead of
      // time, you could manually use `addFootprint` and skip this step.
      let preparedTransaction =
        await this.server.prepareTransaction(builtTransaction);

      // Sign the transaction with the source account's keypair.
      preparedTransaction.sign(this.ownerKeypair);

      let sendResponse = await this.server.sendTransaction(preparedTransaction);
      console.log(`Sent transaction: ${JSON.stringify(sendResponse)}`);

      if (sendResponse.status === "PENDING") {
        let getResponse = await this.server.getTransaction(sendResponse.hash);
        // Poll `getTransaction` until the status is not "NOT_FOUND"
        while (getResponse.status === "NOT_FOUND") {
          console.log("Waiting for transaction confirmation...");
          // See if the transaction is complete
          getResponse = await this.server.getTransaction(sendResponse.hash);
          // Wait one second
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }

        if (getResponse.status === "SUCCESS") {
          // Make sure the transaction's resultMetaXDR is not empty
          if (!getResponse.resultMetaXdr) {
            throw "Empty resultMetaXDR in getTransaction response";
          }
          // let returnValue = getResponse.returnValue;
          // console.log(`Transaction result: ${returnValue?.value()}`);
        } else {
          throw `Transaction failed: ${getResponse.resultXdr}`;
        }
      } else {
        // Use the typed field `errorResult` when available, otherwise throw a generic error.
        const errorPayload = sendResponse.errorResult ?? {
          message: "Transaction failed",
          response: sendResponse,
        };
        throw new Error(
          typeof errorPayload === "string"
            ? errorPayload
            : JSON.stringify(errorPayload)
        );
      }

      return sendResponse.hash;
    } catch (error) {
      // Catch and report any errors we've thrown
      console.log("Sending transaction failed");
      console.log(JSON.stringify(error));
      throw error;
    }
  }

  /**
   * Call the `hello` function on the Minah smart contract.
   * The contract method signature in Rust is: hello(env, to: String) -> Vec<String>
   * We'll call it with a single string and return the array of strings.
   */
  async hello(to: string): Promise<string> {
    try {
      const contract = new MinahClient.Client({
        ...(this.network === "testnet"
          ? MinahClient.networks.testnet
          : MinahClient.networks.mainnet),
        rpcUrl: CONFIG.stellar.rpcUrl,
      });

      const { result } = await contract.hello({ to });

      const greeting = result.join(" ");

      return greeting;
    } catch (error) {
      console.error("Error calling hello on Stellar:", error);
      throw error;
    }
  }

  /**
   * Start the chronometer for ROI distribution
   * @returns Transaction hash
   */
  async startChronometer(): Promise<string> {
    try {
      // Build the contract invocation
      const contract = new Contract(this.contractId);

      // Transactions require a valid sequence number (which varies from one
      // account to another). We fetch this sequence number from the RPC server.
      const ownerAccount = await this.server.getAccount(
        this.ownerKeypair.publicKey()
      );

      // Prepare the start_chronometer function call
      const operation = contract.call("start_chronometer");

      // Build the transaction
      const builtTransaction = new TransactionBuilder(ownerAccount, {
        fee: BASE_FEE,
        networkPassphrase:
          this.network === "testnet" ? Networks.TESTNET : Networks.PUBLIC,
      })
        .addOperation(operation)
        .setTimeout(30)
        .build();

      // We use the RPC server to "prepare" the transaction. This simulating the
      // transaction, discovering the storage footprint, and updating the
      // transaction to include that footprint. If you know the footprint ahead of
      // time, you could manually use `addFootprint` and skip this step.
      let preparedTransaction =
        await this.server.prepareTransaction(builtTransaction);

      // Sign the transaction with the source account's keypair.
      preparedTransaction.sign(this.ownerKeypair);

      // Let's see the base64-encoded XDR of the transaction we just built.
      console.log(
        `Signed prepared transaction XDR: ${preparedTransaction
          .toEnvelope()
          .toXDR("base64")}`
      );

      let sendResponse = await this.server.sendTransaction(preparedTransaction);
      console.log(`Sent transaction: ${JSON.stringify(sendResponse)}`);

      if (sendResponse.status === "PENDING") {
        let getResponse = await this.server.getTransaction(sendResponse.hash);
        // Poll `getTransaction` until the status is not "NOT_FOUND"
        while (getResponse.status === "NOT_FOUND") {
          console.log("Waiting for transaction confirmation...");
          // See if the transaction is complete
          getResponse = await this.server.getTransaction(sendResponse.hash);
          // Wait one second
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }

        if (getResponse.status === "SUCCESS") {
          // Make sure the transaction's resultMetaXDR is not empty
          if (!getResponse.resultMetaXdr) {
            throw "Empty resultMetaXDR in getTransaction response";
          }
          // Find the return value from the contract and return it

          let returnValue = getResponse.returnValue;
          console.log(`Transaction result: ${returnValue?.value()}`);
        } else {
          throw `Transaction failed: ${getResponse.resultXdr}`;
        }
      } else {
        // Use the typed field `errorResult` when available, otherwise throw a generic error.
        const errorPayload = sendResponse.errorResult ?? {
          message: "Transaction failed",
          response: sendResponse,
        };
        throw new Error(
          typeof errorPayload === "string"
            ? errorPayload
            : JSON.stringify(errorPayload)
        );
      }

      return sendResponse.hash;
    } catch (error) {
      // Catch and report any errors we've thrown
      console.log("Sending transaction failed");
      console.log(JSON.stringify(error));
      throw error;
    }
  }

  /**
   * Calculate amount to release for a given percentage
   * @param percent - The percentage of ROI to be released (scaled by 1,000,000)
   * @returns The amount to release as a string
   */
  async calculateAmountToRelease(percent: bigint): Promise<bigint> {
    try {
      const contract = new MinahClient.Client({
        ...(this.network === "testnet"
          ? MinahClient.networks.testnet
          : MinahClient.networks.mainnet),
        rpcUrl: CONFIG.stellar.rpcUrl,
      });

      const { result } = await contract.calculate_amount_to_release({
        percent: percent,
      });

      return result;
    } catch (error) {
      console.error(
        "Error calling calculate_amount_to_release on Stellar:",
        error
      );
      throw error;
    }
  }

  /**
   * Release distribution for the current stage
   * @returns Transaction hash
   */
  async releaseDistribution(): Promise<string> {
    try {
      // USDC contract address
      const USDC_CONTRACT_ADDRESS = CONFIG.stellar.usdc.contractId;
      const ownerAddress = this.ownerKeypair.publicKey();

      console.log("Starting release distribution...");
      console.log(`Owner account: ${ownerAddress}`);

      // Approve the contract to spend a very large amount of USDC
      // Using i128 max value to ensure contract can always transfer needed amounts
      const APPROVE_AMOUNT = BigInt("170141183460469231731687303715884105727"); // i128::MAX

      const latestLedger = await this.server.getLatestLedger();

      console.log(`Latest ledger: ${latestLedger}`);

      const liveUntilLedger = latestLedger.sequence + 1_000_000; // valid for the next 1_000_000

      console.log(`Live until ledger: ${liveUntilLedger}`);

      console.log("Approving contract to spend USDC...");
      const usdcContract = new Contract(USDC_CONTRACT_ADDRESS);
      const approveOperation = usdcContract.call(
        "approve",
        Address.fromString(ownerAddress).toScVal(),
        Address.fromString(this.contractId).toScVal(),
        nativeToScVal(APPROVE_AMOUNT, { type: "i128" }),
        nativeToScVal(liveUntilLedger, { type: "u32" }) // live_until_ledger
      );

      const approveAccount = await this.server.getAccount(ownerAddress);
      const approveTransaction = new TransactionBuilder(approveAccount, {
        fee: BASE_FEE,
        networkPassphrase:
          this.network === "testnet" ? Networks.TESTNET : Networks.PUBLIC,
      })
        .addOperation(approveOperation)
        .setTimeout(30)
        .build();

      const preparedApproveTransaction =
        await this.server.prepareTransaction(approveTransaction);

      preparedApproveTransaction.sign(this.ownerKeypair);

      const approveResponse = await this.server.sendTransaction(
        preparedApproveTransaction
      );

      // Wait for approval transaction
      let approveResult = await this.server.getTransaction(
        approveResponse.hash
      );
      while (approveResult.status === "NOT_FOUND") {
        console.log("Waiting for approval confirmation...");
        approveResult = await this.server.getTransaction(approveResponse.hash);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      if (approveResult.status !== "SUCCESS") {
        throw new Error(`Failed to approve: ${approveResult.resultXdr}`);
      }

      console.log(`Approval successful: ${approveResponse.hash}`);

      // Now proceed with release distribution
      console.log("Calling release_distribution...");
      const contract = new Contract(this.contractId);

      // Transactions require a valid sequence number (which varies from one
      // account to another). We fetch this sequence number from the RPC server.
      const ownerAccount = await this.server.getAccount(ownerAddress);

      // Prepare the release_distribution function call
      const operation = contract.call("release_distribution");

      // Build the transaction
      const builtTransaction = new TransactionBuilder(ownerAccount, {
        fee: BASE_FEE,
        networkPassphrase:
          this.network === "testnet" ? Networks.TESTNET : Networks.PUBLIC,
      })
        .addOperation(operation)
        .setTimeout(30)
        .build();

      // We use the RPC server to "prepare" the transaction. This simulating the
      // transaction, discovering the storage footprint, and updating the
      // transaction to include that footprint. If you know the footprint ahead of
      // time, you could manually use `addFootprint` and skip this step.
      let preparedTransaction =
        await this.server.prepareTransaction(builtTransaction);

      // Sign the transaction with the source account's keypair.
      preparedTransaction.sign(this.ownerKeypair);

      // Let's see the base64-encoded XDR of the transaction we just built.
      console.log(
        `Signed prepared transaction XDR: ${preparedTransaction
          .toEnvelope()
          .toXDR("base64")}`
      );

      let sendResponse = await this.server.sendTransaction(preparedTransaction);
      console.log(`Sent transaction: ${JSON.stringify(sendResponse)}`);

      if (sendResponse.status === "PENDING") {
        let getResponse = await this.server.getTransaction(sendResponse.hash);
        // Poll `getTransaction` until the status is not "NOT_FOUND"
        while (getResponse.status === "NOT_FOUND") {
          console.log("Waiting for transaction confirmation...");
          // See if the transaction is complete
          getResponse = await this.server.getTransaction(sendResponse.hash);
          // Wait one second
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }

        console.log(`getTransaction response: ${JSON.stringify(getResponse)}`);

        if (getResponse.status === "SUCCESS") {
          // Make sure the transaction's resultMetaXDR is not empty
          if (!getResponse.resultMetaXdr) {
            throw "Empty resultMetaXDR in getTransaction response";
          }
          // Find the return value from the contract and return it

          let returnValue = getResponse.returnValue;
          console.log(`Transaction result: ${returnValue?.value()}`);
        } else {
          throw `Transaction failed: ${getResponse.resultXdr}`;
        }
      } else {
        // Use the typed field `errorResult` when available, otherwise throw a generic error.
        const errorPayload = sendResponse.errorResult ?? {
          message: "Transaction failed",
          response: sendResponse,
        };
        throw new Error(
          typeof errorPayload === "string"
            ? errorPayload
            : JSON.stringify(errorPayload)
        );
      }

      console.log(`Release distribution successful: ${sendResponse.hash}`);
      return sendResponse.hash;
    } catch (error) {
      // Catch and report any errors we've thrown
      console.log("Sending transaction failed");
      console.log(error);
      throw error;
    }
  }

  /**
   * Mint NFT with approval and balance checking
   * @param userAddress - The Stellar address of the user to mint to
   * @param amount - The number of NFTs to mint
   * @returns Transaction hash
   */
  async mintNFT(userAddress: string, amount: number): Promise<string> {
    try {
      // USDC contract address with 7 decimals
      const USDC_CONTRACT_ADDRESS = CONFIG.stellar.usdc.contractId;
      const USDC_DECIMALS = CONFIG.stellar.usdc.decimals;

      if (!CONFIG.stellar.mintSecretKey) {
        throw new Error("STELLAR_MINT_SECRET_KEY not configured");
      }

      const mintKeypair = Keypair.fromSecret(CONFIG.stellar.mintSecretKey);
      const mintAddress = mintKeypair.publicKey();

      console.log(`Minting ${amount} NFT(s) to ${userAddress}`);
      console.log(`Mint account: ${mintAddress}`);

      // Get NFT price from contract
      const contract = new MinahClient.Client({
        ...(this.network === "testnet"
          ? MinahClient.networks.testnet
          : MinahClient.networks.mainnet),
        rpcUrl: CONFIG.stellar.rpcUrl,
      });

      const { result: nftPriceB } = await contract.get_nft_price();
      const nftPrice = Number(nftPriceB);
      const totalCost = nftPrice * amount;
      const parsedTotalCost = parseUnits(totalCost.toString(), USDC_DECIMALS);

      console.log(`NFT Price: ${nftPrice} USDC)`);

      console.log(
        `Total cost: ${totalCost} (${parsedTotalCost.toString()} USDC)`
      );

      // Check USDC balance of mint account
      const usdcContract = new Contract(USDC_CONTRACT_ADDRESS);
      const mintAccount = await this.server.getAccount(mintAddress);

      const asset = new MinahClient.Asset(
        CONFIG.stellar.usdc.asset_code,
        CONFIG.stellar.usdc.asset_issuer
      );

      const entry = await this.server.getTrustline(
        mintAccount.accountId(),
        asset
      );

      let usdcBalance = BigInt(entry?.balance().toString()) || 0n;

      console.log(`USDC Balance: ${usdcBalance}`);

      console.log("Checking mint account balance...");

      if (usdcBalance < parsedTotalCost) {
        throw new Error(
          `Insufficient balance. Required: ${totalCost}, Available: ${usdcBalance}`
        );
      }

      console.log("Balance sufficient, proceeding with minting...");

      const latestLedger = await this.server.getLatestLedger();

      console.log(`Latest ledger: ${latestLedger}`);

      const liveUntilLedger = latestLedger.sequence + 1_000_000; // valid for the next 1_000_000

      console.log(`Live until ledger: ${liveUntilLedger}`);

      // Approve the contract to spend USDC
      console.log("Approving contract to spend USDC...");
      const approveOperation = usdcContract.call(
        "approve",
        Address.fromString(mintAddress).toScVal(),
        Address.fromString(this.contractId).toScVal(),
        nativeToScVal(parsedTotalCost, { type: "i128" }),
        nativeToScVal(liveUntilLedger, { type: "u32" }) // live_until_ledger
      );

      const approveAccount = await this.server.getAccount(mintAddress);
      const approveTransaction = new TransactionBuilder(approveAccount, {
        fee: BASE_FEE,
        networkPassphrase:
          this.network === "testnet" ? Networks.TESTNET : Networks.PUBLIC,
      })
        .addOperation(approveOperation)
        .setTimeout(30)
        .build();

      const preparedApproveTransaction =
        await this.server.prepareTransaction(approveTransaction);

      preparedApproveTransaction.sign(mintKeypair);

      const approveResponse = await this.server.sendTransaction(
        preparedApproveTransaction
      );

      // Wait for approval transaction
      let approveResult = await this.server.getTransaction(
        approveResponse.hash
      );
      while (approveResult.status === "NOT_FOUND") {
        console.log("Waiting for approval confirmation...");
        approveResult = await this.server.getTransaction(approveResponse.hash);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      if (approveResult.status !== "SUCCESS") {
        throw new Error(`Failed to approve: ${approveResult.resultXdr}`);
      }

      console.log(`Approval successful: ${approveResponse.hash}`);

      // Now mint the NFT
      console.log("Minting NFT...");
      const mintOperation = new Contract(this.contractId).call(
        "mint",
        Address.fromString(userAddress).toScVal(),
        nativeToScVal(amount, { type: "u32" })
      );

      // // Get the base64-encoded XDR string (similar to ethers encoded calldata)
      // const xdrBase64 = mintOperation.toXDR("base64");

      // console.log(`XDR: ${xdrBase64}`);

      const mintAccountForMint = await this.server.getAccount(mintAddress);
      const mintTransaction = new TransactionBuilder(mintAccountForMint, {
        fee: BASE_FEE,
        networkPassphrase:
          this.network === "testnet" ? Networks.TESTNET : Networks.PUBLIC,
      })
        .addOperation(mintOperation)
        .setTimeout(30)
        .build();

      const preparedMintTransaction =
        await this.server.prepareTransaction(mintTransaction);

      preparedMintTransaction.sign(mintKeypair);

      const mintResponse = await this.server.sendTransaction(
        preparedMintTransaction
      );

      // Wait for mint transaction
      let mintResult = await this.server.getTransaction(mintResponse.hash);
      while (mintResult.status === "NOT_FOUND") {
        console.log("Waiting for mint confirmation...");
        mintResult = await this.server.getTransaction(mintResponse.hash);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      if (mintResult.status !== "SUCCESS") {
        throw new Error(`Failed to mint: ${mintResult.resultXdr}`);
      }

      console.log(`Mint successful: ${mintResponse.hash}`);
      return mintResponse.hash;
    } catch (error) {
      console.error("Minting failed");
      console.error(JSON.stringify(error));
      throw error;
    }
  }

  /**
   * Get the current state of the investment from the contract
   * @returns The current investment state
   */
  async getCurrentInvestmentState(): Promise<number> {
    try {
      const contract = new MinahClient.Client({
        ...(this.network === "testnet"
          ? MinahClient.networks.testnet
          : MinahClient.networks.mainnet),
        rpcUrl: CONFIG.stellar.rpcUrl,
      });

      const { result } = await contract.get_current_state();

      return result;
    } catch (error) {
      console.error("Error calling get_current_state on Stellar:", error);
      throw error;
    }
  }

  /**
   * Check if the chronometer has started
   * @returns boolean indicating if chronometer is started
   */
  async isChronometerStarted(): Promise<boolean> {
    try {
      const contract = new MinahClient.Client({
        ...(this.network === "testnet"
          ? MinahClient.networks.testnet
          : MinahClient.networks.mainnet),
        rpcUrl: CONFIG.stellar.rpcUrl,
      });

      const { result } = await contract.is_chronometer_started();

      return result;
    } catch (error) {
      console.error("Error calling is_chronometer_started on Stellar:", error);
      throw error;
    }
  }

  /**
   * Get the begin date of the chronometer
   * @returns The begin date as a timestamp (u64)
   */
  async getChronometerBeginDate(): Promise<bigint> {
    try {
      const contract = new MinahClient.Client({
        ...(this.network === "testnet"
          ? MinahClient.networks.testnet
          : MinahClient.networks.mainnet),
        rpcUrl: CONFIG.stellar.rpcUrl,
      });

      const { result } = await contract.get_begin_date();

      return result;
    } catch (error) {
      console.error("Error calling get_begin_date on Stellar:", error);
      throw error;
    }
  }

  /**
   * Get the current supply of NFTs from the contract
   * @returns The current NFT supply
   */
  async getCurrentNFTSupply(): Promise<number> {
    try {
      const contract = new MinahClient.Client({
        ...(this.network === "testnet"
          ? MinahClient.networks.testnet
          : MinahClient.networks.mainnet),
        rpcUrl: CONFIG.stellar.rpcUrl,
      });

      const { result } = await contract.get_current_supply();

      return result;
    } catch (error) {
      console.error("Error calling get_current_supply on Stellar:", error);
      throw error;
    }
  }

  /**
   * Get the claimed amount for a specific investor
   * @param investorAddress - The Stellar address of the investor
   * @returns The claimed amount for the investor
   */
  async getInvestorClaimedAmount(investorAddress: string): Promise<bigint> {
    try {
      const contract = new MinahClient.Client({
        ...(this.network === "testnet"
          ? MinahClient.networks.testnet
          : MinahClient.networks.mainnet),
        rpcUrl: CONFIG.stellar.rpcUrl,
      });

      const { result } = await contract.see_claimed_amount({
        investor: investorAddress,
      });

      return result;
    } catch (error) {
      console.error("Error calling see_claimed_amount on Stellar:", error);
      throw error;
    }
  }

  /**
   * Validate if a Stellar address is valid
   * @param address - The Stellar address to validate
   * @returns boolean indicating if address is valid
   */
  validateAddress(address: string): boolean {
    try {
      Address.fromString(address);
      return true;
    } catch {
      return false;
    }
  }
}

export const stellarService = new StellarService();
