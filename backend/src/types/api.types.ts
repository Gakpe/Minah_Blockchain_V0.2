// Type definitions for API responses and requests

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface CreateInvestorRequest {
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

export interface CreateVaultRequest {
  walletAddress?: string;
  InternalwalletAddress?: string;
  vaultID?: string;
  assetID?: string;
  name?: string;
  vaultAddress?: string;
}

export interface InvestorResponse {
  id: string;
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

export interface VaultResponse {
  id: string;
  walletAddress?: string;
  InternalwalletAddress?: string;
  vaultID?: string;
  assetID?: string;
  name?: string;
  vaultAddress?: string;
}

export interface CreateInvestorResponse {
  investor: InvestorResponse;
  transactionHash?: string;
}

export interface GetAllInvestorsResponse {
  investors: InvestorResponse[];
  count: number;
}

export interface GetInvestorCountResponse {
  count: number;
}

export interface GetInvestmentStateResponse {
  state: number;
  stateName: string;
}

export interface CreateVaultResponse {
  vault: VaultResponse;
}

export interface HealthCheckResponse {
  status: string;
  timestamp: string;
}
