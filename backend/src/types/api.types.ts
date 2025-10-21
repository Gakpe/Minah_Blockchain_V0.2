// Type definitions for API responses and requests

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface CreateInvestorRequest {
  stellarAddress: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  country?: string;
}

export interface InvestorResponse {
  id: string;
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

export interface CreateInvestorResponse {
  investor: InvestorResponse;
  transactionHash: string;
}

export interface HealthCheckResponse {
  status: string;
  timestamp: string;
}
