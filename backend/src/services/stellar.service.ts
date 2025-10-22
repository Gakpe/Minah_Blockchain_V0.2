import {
  Keypair,
  Contract,
  Address,
  TransactionBuilder,
  BASE_FEE,
  Networks,
  rpc as StellarRpc,
} from "@stellar/stellar-sdk";
import { CONFIG } from "../config";
import * as MinahClient from "../config/minah";

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
  async calculateAmountToRelease(percent: number): Promise<string> {
    try {
      const contract = new MinahClient.Client({
        ...(this.network === "testnet"
          ? MinahClient.networks.testnet
          : MinahClient.networks.mainnet),
        rpcUrl: CONFIG.stellar.rpcUrl,
      });

      const { result } = await contract.calculate_amount_to_release({
        percent: BigInt(percent),
      });

      return result.toString();
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
      // Build the contract invocation
      const contract = new Contract(this.contractId);

      // Transactions require a valid sequence number (which varies from one
      // account to another). We fetch this sequence number from the RPC server.
      const ownerAccount = await this.server.getAccount(
        this.ownerKeypair.publicKey()
      );

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

      return sendResponse.hash;
    } catch (error) {
      // Catch and report any errors we've thrown
      console.log("Sending transaction failed");
      console.log(error);
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
