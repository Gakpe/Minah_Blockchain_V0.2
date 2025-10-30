import { Buffer } from "buffer";
import {
  AssembledTransaction,
  Client as ContractClient,
  ClientOptions as ContractClientOptions,
  MethodOptions,
  Spec as ContractSpec,
} from "@stellar/stellar-sdk/contract";
import type { u32, u64, i128, Option } from "@stellar/stellar-sdk/contract";
import { CONFIG } from ".";
export * from "@stellar/stellar-sdk";
export * as contract from "@stellar/stellar-sdk/contract";
export * as rpc from "@stellar/stellar-sdk/rpc";

export const networks = {
  testnet: {
    networkPassphrase: "Test SDF Network ; September 2015",
    contractId: CONFIG.stellar.contractId,
  },
  mainnet: {
    networkPassphrase: "Public Global Stellar Network ; September 2015",
    contractId: CONFIG.stellar.contractId,
  },
} as const;

export enum InvestmentStatus {
  BuyingPhase = 0,
  BeforeFirstRelease = 1,
  Release1 = 2,
  Release2 = 3,
  Release3 = 4,
  Release4 = 5,
  Release5 = 6,
  Release6 = 7,
  Release7 = 8,
  Release8 = 9,
  Release9 = 10,
  Release10 = 11,
  Ended = 12,
}

export type DataKey =
  | { tag: "StableCoin"; values: void }
  | { tag: "CurrentSupply"; values: void }
  | { tag: "BeginDate"; values: void }
  | { tag: "AmountToReleaseForCurrentStage"; values: void }
  | { tag: "Receiver"; values: void }
  | { tag: "Payer"; values: void }
  | { tag: "InvestorsArray"; values: void }
  | { tag: "CountdownStart"; values: void }
  | { tag: "State"; values: void }
  | { tag: "Investor"; values: readonly [string] }
  | { tag: "ClaimedAmount"; values: readonly [string] }
  | { tag: "DistributionIntervals"; values: void }
  | { tag: "ROIPercentages"; values: void }
  | { tag: "Price"; values: void }
  | { tag: "MinNFTsToMint"; values: void }
  | { tag: "MaxNFTsPerInvestor"; values: void }
  | { tag: "TotalSupply"; values: void }
  | { tag: "NFTBuyingPhaseSupply"; values: void };

/**
 * Storage key for enumeration of accounts per role.
 */
export interface RoleAccountKey {
  index: u32;
  role: string;
}

/**
 * Storage keys for the data associated with the access control
 */
export type AccessControlStorageKey =
  | { tag: "RoleAccounts"; values: readonly [RoleAccountKey] }
  | { tag: "HasRole"; values: readonly [string, string] }
  | { tag: "RoleAccountsCount"; values: readonly [string] }
  | { tag: "RoleAdmin"; values: readonly [string] }
  | { tag: "Admin"; values: void }
  | { tag: "PendingAdmin"; values: void };

export const AccessControlError = {
  1210: { message: "Unauthorized" },
  1211: { message: "AdminNotSet" },
  1212: { message: "IndexOutOfBounds" },
  1213: { message: "AdminRoleNotFound" },
  1214: { message: "RoleCountIsNotZero" },
  1215: { message: "RoleNotFound" },
  1216: { message: "AdminAlreadySet" },
  1217: { message: "RoleNotHeld" },
  1218: { message: "RoleIsEmpty" },
};

/**
 * Storage keys for `Ownable` utility.
 */
export type OwnableStorageKey =
  | { tag: "Owner"; values: void }
  | { tag: "PendingOwner"; values: void };

export const OwnableError = {
  1220: { message: "OwnerNotSet" },
  1221: { message: "TransferInProgress" },
  1222: { message: "OwnerAlreadySet" },
};

export const RoleTransferError = {
  1200: { message: "NoPendingTransfer" },
  1201: { message: "InvalidLiveUntilLedger" },
  1202: { message: "InvalidPendingAccount" },
};

/**
 * Storage keys for the data associated with the allowlist extension
 */
export type AllowListStorageKey = { tag: "Allowed"; values: readonly [string] };

/**
 * Storage keys for the data associated with the blocklist extension
 */
export type BlockListStorageKey = { tag: "Blocked"; values: readonly [string] };

/**
 * Storage key that maps to [`AllowanceData`]
 */
export interface AllowanceKey {
  owner: string;
  spender: string;
}

/**
 * Storage container for the amount of tokens for which an allowance is granted
 * and the ledger number at which this allowance expires.
 */
export interface AllowanceData {
  amount: i128;
  live_until_ledger: u32;
}

/**
 * Storage keys for the data associated with `FungibleToken`
 */
export type StorageKey =
  | { tag: "TotalSupply"; values: void }
  | { tag: "Balance"; values: readonly [string] }
  | { tag: "Allowance"; values: readonly [AllowanceKey] };

/**
 * Storage container for token metadata
 */
export interface Metadata {
  decimals: u32;
  name: string;
  symbol: string;
}

/**
 * Storage key for accessing the SAC address
 */
export type SACAdminGenericDataKey = { tag: "Sac"; values: void };

/**
 * Storage key for accessing the SAC address
 */
export type SACAdminWrapperDataKey = { tag: "Sac"; values: void };

export const FungibleTokenError = {
  /**
   * Indicates an error related to the current balance of account from which
   * tokens are expected to be transferred.
   */
  100: { message: "InsufficientBalance" },
  /**
   * Indicates a failure with the allowance mechanism when a given spender
   * doesn't have enough allowance.
   */
  101: { message: "InsufficientAllowance" },
  /**
   * Indicates an invalid value for `live_until_ledger` when setting an
   * allowance.
   */
  102: { message: "InvalidLiveUntilLedger" },
  /**
   * Indicates an error when an input that must be >= 0
   */
  103: { message: "LessThanZero" },
  /**
   * Indicates overflow when adding two values
   */
  104: { message: "MathOverflow" },
  /**
   * Indicates access to uninitialized metadata
   */
  105: { message: "UnsetMetadata" },
  /**
   * Indicates that the operation would have caused `total_supply` to exceed
   * the `cap`.
   */
  106: { message: "ExceededCap" },
  /**
   * Indicates the supplied `cap` is not a valid cap value.
   */
  107: { message: "InvalidCap" },
  /**
   * Indicates the Cap was not set.
   */
  108: { message: "CapNotSet" },
  /**
   * Indicates the SAC address was not set.
   */
  109: { message: "SACNotSet" },
  /**
   * Indicates a SAC address different than expected.
   */
  110: { message: "SACAddressMismatch" },
  /**
   * Indicates a missing function parameter in the SAC contract context.
   */
  111: { message: "SACMissingFnParam" },
  /**
   * Indicates an invalid function parameter in the SAC contract context.
   */
  112: { message: "SACInvalidFnParam" },
  /**
   * The user is not allowed to perform this operation
   */
  113: { message: "UserNotAllowed" },
  /**
   * The user is blocked and cannot perform this operation
   */
  114: { message: "UserBlocked" },
};

/**
 * Storage keys for the data associated with the consecutive extension of
 * `NonFungibleToken`
 */
export type NFTConsecutiveStorageKey =
  | { tag: "Approval"; values: readonly [u32] }
  | { tag: "Owner"; values: readonly [u32] }
  | { tag: "OwnershipBucket"; values: readonly [u32] }
  | { tag: "BurnedToken"; values: readonly [u32] };

export interface OwnerTokensKey {
  index: u32;
  owner: string;
}

/**
 * Storage keys for the data associated with the enumerable extension of
 * `NonFungibleToken`
 */
export type NFTEnumerableStorageKey =
  | { tag: "TotalSupply"; values: void }
  | { tag: "OwnerTokens"; values: readonly [OwnerTokensKey] }
  | { tag: "OwnerTokensIndex"; values: readonly [u32] }
  | { tag: "GlobalTokens"; values: readonly [u32] }
  | { tag: "GlobalTokensIndex"; values: readonly [u32] };

/**
 * Storage container for royalty information
 */
export interface RoyaltyInfo {
  basis_points: u32;
  receiver: string;
}

/**
 * Storage keys for royalty data
 */
export type NFTRoyaltiesStorageKey =
  | { tag: "DefaultRoyalty"; values: void }
  | { tag: "TokenRoyalty"; values: readonly [u32] };

/**
 * Storage container for the token for which an approval is granted
 * and the ledger number at which this approval expires.
 */
export interface ApprovalData {
  approved: string;
  live_until_ledger: u32;
}

/**
 * Storage container for token metadata
 */
export interface Metadata {
  base_uri: string;
  name: string;
  symbol: string;
}

/**
 * Storage keys for the data associated with `NonFungibleToken`
 */
export type NFTStorageKey =
  | { tag: "Owner"; values: readonly [u32] }
  | { tag: "Balance"; values: readonly [string] }
  | { tag: "Approval"; values: readonly [u32] }
  | { tag: "ApprovalForAll"; values: readonly [string, string] }
  | { tag: "Metadata"; values: void };

export type NFTSequentialStorageKey = { tag: "TokenIdCounter"; values: void };

export const NonFungibleTokenError = {
  /**
   * Indicates a non-existent `token_id`.
   */
  200: { message: "NonExistentToken" },
  /**
   * Indicates an error related to the ownership over a particular token.
   * Used in transfers.
   */
  201: { message: "IncorrectOwner" },
  /**
   * Indicates a failure with the `operator`s approval. Used in transfers.
   */
  202: { message: "InsufficientApproval" },
  /**
   * Indicates a failure with the `approver` of a token to be approved. Used
   * in approvals.
   */
  203: { message: "InvalidApprover" },
  /**
   * Indicates an invalid value for `live_until_ledger` when setting
   * approvals.
   */
  204: { message: "InvalidLiveUntilLedger" },
  /**
   * Indicates overflow when adding two values
   */
  205: { message: "MathOverflow" },
  /**
   * Indicates all possible `token_id`s are already in use.
   */
  206: { message: "TokenIDsAreDepleted" },
  /**
   * Indicates an invalid amount to batch mint in `consecutive` extension.
   */
  207: { message: "InvalidAmount" },
  /**
   * Indicates the token does not exist in owner's list.
   */
  208: { message: "TokenNotFoundInOwnerList" },
  /**
   * Indicates the token does not exist in global list.
   */
  209: { message: "TokenNotFoundInGlobalList" },
  /**
   * Indicates access to unset metadata.
   */
  210: { message: "UnsetMetadata" },
  /**
   * Indicates the length of the base URI exceeds the maximum allowed.
   */
  211: { message: "BaseUriMaxLenExceeded" },
  /**
   * Indicates the royalty amount is higher than 10_000 (100%) basis points.
   */
  212: { message: "InvalidRoyaltyAmount" },
};

export interface Client {
  /**
   * Construct and simulate a set_stablecoin transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Sets a new stablecoin address. Only the contract owner can call this function.
   */
  set_stablecoin: (
    { stablecoin }: { stablecoin: string },
    options?: {
      /**
       * The fee to pay for the transaction. Default: BASE_FEE
       */
      fee?: number;

      /**
       * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
       */
      timeoutInSeconds?: number;

      /**
       * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
       */
      simulate?: boolean;
    }
  ) => Promise<AssembledTransaction<null>>;

  /**
   * Construct and simulate a create_investor transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Creates a new investor.
   * Function called from the backend when a user creates a profile on the Minah platform
   * # Arguments
   * * `newInvestor` : the fireblocks address generated for the new user. To store in the backend.
   */
  create_investor: (
    { new_investor }: { new_investor: string },
    options?: {
      /**
       * The fee to pay for the transaction. Default: BASE_FEE
       */
      fee?: number;

      /**
       * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
       */
      timeoutInSeconds?: number;

      /**
       * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
       */
      simulate?: boolean;
    }
  ) => Promise<AssembledTransaction<null>>;

  /**
   * Construct and simulate a mint transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Mints a new NFT to the specified address.
   */
  mint: (
    { user, amount }: { user: string; amount: u32 },
    options?: {
      /**
       * The fee to pay for the transaction. Default: BASE_FEE
       */
      fee?: number;

      /**
       * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
       */
      timeoutInSeconds?: number;

      /**
       * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
       */
      simulate?: boolean;
    }
  ) => Promise<AssembledTransaction<null>>;

  /**
   * Construct and simulate a start_chronometer transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Start the chronometer for ROI distribution
   */
  start_chronometer: (options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<null>>;

  /**
   * Construct and simulate a calculate_amount_to_release transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Calculate amount to release for a given percentage
   * Function to know how much to approve() on the STABLECOIN smart contract before releasing the amount to all investors.
   * Arguments:
   * * `percentage`: the percentage of ROI to be released for the current stage.(Scaled by 10_000_000 to handle decimal percentages)
   */
  calculate_amount_to_release: (
    { percent }: { percent: i128 },
    options?: {
      /**
       * The fee to pay for the transaction. Default: BASE_FEE
       */
      fee?: number;

      /**
       * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
       */
      timeoutInSeconds?: number;

      /**
       * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
       */
      simulate?: boolean;
    }
  ) => Promise<AssembledTransaction<i128>>;

  /**
   * Construct and simulate a release_distribution transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Releases the distribution for the current stage.
   * This function needs to be called by the owner at the end of every distribution period/stage to trigger the current release and next stage.
   */
  release_distribution: (options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<null>>;

  /**
   * Construct and simulate a is_investor transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Check if an address is an investor
   */
  is_investor: (
    { investor }: { investor: string },
    options?: {
      /**
       * The fee to pay for the transaction. Default: BASE_FEE
       */
      fee?: number;

      /**
       * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
       */
      timeoutInSeconds?: number;

      /**
       * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
       */
      simulate?: boolean;
    }
  ) => Promise<AssembledTransaction<boolean>>;

  /**
   * Construct and simulate a get_investors_array_length transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get investors array length
   */
  get_investors_array_length: (options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<u32>>;

  /**
   * Construct and simulate a get_stablecoin transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Returns the address of the stablecoin used for investments.
   */
  get_stablecoin: (options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<string>>;

  /**
   * Construct and simulate a get_receiver transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Returns the address of the receiver.
   */
  get_receiver: (options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<string>>;

  /**
   * Construct and simulate a get_begin_date transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Returns the start time of the chronometer.
   */
  get_begin_date: (options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<u64>>;

  /**
   * Construct and simulate a is_chronometer_started transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Returns whether the chronometer has started.
   */
  is_chronometer_started: (options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<boolean>>;

  /**
   * Construct and simulate a get_payer transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Returns the address of the payer.
   */
  get_payer: (options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<string>>;

  /**
   * Construct and simulate a see_claimed_amount transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get claimed amount for an investor
   */
  see_claimed_amount: (
    { investor }: { investor: string },
    options?: {
      /**
       * The fee to pay for the transaction. Default: BASE_FEE
       */
      fee?: number;

      /**
       * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
       */
      timeoutInSeconds?: number;

      /**
       * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
       */
      simulate?: boolean;
    }
  ) => Promise<AssembledTransaction<i128>>;

  /**
   * Construct and simulate a get_current_supply transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get current supply
   */
  get_current_supply: (options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<u32>>;

  /**
   * Construct and simulate a get_current_state transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get current state
   */
  get_current_state: (options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<InvestmentStatus>>;

  /**
   * Construct and simulate a get_nft_price transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get NFT PRICE
   */
  get_nft_price: (options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<i128>>;

  /**
   * Construct and simulate a get_total_supply transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get total supply
   */
  get_total_supply: (options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<u32>>;

  /**
   * Construct and simulate a get_min_nfts_to_mint transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get minimum nfts to mint
   */
  get_min_nfts_to_mint: (options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<u32>>;

  /**
   * Construct and simulate a get_max_nfts_per_investor transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get maximum nfts per investor
   */
  get_max_nfts_per_investor: (options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<u32>>;

  /**
   * Construct and simulate a get_nft_buying_phase_supply transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get nft buying phase supply
   */
  get_nft_buying_phase_supply: (options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<u32>>;

  /**
   * Construct and simulate a get_distribution_intervals transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get distribution intervals array
   */
  get_distribution_intervals: (options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Array<u64>>>;

  /**
   * Construct and simulate a get_roi_percentages transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get ROI percentages array
   */
  get_roi_percentages: (options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Array<i128>>>;

  /**
   * Construct and simulate a get_buying_phase_nft_supply transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get buying phase nft supply
   */
  get_buying_phase_nft_supply: (options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<u32>>;

  /**
   * Construct and simulate a buy_tokens transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  buy_tokens: (
    {
      from,
      to,
      token_ids,
    }: { from: string; to: string; token_ids: Array<u32> },
    options?: {
      /**
       * The fee to pay for the transaction. Default: BASE_FEE
       */
      fee?: number;

      /**
       * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
       */
      timeoutInSeconds?: number;

      /**
       * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
       */
      simulate?: boolean;
    }
  ) => Promise<AssembledTransaction<null>>;

  /**
   * Construct and simulate a sell_tokens transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  sell_tokens: (
    {
      from,
      to,
      token_ids,
    }: { from: string; to: string; token_ids: Array<u32> },
    options?: {
      /**
       * The fee to pay for the transaction. Default: BASE_FEE
       */
      fee?: number;

      /**
       * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
       */
      timeoutInSeconds?: number;

      /**
       * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
       */
      simulate?: boolean;
    }
  ) => Promise<AssembledTransaction<null>>;

  /**
   * Construct and simulate a set_receiver transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Sets a new receiver address. Only the contract owner can call this function.
   */
  set_receiver: (
    { receiver }: { receiver: string },
    options?: {
      /**
       * The fee to pay for the transaction. Default: BASE_FEE
       */
      fee?: number;

      /**
       * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
       */
      timeoutInSeconds?: number;

      /**
       * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
       */
      simulate?: boolean;
    }
  ) => Promise<AssembledTransaction<null>>;

  /**
   * Construct and simulate a set_payer transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Sets a new payer address. Only the contract owner can call this function.
   */
  set_payer: (
    { payer }: { payer: string },
    options?: {
      /**
       * The fee to pay for the transaction. Default: BASE_FEE
       */
      fee?: number;

      /**
       * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
       */
      timeoutInSeconds?: number;

      /**
       * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
       */
      simulate?: boolean;
    }
  ) => Promise<AssembledTransaction<null>>;

  /**
   * Construct and simulate a hello transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  hello: (
    { to }: { to: string },
    options?: {
      /**
       * The fee to pay for the transaction. Default: BASE_FEE
       */
      fee?: number;

      /**
       * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
       */
      timeoutInSeconds?: number;

      /**
       * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
       */
      simulate?: boolean;
    }
  ) => Promise<AssembledTransaction<Array<string>>>;

  /**
   * Construct and simulate a transfer transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  transfer: (
    { _from, _to, _token_id }: { _from: string; _to: string; _token_id: u32 },
    options?: {
      /**
       * The fee to pay for the transaction. Default: BASE_FEE
       */
      fee?: number;

      /**
       * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
       */
      timeoutInSeconds?: number;

      /**
       * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
       */
      simulate?: boolean;
    }
  ) => Promise<AssembledTransaction<null>>;

  /**
   * Construct and simulate a transfer_from transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  transfer_from: (
    {
      _spender,
      _from,
      _to,
      _token_id,
    }: { _spender: string; _from: string; _to: string; _token_id: u32 },
    options?: {
      /**
       * The fee to pay for the transaction. Default: BASE_FEE
       */
      fee?: number;

      /**
       * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
       */
      timeoutInSeconds?: number;

      /**
       * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
       */
      simulate?: boolean;
    }
  ) => Promise<AssembledTransaction<null>>;

  /**
   * Construct and simulate a balance transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  balance: (
    { account }: { account: string },
    options?: {
      /**
       * The fee to pay for the transaction. Default: BASE_FEE
       */
      fee?: number;

      /**
       * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
       */
      timeoutInSeconds?: number;

      /**
       * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
       */
      simulate?: boolean;
    }
  ) => Promise<AssembledTransaction<u32>>;

  /**
   * Construct and simulate a owner_of transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  owner_of: (
    { token_id }: { token_id: u32 },
    options?: {
      /**
       * The fee to pay for the transaction. Default: BASE_FEE
       */
      fee?: number;

      /**
       * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
       */
      timeoutInSeconds?: number;

      /**
       * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
       */
      simulate?: boolean;
    }
  ) => Promise<AssembledTransaction<string>>;

  /**
   * Construct and simulate a approve transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  approve: (
    {
      approver,
      approved,
      token_id,
      live_until_ledger,
    }: {
      approver: string;
      approved: string;
      token_id: u32;
      live_until_ledger: u32;
    },
    options?: {
      /**
       * The fee to pay for the transaction. Default: BASE_FEE
       */
      fee?: number;

      /**
       * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
       */
      timeoutInSeconds?: number;

      /**
       * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
       */
      simulate?: boolean;
    }
  ) => Promise<AssembledTransaction<null>>;

  /**
   * Construct and simulate a approve_for_all transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  approve_for_all: (
    {
      owner,
      operator,
      live_until_ledger,
    }: { owner: string; operator: string; live_until_ledger: u32 },
    options?: {
      /**
       * The fee to pay for the transaction. Default: BASE_FEE
       */
      fee?: number;

      /**
       * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
       */
      timeoutInSeconds?: number;

      /**
       * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
       */
      simulate?: boolean;
    }
  ) => Promise<AssembledTransaction<null>>;

  /**
   * Construct and simulate a get_approved transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_approved: (
    { token_id }: { token_id: u32 },
    options?: {
      /**
       * The fee to pay for the transaction. Default: BASE_FEE
       */
      fee?: number;

      /**
       * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
       */
      timeoutInSeconds?: number;

      /**
       * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
       */
      simulate?: boolean;
    }
  ) => Promise<AssembledTransaction<Option<string>>>;

  /**
   * Construct and simulate a is_approved_for_all transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  is_approved_for_all: (
    { owner, operator }: { owner: string; operator: string },
    options?: {
      /**
       * The fee to pay for the transaction. Default: BASE_FEE
       */
      fee?: number;

      /**
       * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
       */
      timeoutInSeconds?: number;

      /**
       * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
       */
      simulate?: boolean;
    }
  ) => Promise<AssembledTransaction<boolean>>;

  /**
   * Construct and simulate a token_uri transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  token_uri: (
    { token_id }: { token_id: u32 },
    options?: {
      /**
       * The fee to pay for the transaction. Default: BASE_FEE
       */
      fee?: number;

      /**
       * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
       */
      timeoutInSeconds?: number;

      /**
       * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
       */
      simulate?: boolean;
    }
  ) => Promise<AssembledTransaction<string>>;

  /**
   * Construct and simulate a name transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  name: (options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<string>>;

  /**
   * Construct and simulate a symbol transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  symbol: (options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<string>>;

  /**
   * Construct and simulate a get_owner transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_owner: (options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Option<string>>>;

  /**
   * Construct and simulate a transfer_ownership transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  transfer_ownership: (
    {
      new_owner,
      live_until_ledger,
    }: { new_owner: string; live_until_ledger: u32 },
    options?: {
      /**
       * The fee to pay for the transaction. Default: BASE_FEE
       */
      fee?: number;

      /**
       * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
       */
      timeoutInSeconds?: number;

      /**
       * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
       */
      simulate?: boolean;
    }
  ) => Promise<AssembledTransaction<null>>;

  /**
   * Construct and simulate a accept_ownership transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  accept_ownership: (options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<null>>;

  /**
   * Construct and simulate a renounce_ownership transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  renounce_ownership: (options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<null>>;
}
export class Client extends ContractClient {
  static async deploy<T = Client>(
    /** Constructor/Initialization Args for the contract's `__constructor` method */
    {
      owner,
      stablecoin,
      receiver,
      payer,
      price,
      total_supply,
      min_nfts_to_mint,
      max_nfts_per_investor,
      distribution_intervals,
      roi_percentages,
    }: {
      owner: string;
      stablecoin: string;
      receiver: string;
      payer: string;
      price: i128;
      total_supply: u32;
      min_nfts_to_mint: u32;
      max_nfts_per_investor: u32;
      distribution_intervals: Array<u64>;
      roi_percentages: Array<i128>;
    },
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
    options: MethodOptions &
      Omit<ContractClientOptions, "contractId"> & {
        /** The hash of the Wasm blob, which must already be installed on-chain. */
        wasmHash: Buffer | string;
        /** Salt used to generate the contract's ID. Passed through to {@link Operation.createCustomContract}. Default: random. */
        salt?: Buffer | Uint8Array;
        /** The format used to decode `wasmHash`, if it's provided as a string. */
        format?: "hex" | "base64";
      }
  ): Promise<AssembledTransaction<T>> {
    return ContractClient.deploy(
      {
        owner,
        stablecoin,
        receiver,
        payer,
        price,
        total_supply,
        min_nfts_to_mint,
        max_nfts_per_investor,
        distribution_intervals,
        roi_percentages,
      },
      options
    );
  }
  constructor(public readonly options: ContractClientOptions) {
    super(
      new ContractSpec([
        "AAAAAwAAAAAAAAAAAAAAEEludmVzdG1lbnRTdGF0dXMAAAANAAAAAAAAAAtCdXlpbmdQaGFzZQAAAAAAAAAAAAAAABJCZWZvcmVGaXJzdFJlbGVhc2UAAAAAAAEAAAAAAAAACFJlbGVhc2UxAAAAAgAAAAAAAAAIUmVsZWFzZTIAAAADAAAAAAAAAAhSZWxlYXNlMwAAAAQAAAAAAAAACFJlbGVhc2U0AAAABQAAAAAAAAAIUmVsZWFzZTUAAAAGAAAAAAAAAAhSZWxlYXNlNgAAAAcAAAAAAAAACFJlbGVhc2U3AAAACAAAAAAAAAAIUmVsZWFzZTgAAAAJAAAAAAAAAAhSZWxlYXNlOQAAAAoAAAAAAAAACVJlbGVhc2UxMAAAAAAAAAsAAAAAAAAABUVuZGVkAAAAAAAADA==",
        "AAAAAgAAAAAAAAAAAAAAB0RhdGFLZXkAAAAAEgAAAAAAAAAAAAAAClN0YWJsZUNvaW4AAAAAAAAAAAAAAAAADUN1cnJlbnRTdXBwbHkAAAAAAAAAAAAAAAAAAAlCZWdpbkRhdGUAAAAAAAAAAAAAAAAAAB5BbW91bnRUb1JlbGVhc2VGb3JDdXJyZW50U3RhZ2UAAAAAAAAAAAAAAAAACFJlY2VpdmVyAAAAAAAAAAAAAAAFUGF5ZXIAAAAAAAAAAAAAAAAAAA5JbnZlc3RvcnNBcnJheQAAAAAAAAAAAAAAAAAOQ291bnRkb3duU3RhcnQAAAAAAAAAAAAAAAAABVN0YXRlAAAAAAAAAQAAAAAAAAAISW52ZXN0b3IAAAABAAAAEwAAAAEAAAAAAAAADUNsYWltZWRBbW91bnQAAAAAAAABAAAAEwAAAAAAAAAAAAAAFURpc3RyaWJ1dGlvbkludGVydmFscwAAAAAAAAAAAAAAAAAADlJPSVBlcmNlbnRhZ2VzAAAAAAAAAAAAAAAAAAVQcmljZQAAAAAAAAAAAAAAAAAADU1pbk5GVHNUb01pbnQAAAAAAAAAAAAAAAAAABJNYXhORlRzUGVySW52ZXN0b3IAAAAAAAAAAAAAAAAAC1RvdGFsU3VwcGx5AAAAAAAAAAAAAAAAFE5GVEJ1eWluZ1BoYXNlU3VwcGx5",
        "AAAAAAAAAF5UaGVyZSBpcyBhIGxpbWl0YXRpb24gb2YgbWF4IDEwIHBhcmFtcyBieSB0aGUgc29yb2JhbiBjb250cmFjdApJbml0aWFsaXplcyB0aGUgTWluYWggY29udHJhY3QuAAAAAAANX19jb25zdHJ1Y3RvcgAAAAAAAAoAAAAAAAAABW93bmVyAAAAAAAAEwAAAAAAAAAKc3RhYmxlY29pbgAAAAAAEwAAAAAAAAAIcmVjZWl2ZXIAAAATAAAAAAAAAAVwYXllcgAAAAAAABMAAAAAAAAABXByaWNlAAAAAAAACwAAAAAAAAAMdG90YWxfc3VwcGx5AAAABAAAAAAAAAAQbWluX25mdHNfdG9fbWludAAAAAQAAAAAAAAAFW1heF9uZnRzX3Blcl9pbnZlc3RvcgAAAAAAAAQAAAAAAAAAFmRpc3RyaWJ1dGlvbl9pbnRlcnZhbHMAAAAAA+oAAAAGAAAAAAAAAA9yb2lfcGVyY2VudGFnZXMAAAAD6gAAAAsAAAAA",
        "AAAAAAAAAE5TZXRzIGEgbmV3IHN0YWJsZWNvaW4gYWRkcmVzcy4gT25seSB0aGUgY29udHJhY3Qgb3duZXIgY2FuIGNhbGwgdGhpcyBmdW5jdGlvbi4AAAAAAA5zZXRfc3RhYmxlY29pbgAAAAAAAQAAAAAAAAAKc3RhYmxlY29pbgAAAAAAEwAAAAA=",
        "AAAAAAAAANZDcmVhdGVzIGEgbmV3IGludmVzdG9yLgpGdW5jdGlvbiBjYWxsZWQgZnJvbSB0aGUgYmFja2VuZCB3aGVuIGEgdXNlciBjcmVhdGVzIGEgcHJvZmlsZSBvbiB0aGUgTWluYWggcGxhdGZvcm0KIyBBcmd1bWVudHMKKiBgbmV3SW52ZXN0b3JgIDogdGhlIGZpcmVibG9ja3MgYWRkcmVzcyBnZW5lcmF0ZWQgZm9yIHRoZSBuZXcgdXNlci4gVG8gc3RvcmUgaW4gdGhlIGJhY2tlbmQuAAAAAAAPY3JlYXRlX2ludmVzdG9yAAAAAAEAAAAAAAAADG5ld19pbnZlc3RvcgAAABMAAAAA",
        "AAAAAAAAAClNaW50cyBhIG5ldyBORlQgdG8gdGhlIHNwZWNpZmllZCBhZGRyZXNzLgAAAAAAAARtaW50AAAAAgAAAAAAAAAEdXNlcgAAABMAAAAAAAAABmFtb3VudAAAAAAABAAAAAA=",
        "AAAAAAAAACpTdGFydCB0aGUgY2hyb25vbWV0ZXIgZm9yIFJPSSBkaXN0cmlidXRpb24AAAAAABFzdGFydF9jaHJvbm9tZXRlcgAAAAAAAAAAAAAA",
        "AAAAAAAAATNDYWxjdWxhdGUgYW1vdW50IHRvIHJlbGVhc2UgZm9yIGEgZ2l2ZW4gcGVyY2VudGFnZQpGdW5jdGlvbiB0byBrbm93IGhvdyBtdWNoIHRvIGFwcHJvdmUoKSBvbiB0aGUgU1RBQkxFQ09JTiBzbWFydCBjb250cmFjdCBiZWZvcmUgcmVsZWFzaW5nIHRoZSBhbW91bnQgdG8gYWxsIGludmVzdG9ycy4KQXJndW1lbnRzOgoqIGBwZXJjZW50YWdlYDogdGhlIHBlcmNlbnRhZ2Ugb2YgUk9JIHRvIGJlIHJlbGVhc2VkIGZvciB0aGUgY3VycmVudCBzdGFnZS4oU2NhbGVkIGJ5IDEwXzAwMF8wMDAgdG8gaGFuZGxlIGRlY2ltYWwgcGVyY2VudGFnZXMpAAAAABtjYWxjdWxhdGVfYW1vdW50X3RvX3JlbGVhc2UAAAAAAQAAAAAAAAAHcGVyY2VudAAAAAALAAAAAQAAAAs=",
        "AAAAAAAAALtSZWxlYXNlcyB0aGUgZGlzdHJpYnV0aW9uIGZvciB0aGUgY3VycmVudCBzdGFnZS4KVGhpcyBmdW5jdGlvbiBuZWVkcyB0byBiZSBjYWxsZWQgYnkgdGhlIG93bmVyIGF0IHRoZSBlbmQgb2YgZXZlcnkgZGlzdHJpYnV0aW9uIHBlcmlvZC9zdGFnZSB0byB0cmlnZ2VyIHRoZSBjdXJyZW50IHJlbGVhc2UgYW5kIG5leHQgc3RhZ2UuAAAAABRyZWxlYXNlX2Rpc3RyaWJ1dGlvbgAAAAAAAAAA",
        "AAAAAAAAACJDaGVjayBpZiBhbiBhZGRyZXNzIGlzIGFuIGludmVzdG9yAAAAAAALaXNfaW52ZXN0b3IAAAAAAQAAAAAAAAAIaW52ZXN0b3IAAAATAAAAAQAAAAE=",
        "AAAAAAAAABpHZXQgaW52ZXN0b3JzIGFycmF5IGxlbmd0aAAAAAAAGmdldF9pbnZlc3RvcnNfYXJyYXlfbGVuZ3RoAAAAAAAAAAAAAQAAAAQ=",
        "AAAAAAAAADtSZXR1cm5zIHRoZSBhZGRyZXNzIG9mIHRoZSBzdGFibGVjb2luIHVzZWQgZm9yIGludmVzdG1lbnRzLgAAAAAOZ2V0X3N0YWJsZWNvaW4AAAAAAAAAAAABAAAAEw==",
        "AAAAAAAAACRSZXR1cm5zIHRoZSBhZGRyZXNzIG9mIHRoZSByZWNlaXZlci4AAAAMZ2V0X3JlY2VpdmVyAAAAAAAAAAEAAAAT",
        "AAAAAAAAACpSZXR1cm5zIHRoZSBzdGFydCB0aW1lIG9mIHRoZSBjaHJvbm9tZXRlci4AAAAAAA5nZXRfYmVnaW5fZGF0ZQAAAAAAAAAAAAEAAAAG",
        "AAAAAAAAACxSZXR1cm5zIHdoZXRoZXIgdGhlIGNocm9ub21ldGVyIGhhcyBzdGFydGVkLgAAABZpc19jaHJvbm9tZXRlcl9zdGFydGVkAAAAAAAAAAAAAQAAAAE=",
        "AAAAAAAAACFSZXR1cm5zIHRoZSBhZGRyZXNzIG9mIHRoZSBwYXllci4AAAAAAAAJZ2V0X3BheWVyAAAAAAAAAAAAAAEAAAAT",
        "AAAAAAAAACJHZXQgY2xhaW1lZCBhbW91bnQgZm9yIGFuIGludmVzdG9yAAAAAAASc2VlX2NsYWltZWRfYW1vdW50AAAAAAABAAAAAAAAAAhpbnZlc3RvcgAAABMAAAABAAAACw==",
        "AAAAAAAAABJHZXQgY3VycmVudCBzdXBwbHkAAAAAABJnZXRfY3VycmVudF9zdXBwbHkAAAAAAAAAAAABAAAABA==",
        "AAAAAAAAABFHZXQgY3VycmVudCBzdGF0ZQAAAAAAABFnZXRfY3VycmVudF9zdGF0ZQAAAAAAAAAAAAABAAAH0AAAABBJbnZlc3RtZW50U3RhdHVz",
        "AAAAAAAAAA1HZXQgTkZUIFBSSUNFAAAAAAAADWdldF9uZnRfcHJpY2UAAAAAAAAAAAAAAQAAAAs=",
        "AAAAAAAAABBHZXQgdG90YWwgc3VwcGx5AAAAEGdldF90b3RhbF9zdXBwbHkAAAAAAAAAAQAAAAQ=",
        "AAAAAAAAABhHZXQgbWluaW11bSBuZnRzIHRvIG1pbnQAAAAUZ2V0X21pbl9uZnRzX3RvX21pbnQAAAAAAAAAAQAAAAQ=",
        "AAAAAAAAAB1HZXQgbWF4aW11bSBuZnRzIHBlciBpbnZlc3RvcgAAAAAAABlnZXRfbWF4X25mdHNfcGVyX2ludmVzdG9yAAAAAAAAAAAAAAEAAAAE",
        "AAAAAAAAABtHZXQgbmZ0IGJ1eWluZyBwaGFzZSBzdXBwbHkAAAAAG2dldF9uZnRfYnV5aW5nX3BoYXNlX3N1cHBseQAAAAAAAAAAAQAAAAQ=",
        "AAAAAAAAACBHZXQgZGlzdHJpYnV0aW9uIGludGVydmFscyBhcnJheQAAABpnZXRfZGlzdHJpYnV0aW9uX2ludGVydmFscwAAAAAAAAAAAAEAAAPqAAAABg==",
        "AAAAAAAAABlHZXQgUk9JIHBlcmNlbnRhZ2VzIGFycmF5AAAAAAAAE2dldF9yb2lfcGVyY2VudGFnZXMAAAAAAAAAAAEAAAPqAAAACw==",
        "AAAAAAAAABtHZXQgYnV5aW5nIHBoYXNlIG5mdCBzdXBwbHkAAAAAG2dldF9idXlpbmdfcGhhc2VfbmZ0X3N1cHBseQAAAAAAAAAAAQAAAAQ=",
        "AAAAAAAAAAAAAAAKYnV5X3Rva2VucwAAAAAAAwAAAAAAAAAEZnJvbQAAABMAAAAAAAAAAnRvAAAAAAATAAAAAAAAAAl0b2tlbl9pZHMAAAAAAAPqAAAABAAAAAA=",
        "AAAAAAAAAAAAAAALc2VsbF90b2tlbnMAAAAAAwAAAAAAAAAEZnJvbQAAABMAAAAAAAAAAnRvAAAAAAATAAAAAAAAAAl0b2tlbl9pZHMAAAAAAAPqAAAABAAAAAA=",
        "AAAAAAAAAExTZXRzIGEgbmV3IHJlY2VpdmVyIGFkZHJlc3MuIE9ubHkgdGhlIGNvbnRyYWN0IG93bmVyIGNhbiBjYWxsIHRoaXMgZnVuY3Rpb24uAAAADHNldF9yZWNlaXZlcgAAAAEAAAAAAAAACHJlY2VpdmVyAAAAEwAAAAA=",
        "AAAAAAAAAElTZXRzIGEgbmV3IHBheWVyIGFkZHJlc3MuIE9ubHkgdGhlIGNvbnRyYWN0IG93bmVyIGNhbiBjYWxsIHRoaXMgZnVuY3Rpb24uAAAAAAAACXNldF9wYXllcgAAAAAAAAEAAAAAAAAABXBheWVyAAAAAAAAEwAAAAA=",
        "AAAAAAAAAAAAAAAFaGVsbG8AAAAAAAABAAAAAAAAAAJ0bwAAAAAAEAAAAAEAAAPqAAAAEA==",
        "AAAAAAAAAAAAAAAIdHJhbnNmZXIAAAADAAAAAAAAAAVfZnJvbQAAAAAAABMAAAAAAAAAA190bwAAAAATAAAAAAAAAAlfdG9rZW5faWQAAAAAAAAEAAAAAA==",
        "AAAAAAAAAAAAAAANdHJhbnNmZXJfZnJvbQAAAAAAAAQAAAAAAAAACF9zcGVuZGVyAAAAEwAAAAAAAAAFX2Zyb20AAAAAAAATAAAAAAAAAANfdG8AAAAAEwAAAAAAAAAJX3Rva2VuX2lkAAAAAAAABAAAAAA=",
        "AAAAAAAAAAAAAAAHYmFsYW5jZQAAAAABAAAAAAAAAAdhY2NvdW50AAAAABMAAAABAAAABA==",
        "AAAAAAAAAAAAAAAIb3duZXJfb2YAAAABAAAAAAAAAAh0b2tlbl9pZAAAAAQAAAABAAAAEw==",
        "AAAAAAAAAAAAAAAHYXBwcm92ZQAAAAAEAAAAAAAAAAhhcHByb3ZlcgAAABMAAAAAAAAACGFwcHJvdmVkAAAAEwAAAAAAAAAIdG9rZW5faWQAAAAEAAAAAAAAABFsaXZlX3VudGlsX2xlZGdlcgAAAAAAAAQAAAAA",
        "AAAAAAAAAAAAAAAPYXBwcm92ZV9mb3JfYWxsAAAAAAMAAAAAAAAABW93bmVyAAAAAAAAEwAAAAAAAAAIb3BlcmF0b3IAAAATAAAAAAAAABFsaXZlX3VudGlsX2xlZGdlcgAAAAAAAAQAAAAA",
        "AAAAAAAAAAAAAAAMZ2V0X2FwcHJvdmVkAAAAAQAAAAAAAAAIdG9rZW5faWQAAAAEAAAAAQAAA+gAAAAT",
        "AAAAAAAAAAAAAAATaXNfYXBwcm92ZWRfZm9yX2FsbAAAAAACAAAAAAAAAAVvd25lcgAAAAAAABMAAAAAAAAACG9wZXJhdG9yAAAAEwAAAAEAAAAB",
        "AAAAAAAAAAAAAAAJdG9rZW5fdXJpAAAAAAAAAQAAAAAAAAAIdG9rZW5faWQAAAAEAAAAAQAAABA=",
        "AAAAAAAAAAAAAAAEbmFtZQAAAAAAAAABAAAAEA==",
        "AAAAAAAAAAAAAAAGc3ltYm9sAAAAAAAAAAAAAQAAABA=",
        "AAAAAAAAAAAAAAAJZ2V0X293bmVyAAAAAAAAAAAAAAEAAAPoAAAAEw==",
        "AAAAAAAAAAAAAAASdHJhbnNmZXJfb3duZXJzaGlwAAAAAAACAAAAAAAAAAluZXdfb3duZXIAAAAAAAATAAAAAAAAABFsaXZlX3VudGlsX2xlZGdlcgAAAAAAAAQAAAAA",
        "AAAAAAAAAAAAAAAQYWNjZXB0X293bmVyc2hpcAAAAAAAAAAA",
        "AAAAAAAAAAAAAAAScmVub3VuY2Vfb3duZXJzaGlwAAAAAAAAAAAAAA==",
        "AAAAAQAAADFTdG9yYWdlIGtleSBmb3IgZW51bWVyYXRpb24gb2YgYWNjb3VudHMgcGVyIHJvbGUuAAAAAAAAAAAAAA5Sb2xlQWNjb3VudEtleQAAAAAAAgAAAAAAAAAFaW5kZXgAAAAAAAAEAAAAAAAAAARyb2xlAAAAEQ==",
        "AAAAAgAAADxTdG9yYWdlIGtleXMgZm9yIHRoZSBkYXRhIGFzc29jaWF0ZWQgd2l0aCB0aGUgYWNjZXNzIGNvbnRyb2wAAAAAAAAAF0FjY2Vzc0NvbnRyb2xTdG9yYWdlS2V5AAAAAAYAAAABAAAAAAAAAAxSb2xlQWNjb3VudHMAAAABAAAH0AAAAA5Sb2xlQWNjb3VudEtleQAAAAAAAQAAAAAAAAAHSGFzUm9sZQAAAAACAAAAEwAAABEAAAABAAAAAAAAABFSb2xlQWNjb3VudHNDb3VudAAAAAAAAAEAAAARAAAAAQAAAAAAAAAJUm9sZUFkbWluAAAAAAAAAQAAABEAAAAAAAAAAAAAAAVBZG1pbgAAAAAAAAAAAAAAAAAADFBlbmRpbmdBZG1pbg==",
        "AAAABAAAAAAAAAAAAAAAEkFjY2Vzc0NvbnRyb2xFcnJvcgAAAAAACQAAAAAAAAAMVW5hdXRob3JpemVkAAAEugAAAAAAAAALQWRtaW5Ob3RTZXQAAAAEuwAAAAAAAAAQSW5kZXhPdXRPZkJvdW5kcwAABLwAAAAAAAAAEUFkbWluUm9sZU5vdEZvdW5kAAAAAAAEvQAAAAAAAAASUm9sZUNvdW50SXNOb3RaZXJvAAAAAAS+AAAAAAAAAAxSb2xlTm90Rm91bmQAAAS/AAAAAAAAAA9BZG1pbkFscmVhZHlTZXQAAAAEwAAAAAAAAAALUm9sZU5vdEhlbGQAAAAEwQAAAAAAAAALUm9sZUlzRW1wdHkAAAAEwg==",
        "AAAAAgAAACNTdG9yYWdlIGtleXMgZm9yIGBPd25hYmxlYCB1dGlsaXR5LgAAAAAAAAAAEU93bmFibGVTdG9yYWdlS2V5AAAAAAAAAgAAAAAAAAAAAAAABU93bmVyAAAAAAAAAAAAAAAAAAAMUGVuZGluZ093bmVy",
        "AAAABAAAAAAAAAAAAAAADE93bmFibGVFcnJvcgAAAAMAAAAAAAAAC093bmVyTm90U2V0AAAABMQAAAAAAAAAElRyYW5zZmVySW5Qcm9ncmVzcwAAAAAExQAAAAAAAAAPT3duZXJBbHJlYWR5U2V0AAAABMY=",
        "AAAABAAAAAAAAAAAAAAAEVJvbGVUcmFuc2ZlckVycm9yAAAAAAAAAwAAAAAAAAARTm9QZW5kaW5nVHJhbnNmZXIAAAAAAASwAAAAAAAAABZJbnZhbGlkTGl2ZVVudGlsTGVkZ2VyAAAAAASxAAAAAAAAABVJbnZhbGlkUGVuZGluZ0FjY291bnQAAAAAAASy",
        "AAAAAgAAAEFTdG9yYWdlIGtleXMgZm9yIHRoZSBkYXRhIGFzc29jaWF0ZWQgd2l0aCB0aGUgYWxsb3dsaXN0IGV4dGVuc2lvbgAAAAAAAAAAAAATQWxsb3dMaXN0U3RvcmFnZUtleQAAAAABAAAAAQAAACdTdG9yZXMgdGhlIGFsbG93ZWQgc3RhdHVzIG9mIGFuIGFjY291bnQAAAAAB0FsbG93ZWQAAAAAAQAAABM=",
        "AAAAAgAAAEFTdG9yYWdlIGtleXMgZm9yIHRoZSBkYXRhIGFzc29jaWF0ZWQgd2l0aCB0aGUgYmxvY2tsaXN0IGV4dGVuc2lvbgAAAAAAAAAAAAATQmxvY2tMaXN0U3RvcmFnZUtleQAAAAABAAAAAQAAACdTdG9yZXMgdGhlIGJsb2NrZWQgc3RhdHVzIG9mIGFuIGFjY291bnQAAAAAB0Jsb2NrZWQAAAAAAQAAABM=",
        "AAAAAQAAACpTdG9yYWdlIGtleSB0aGF0IG1hcHMgdG8gW2BBbGxvd2FuY2VEYXRhYF0AAAAAAAAAAAAMQWxsb3dhbmNlS2V5AAAAAgAAAAAAAAAFb3duZXIAAAAAAAATAAAAAAAAAAdzcGVuZGVyAAAAABM=",
        "AAAAAQAAAINTdG9yYWdlIGNvbnRhaW5lciBmb3IgdGhlIGFtb3VudCBvZiB0b2tlbnMgZm9yIHdoaWNoIGFuIGFsbG93YW5jZSBpcyBncmFudGVkCmFuZCB0aGUgbGVkZ2VyIG51bWJlciBhdCB3aGljaCB0aGlzIGFsbG93YW5jZSBleHBpcmVzLgAAAAAAAAAADUFsbG93YW5jZURhdGEAAAAAAAACAAAAAAAAAAZhbW91bnQAAAAAAAsAAAAAAAAAEWxpdmVfdW50aWxfbGVkZ2VyAAAAAAAABA==",
        "AAAAAgAAADlTdG9yYWdlIGtleXMgZm9yIHRoZSBkYXRhIGFzc29jaWF0ZWQgd2l0aCBgRnVuZ2libGVUb2tlbmAAAAAAAAAAAAAAClN0b3JhZ2VLZXkAAAAAAAMAAAAAAAAAAAAAAAtUb3RhbFN1cHBseQAAAAABAAAAAAAAAAdCYWxhbmNlAAAAAAEAAAATAAAAAQAAAAAAAAAJQWxsb3dhbmNlAAAAAAAAAQAAB9AAAAAMQWxsb3dhbmNlS2V5",
        "AAAAAQAAACRTdG9yYWdlIGNvbnRhaW5lciBmb3IgdG9rZW4gbWV0YWRhdGEAAAAAAAAACE1ldGFkYXRhAAAAAwAAAAAAAAAIZGVjaW1hbHMAAAAEAAAAAAAAAARuYW1lAAAAEAAAAAAAAAAGc3ltYm9sAAAAAAAQ",
        "AAAAAgAAAClTdG9yYWdlIGtleSBmb3IgYWNjZXNzaW5nIHRoZSBTQUMgYWRkcmVzcwAAAAAAAAAAAAAWU0FDQWRtaW5HZW5lcmljRGF0YUtleQAAAAAAAQAAAAAAAAAAAAAAA1NhYwA=",
        "AAAAAgAAAClTdG9yYWdlIGtleSBmb3IgYWNjZXNzaW5nIHRoZSBTQUMgYWRkcmVzcwAAAAAAAAAAAAAWU0FDQWRtaW5XcmFwcGVyRGF0YUtleQAAAAAAAQAAAAAAAAAAAAAAA1NhYwA=",
        "AAAABAAAAAAAAAAAAAAAEkZ1bmdpYmxlVG9rZW5FcnJvcgAAAAAADwAAAG5JbmRpY2F0ZXMgYW4gZXJyb3IgcmVsYXRlZCB0byB0aGUgY3VycmVudCBiYWxhbmNlIG9mIGFjY291bnQgZnJvbSB3aGljaAp0b2tlbnMgYXJlIGV4cGVjdGVkIHRvIGJlIHRyYW5zZmVycmVkLgAAAAAAE0luc3VmZmljaWVudEJhbGFuY2UAAAAAZAAAAGRJbmRpY2F0ZXMgYSBmYWlsdXJlIHdpdGggdGhlIGFsbG93YW5jZSBtZWNoYW5pc20gd2hlbiBhIGdpdmVuIHNwZW5kZXIKZG9lc24ndCBoYXZlIGVub3VnaCBhbGxvd2FuY2UuAAAAFUluc3VmZmljaWVudEFsbG93YW5jZQAAAAAAAGUAAABNSW5kaWNhdGVzIGFuIGludmFsaWQgdmFsdWUgZm9yIGBsaXZlX3VudGlsX2xlZGdlcmAgd2hlbiBzZXR0aW5nIGFuCmFsbG93YW5jZS4AAAAAAAAWSW52YWxpZExpdmVVbnRpbExlZGdlcgAAAAAAZgAAADJJbmRpY2F0ZXMgYW4gZXJyb3Igd2hlbiBhbiBpbnB1dCB0aGF0IG11c3QgYmUgPj0gMAAAAAAADExlc3NUaGFuWmVybwAAAGcAAAApSW5kaWNhdGVzIG92ZXJmbG93IHdoZW4gYWRkaW5nIHR3byB2YWx1ZXMAAAAAAAAMTWF0aE92ZXJmbG93AAAAaAAAACpJbmRpY2F0ZXMgYWNjZXNzIHRvIHVuaW5pdGlhbGl6ZWQgbWV0YWRhdGEAAAAAAA1VbnNldE1ldGFkYXRhAAAAAAAAaQAAAFJJbmRpY2F0ZXMgdGhhdCB0aGUgb3BlcmF0aW9uIHdvdWxkIGhhdmUgY2F1c2VkIGB0b3RhbF9zdXBwbHlgIHRvIGV4Y2VlZAp0aGUgYGNhcGAuAAAAAAALRXhjZWVkZWRDYXAAAAAAagAAADZJbmRpY2F0ZXMgdGhlIHN1cHBsaWVkIGBjYXBgIGlzIG5vdCBhIHZhbGlkIGNhcCB2YWx1ZS4AAAAAAApJbnZhbGlkQ2FwAAAAAABrAAAAHkluZGljYXRlcyB0aGUgQ2FwIHdhcyBub3Qgc2V0LgAAAAAACUNhcE5vdFNldAAAAAAAAGwAAAAmSW5kaWNhdGVzIHRoZSBTQUMgYWRkcmVzcyB3YXMgbm90IHNldC4AAAAAAAlTQUNOb3RTZXQAAAAAAABtAAAAMEluZGljYXRlcyBhIFNBQyBhZGRyZXNzIGRpZmZlcmVudCB0aGFuIGV4cGVjdGVkLgAAABJTQUNBZGRyZXNzTWlzbWF0Y2gAAAAAAG4AAABDSW5kaWNhdGVzIGEgbWlzc2luZyBmdW5jdGlvbiBwYXJhbWV0ZXIgaW4gdGhlIFNBQyBjb250cmFjdCBjb250ZXh0LgAAAAARU0FDTWlzc2luZ0ZuUGFyYW0AAAAAAABvAAAAREluZGljYXRlcyBhbiBpbnZhbGlkIGZ1bmN0aW9uIHBhcmFtZXRlciBpbiB0aGUgU0FDIGNvbnRyYWN0IGNvbnRleHQuAAAAEVNBQ0ludmFsaWRGblBhcmFtAAAAAAAAcAAAADFUaGUgdXNlciBpcyBub3QgYWxsb3dlZCB0byBwZXJmb3JtIHRoaXMgb3BlcmF0aW9uAAAAAAAADlVzZXJOb3RBbGxvd2VkAAAAAABxAAAANVRoZSB1c2VyIGlzIGJsb2NrZWQgYW5kIGNhbm5vdCBwZXJmb3JtIHRoaXMgb3BlcmF0aW9uAAAAAAAAC1VzZXJCbG9ja2VkAAAAAHI=",
        "AAAAAgAAAFlTdG9yYWdlIGtleXMgZm9yIHRoZSBkYXRhIGFzc29jaWF0ZWQgd2l0aCB0aGUgY29uc2VjdXRpdmUgZXh0ZW5zaW9uIG9mCmBOb25GdW5naWJsZVRva2VuYAAAAAAAAAAAAAAYTkZUQ29uc2VjdXRpdmVTdG9yYWdlS2V5AAAABAAAAAEAAAAAAAAACEFwcHJvdmFsAAAAAQAAAAQAAAABAAAAAAAAAAVPd25lcgAAAAAAAAEAAAAEAAAAAQAAAAAAAAAPT3duZXJzaGlwQnVja2V0AAAAAAEAAAAEAAAAAQAAAAAAAAALQnVybmVkVG9rZW4AAAAAAQAAAAQ=",
        "AAAAAQAAAAAAAAAAAAAADk93bmVyVG9rZW5zS2V5AAAAAAACAAAAAAAAAAVpbmRleAAAAAAAAAQAAAAAAAAABW93bmVyAAAAAAAAEw==",
        "AAAAAgAAAFhTdG9yYWdlIGtleXMgZm9yIHRoZSBkYXRhIGFzc29jaWF0ZWQgd2l0aCB0aGUgZW51bWVyYWJsZSBleHRlbnNpb24gb2YKYE5vbkZ1bmdpYmxlVG9rZW5gAAAAAAAAABdORlRFbnVtZXJhYmxlU3RvcmFnZUtleQAAAAAFAAAAAAAAAAAAAAALVG90YWxTdXBwbHkAAAAAAQAAAAAAAAALT3duZXJUb2tlbnMAAAAAAQAAB9AAAAAOT3duZXJUb2tlbnNLZXkAAAAAAAEAAAAAAAAAEE93bmVyVG9rZW5zSW5kZXgAAAABAAAABAAAAAEAAAAAAAAADEdsb2JhbFRva2VucwAAAAEAAAAEAAAAAQAAAAAAAAARR2xvYmFsVG9rZW5zSW5kZXgAAAAAAAABAAAABA==",
        "AAAAAQAAAClTdG9yYWdlIGNvbnRhaW5lciBmb3Igcm95YWx0eSBpbmZvcm1hdGlvbgAAAAAAAAAAAAALUm95YWx0eUluZm8AAAAAAgAAAAAAAAAMYmFzaXNfcG9pbnRzAAAABAAAAAAAAAAIcmVjZWl2ZXIAAAAT",
        "AAAAAgAAAB1TdG9yYWdlIGtleXMgZm9yIHJveWFsdHkgZGF0YQAAAAAAAAAAAAAWTkZUUm95YWx0aWVzU3RvcmFnZUtleQAAAAAAAgAAAAAAAAAAAAAADkRlZmF1bHRSb3lhbHR5AAAAAAABAAAAAAAAAAxUb2tlblJveWFsdHkAAAABAAAABA==",
        "AAAAAQAAAHZTdG9yYWdlIGNvbnRhaW5lciBmb3IgdGhlIHRva2VuIGZvciB3aGljaCBhbiBhcHByb3ZhbCBpcyBncmFudGVkCmFuZCB0aGUgbGVkZ2VyIG51bWJlciBhdCB3aGljaCB0aGlzIGFwcHJvdmFsIGV4cGlyZXMuAAAAAAAAAAAADEFwcHJvdmFsRGF0YQAAAAIAAAAAAAAACGFwcHJvdmVkAAAAEwAAAAAAAAARbGl2ZV91bnRpbF9sZWRnZXIAAAAAAAAE",
        "AAAAAQAAACRTdG9yYWdlIGNvbnRhaW5lciBmb3IgdG9rZW4gbWV0YWRhdGEAAAAAAAAACE1ldGFkYXRhAAAAAwAAAAAAAAAIYmFzZV91cmkAAAAQAAAAAAAAAARuYW1lAAAAEAAAAAAAAAAGc3ltYm9sAAAAAAAQ",
        "AAAAAgAAADxTdG9yYWdlIGtleXMgZm9yIHRoZSBkYXRhIGFzc29jaWF0ZWQgd2l0aCBgTm9uRnVuZ2libGVUb2tlbmAAAAAAAAAADU5GVFN0b3JhZ2VLZXkAAAAAAAAFAAAAAQAAAAAAAAAFT3duZXIAAAAAAAABAAAABAAAAAEAAAAAAAAAB0JhbGFuY2UAAAAAAQAAABMAAAABAAAAAAAAAAhBcHByb3ZhbAAAAAEAAAAEAAAAAQAAAAAAAAAOQXBwcm92YWxGb3JBbGwAAAAAAAIAAAATAAAAEwAAAAAAAAAAAAAACE1ldGFkYXRh",
        "AAAAAgAAAAAAAAAAAAAAF05GVFNlcXVlbnRpYWxTdG9yYWdlS2V5AAAAAAEAAAAAAAAAAAAAAA5Ub2tlbklkQ291bnRlcgAA",
        "AAAABAAAAAAAAAAAAAAAFU5vbkZ1bmdpYmxlVG9rZW5FcnJvcgAAAAAAAA0AAAAkSW5kaWNhdGVzIGEgbm9uLWV4aXN0ZW50IGB0b2tlbl9pZGAuAAAAEE5vbkV4aXN0ZW50VG9rZW4AAADIAAAAV0luZGljYXRlcyBhbiBlcnJvciByZWxhdGVkIHRvIHRoZSBvd25lcnNoaXAgb3ZlciBhIHBhcnRpY3VsYXIgdG9rZW4uClVzZWQgaW4gdHJhbnNmZXJzLgAAAAAOSW5jb3JyZWN0T3duZXIAAAAAAMkAAABFSW5kaWNhdGVzIGEgZmFpbHVyZSB3aXRoIHRoZSBgb3BlcmF0b3JgcyBhcHByb3ZhbC4gVXNlZCBpbiB0cmFuc2ZlcnMuAAAAAAAAFEluc3VmZmljaWVudEFwcHJvdmFsAAAAygAAAFVJbmRpY2F0ZXMgYSBmYWlsdXJlIHdpdGggdGhlIGBhcHByb3ZlcmAgb2YgYSB0b2tlbiB0byBiZSBhcHByb3ZlZC4gVXNlZAppbiBhcHByb3ZhbHMuAAAAAAAAD0ludmFsaWRBcHByb3ZlcgAAAADLAAAASkluZGljYXRlcyBhbiBpbnZhbGlkIHZhbHVlIGZvciBgbGl2ZV91bnRpbF9sZWRnZXJgIHdoZW4gc2V0dGluZwphcHByb3ZhbHMuAAAAAAAWSW52YWxpZExpdmVVbnRpbExlZGdlcgAAAAAAzAAAAClJbmRpY2F0ZXMgb3ZlcmZsb3cgd2hlbiBhZGRpbmcgdHdvIHZhbHVlcwAAAAAAAAxNYXRoT3ZlcmZsb3cAAADNAAAANkluZGljYXRlcyBhbGwgcG9zc2libGUgYHRva2VuX2lkYHMgYXJlIGFscmVhZHkgaW4gdXNlLgAAAAAAE1Rva2VuSURzQXJlRGVwbGV0ZWQAAAAAzgAAAEVJbmRpY2F0ZXMgYW4gaW52YWxpZCBhbW91bnQgdG8gYmF0Y2ggbWludCBpbiBgY29uc2VjdXRpdmVgIGV4dGVuc2lvbi4AAAAAAAANSW52YWxpZEFtb3VudAAAAAAAAM8AAAAzSW5kaWNhdGVzIHRoZSB0b2tlbiBkb2VzIG5vdCBleGlzdCBpbiBvd25lcidzIGxpc3QuAAAAABhUb2tlbk5vdEZvdW5kSW5Pd25lckxpc3QAAADQAAAAMkluZGljYXRlcyB0aGUgdG9rZW4gZG9lcyBub3QgZXhpc3QgaW4gZ2xvYmFsIGxpc3QuAAAAAAAZVG9rZW5Ob3RGb3VuZEluR2xvYmFsTGlzdAAAAAAAANEAAAAjSW5kaWNhdGVzIGFjY2VzcyB0byB1bnNldCBtZXRhZGF0YS4AAAAADVVuc2V0TWV0YWRhdGEAAAAAAADSAAAAQUluZGljYXRlcyB0aGUgbGVuZ3RoIG9mIHRoZSBiYXNlIFVSSSBleGNlZWRzIHRoZSBtYXhpbXVtIGFsbG93ZWQuAAAAAAAAFUJhc2VVcmlNYXhMZW5FeGNlZWRlZAAAAAAAANMAAABHSW5kaWNhdGVzIHRoZSByb3lhbHR5IGFtb3VudCBpcyBoaWdoZXIgdGhhbiAxMF8wMDAgKDEwMCUpIGJhc2lzIHBvaW50cy4AAAAAFEludmFsaWRSb3lhbHR5QW1vdW50AAAA1A==",
      ]),
      options
    );
  }
  public readonly fromJSON = {
    set_stablecoin: this.txFromJSON<null>,
    create_investor: this.txFromJSON<null>,
    mint: this.txFromJSON<null>,
    start_chronometer: this.txFromJSON<null>,
    calculate_amount_to_release: this.txFromJSON<i128>,
    release_distribution: this.txFromJSON<null>,
    is_investor: this.txFromJSON<boolean>,
    get_investors_array_length: this.txFromJSON<u32>,
    get_stablecoin: this.txFromJSON<string>,
    get_receiver: this.txFromJSON<string>,
    get_begin_date: this.txFromJSON<u64>,
    is_chronometer_started: this.txFromJSON<boolean>,
    get_payer: this.txFromJSON<string>,
    see_claimed_amount: this.txFromJSON<i128>,
    get_current_supply: this.txFromJSON<u32>,
    get_current_state: this.txFromJSON<InvestmentStatus>,
    get_nft_price: this.txFromJSON<i128>,
    get_total_supply: this.txFromJSON<u32>,
    get_min_nfts_to_mint: this.txFromJSON<u32>,
    get_max_nfts_per_investor: this.txFromJSON<u32>,
    get_nft_buying_phase_supply: this.txFromJSON<u32>,
    get_distribution_intervals: this.txFromJSON<Array<u64>>,
    get_roi_percentages: this.txFromJSON<Array<i128>>,
    get_buying_phase_nft_supply: this.txFromJSON<u32>,
    buy_tokens: this.txFromJSON<null>,
    sell_tokens: this.txFromJSON<null>,
    set_receiver: this.txFromJSON<null>,
    set_payer: this.txFromJSON<null>,
    hello: this.txFromJSON<Array<string>>,
    transfer: this.txFromJSON<null>,
    transfer_from: this.txFromJSON<null>,
    balance: this.txFromJSON<u32>,
    owner_of: this.txFromJSON<string>,
    approve: this.txFromJSON<null>,
    approve_for_all: this.txFromJSON<null>,
    get_approved: this.txFromJSON<Option<string>>,
    is_approved_for_all: this.txFromJSON<boolean>,
    token_uri: this.txFromJSON<string>,
    name: this.txFromJSON<string>,
    symbol: this.txFromJSON<string>,
    get_owner: this.txFromJSON<Option<string>>,
    transfer_ownership: this.txFromJSON<null>,
    accept_ownership: this.txFromJSON<null>,
    renounce_ownership: this.txFromJSON<null>,
  };
}
