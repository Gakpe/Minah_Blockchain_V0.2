import mongoose, { Document, Schema } from "mongoose";

export interface IInvestor extends Document {
  autoFuel?: boolean;
  walletAddress?: string;
  InternalwalletAddress?: string;
  vaultID?: string;
  issuer?: string;
  nationality?: string;
  first_name?: string;
  last_name?: string;
  address?: string;
  profilePicture?: string;
  email?: string;
  investor?: boolean;
  loginCount?: number;
  accountVerified?: boolean;
  totalAmountInvested?: number;
  amountInvested?: Array<{
    amount: string;
    timestamp: Date;
  }>;
  lastLoginAt?: Date;
  createdAt?: Date;
}

export interface IVault extends Document {
  walletAddress?: string;
  InternalwalletAddress?: string;
  vaultID?: string;
  assetID?: string;
  name?: string;
  vaultAddress?: string;
}

const InvestorSchema: Schema = new Schema({
  autoFuel: {
    type: Boolean,
    required: false,
  },
  walletAddress: {
    type: String,
    required: false,
  },
  InternalwalletAddress: {
    type: String,
    required: false,
  },
  vaultID: {
    type: String,
  },
  issuer: {
    type: String,
  },
  nationality: {
    type: String,
  },
  first_name: {
    type: String,
  },
  last_name: {
    type: String,
  },
  address: {
    type: String,
  },
  profilePicture: {
    type: String,
  },
  email: {
    type: String,
  },
  investor: {
    type: Boolean,
  },
  loginCount: {
    type: Number,
  },
  accountVerified: {
    type: Boolean,
  },
  totalAmountInvested: {
    type: Number,
  },
  amountInvested: [{
    amount: {
      type: String,
    },
    timestamp: {
      type: Date,
    }
  }],
  lastLoginAt: {
    type: Date,
  },
  createdAt: {
    type: Date,
  }
});

const VaultSchema: Schema = new Schema({
  walletAddress: {
    type: String,
    required: false,
  },
  InternalwalletAddress: {
    type: String,
    required: false,
  },
  vaultID: {
    type: String,
  },
  assetID: {
    type: String,
  },
  name: {
    type: String,
  },
  vaultAddress: {
    type: String,
  }
});

export const Investor = mongoose.model<IInvestor>("Investor", InvestorSchema);
export const Vault = mongoose.model<IVault>("vaults", VaultSchema);
