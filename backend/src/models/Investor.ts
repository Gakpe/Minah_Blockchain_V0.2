import mongoose, { Document, Schema } from "mongoose";

export interface IInvestor extends Document {
  stellarAddress: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  country?: string;
  kycStatus: "pending" | "approved" | "rejected";
  nftBalance: number;
  totalInvested: number;
  claimedAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

const InvestorSchema: Schema = new Schema(
  {
    stellarAddress: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    phoneNumber: {
      type: String,
      trim: true,
    },
    country: {
      type: String,
      trim: true,
    },
    kycStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    nftBalance: {
      type: Number,
      default: 0,
    },
    totalInvested: {
      type: Number,
      default: 0,
    },
    claimedAmount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
InvestorSchema.index({ email: 1 });
InvestorSchema.index({ stellarAddress: 1 });

export const Investor = mongoose.model<IInvestor>("Investor", InvestorSchema);
