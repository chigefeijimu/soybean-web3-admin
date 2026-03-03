// DTOs for DeFi Integration Hub

export interface PositionDto {
  address: string;
  protocol: string;
  chain: string;
  positionType: string;
  tokens: string[];
  depositedAmount?: string;
  currentValue?: number;
  apy?: number;
}

export interface PortfolioSummaryDto {
  address: string;
  totalValue: number;
  change24h: number;
  positionsByProtocol: Record<string, number>;
  positionsByChain: Record<string, number>;
  riskScore: number;
  weightedApy: number;
}

export interface ProtocolInteractionDto {
  address: string;
  protocol: string;
  chain: string;
  action: 'deposit' | 'withdraw' | 'swap' | 'stake' | 'unstake' | 'claim';
  tokens: string[];
  amounts: string[];
  slippage?: number;
}

export interface RebalanceDto {
  address: string;
  targetAllocation: Record<string, number>;
  targetChainAllocation?: Record<string, number>;
  includeBridge?: boolean;
}

export interface YieldOpportunityDto {
  protocol: string;
  chain: string;
  poolId: string;
  tokens: string[];
  apy: number;
  tvl: number;
  riskLevel: 'low' | 'medium' | 'high';
  volume24h: number;
}

export interface PositionHistoryDto {
  positionId: string;
  protocol: string;
  chain: string;
  action: string;
  tokens: string[];
  amounts: string[];
  usdValue: number;
  timestamp: Date;
  txHash: string;
}

export interface PortfolioHealthDto {
  address: string;
  healthScore: number;
  grade: string;
  diversificationScore: number;
  concentrationRisk: number;
  liquidityScore: number;
  riskFactors: string[];
  recommendations: string[];
}
