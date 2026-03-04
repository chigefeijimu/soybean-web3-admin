import { request } from '@/service/request';

export interface CalculateRiskAdjustedParams {
  protocol: string;
  chain: string;
  token0: string;
  token1: string;
  amount: number;
  duration?: number;
}

export interface PoolData {
  tvl: number;
  apy: number;
  volume24h: number;
  fees24h: number;
}

export interface ImpermanentLoss {
  value: number;
  percentage: number;
  severity: 'MINIMAL' | 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface GasCost {
  value: number;
  currency: string;
}

export interface Returns {
  gross: number;
  net: number;
  netApy: number;
}

export interface RiskMetrics {
  volatility: number;
  sharpeRatio: number;
  sortinoRatio: number;
  maxDrawdown: number;
  riskLevel: 'VERY_LOW' | 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface RiskAdjustedResult {
  protocol: string;
  chain: string;
  token0: string;
  token1: string;
  amount: number;
  duration: number;
  poolData: PoolData;
  impermanentLoss: ImpermanentLoss;
  gasCost: GasCost;
  returns: Returns;
  riskMetrics: RiskMetrics;
  riskAdjustedScore: number;
  rank: 'S' | 'A+' | 'A' | 'B+' | 'B' | 'C' | 'D';
  recommendation: string;
  confidence: number;
}

export interface Protocol {
  id: string;
  name: string;
  chains: string[];
}

export interface Chain {
  id: string;
  name: string;
  icon: string;
}

export const defiRiskAdjustedReturns = {
  calculate(params: CalculateRiskAdjustedParams) {
    return request.post<RiskAdjustedResult>('/defi-risk-adjusted-returns/calculate', params);
  },

  compare(pools: CalculateRiskAdjustedParams[]) {
    return request.post<RiskAdjustedResult[]>('/defi-risk-adjusted-returns/compare', pools);
  },

  getProtocols() {
    return request.get<Protocol[]>('/defi-risk-adjusted-returns/protocols');
  },

  getChains() {
    return request.get<Chain[]>('/defi-risk-adjusted-returns/chains');
  },
};
