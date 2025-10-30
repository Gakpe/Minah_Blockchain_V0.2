// Type definitions for API responses and requests

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface CreateInvestorRequest {
  walletAddress: string;
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
  walletAddress: string;
  creationTransactionHash?: string;
  balanceNFT: string;
  createdAt: string;
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
