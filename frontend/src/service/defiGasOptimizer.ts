import { request } from '../request';

export interface OptimizeGasParams {
  chainId: string;
  actionType: string;
  strategyType?: string;
  timePreference?: string;
  estimatedValue?: number;
  walletAddress?: string;
}

export interface OptimalGasResult {
  recommendedGasPrice: number;
  estimatedConfirmationTime: number;
  totalCostUSD: number;
  savingsUSD: number;
  confidence: number;
  strategy: string;
  reasons: string[];
}

export interface GasHistoryPoint {
  timestamp: number;
  avgGasPrice: number;
  volume: number;
}

export interface TimeSlotRecommendation {
  hour: number;
  avgGasPrice: number;
  recommendation: 'excellent' | 'good' | 'fair' | 'poor';
  savings: number;
}

export interface GasStrategy {
  recommendedStrategy: string;
  averageGasSpend: number;
  totalTransactions: number;
  mostCommonAction: string;
  tips: string[];
  projectedMonthlySavings: number;
}

export interface ChainComparison {
  chainId: string;
  chainName: string;
  avgGasPrice: number;
  costForSwap: number;
  recommendation: string;
}

export interface GasComparison {
  chains: ChainComparison[];
  bestChain: string;
  savings: number;
}

export const defiGasOptimizer = {
  // Optimize gas for a specific action
  optimizeGas: (params: OptimizeGasParams) =>
    request.post<OptimalGasResult>('/defi-gas-optimizer/optimize', params),

  // Get gas price history
  getGasHistory: (chainId: string, days?: number, actionType?: string) =>
    request.get<GasHistoryPoint[]>('/defi-gas-optimizer/history', {
      params: { chainId, days, actionType },
    }),

  // Get optimal time slots
  getOptimalTime: (chainId: string, hoursAhead?: number) =>
    request.get<TimeSlotRecommendation[]>('/defi-gas-optimizer/optimal-time', {
      params: { chainId, hoursAhead },
    }),

  // Get personalized gas strategy
  getGasStrategy: (walletAddress: string, chainId: string) =>
    request.post<GasStrategy>('/defi-gas-optimizer/strategy', {
      walletAddress,
      chainId,
    }),

  // Compare gas costs across chains
  getGasComparison: () =>
    request.get<GasComparison>('/defi-gas-optimizer/compare'),
};
