import { request } from '@/service/request';

export interface DcaStrategy {
  id: string;
  userAddress: string;
  fromToken: string;
  toToken: string;
  chain: string;
  amountPerPurchase: number;
  frequency: 'hourly' | 'daily' | 'weekly' | 'biweekly' | 'monthly';
  totalPurchases: number;
  completedPurchases: number;
  nextPurchaseTime: string;
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  startDate: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DcaPosition {
  id: string;
  strategyId: string;
  userAddress: string;
  token: string;
  chain: string;
  totalAmount: number;
  averagePrice: number;
  currentPrice: number;
  pnl: number;
  pnlPercentage: number;
  purchaseHistory: Array<{
    timestamp: string;
    amount: number;
    price: number;
    txHash: string;
  }>;
}

export interface DcaOpportunity {
  fromToken: string;
  toToken: string;
  chain: string;
  fromTokenSymbol: string;
  toTokenSymbol: string;
  currentPrice: number;
  avgPrice7d: number;
  avgPrice30d: number;
  volatility: number;
  trend: 'bullish' | 'bearish' | 'neutral';
  apy: number;
  risk: 'low' | 'medium' | 'high';
  confidence: number;
}

export interface DcaStatistics {
  totalStrategies: number;
  activeStrategies: number;
  totalInvested: number;
  totalValue: number;
  totalPnL: number;
  totalPnLPercentage: number;
  averageApy: number;
  chainDistribution: Record<string, number>;
  tokenDistribution: Record<string, number>;
}

export interface CreateStrategyDto {
  userAddress: string;
  fromToken: string;
  toToken: string;
  chain: string;
  amountPerPurchase: number;
  frequency: 'hourly' | 'daily' | 'weekly' | 'biweekly' | 'monthly';
  totalPurchases: number;
  startDate: string;
  endDate?: string;
}

export const dcaBot = {
  // Get user's strategies
  getStrategies: (address: string) => 
    request.get<{ strategies: DcaStrategy[] }>(`/api/dca-bot/strategies/${address}`),

  // Create a new DCA strategy
  createStrategy: (dto: CreateStrategyDto) =>
    request.post<DcaStrategy>('/api/dca-bot/strategy', dto),

  // Pause a strategy
  pauseStrategy: (id: string) =>
    request.post<{ success: boolean; strategy: DcaStrategy }>(`/api/dca-bot/strategy/${id}/pause`),

  // Resume a strategy
  resumeStrategy: (id: string) =>
    request.post<{ success: boolean; strategy: DcaStrategy }>(`/api/dca-bot/strategy/${id}/resume`),

  // Delete a strategy
  deleteStrategy: (id: string) =>
    request.delete<{ success: boolean }>(`/api/dca-bot/strategy/${id}`),

  // Get user's positions
  getPositions: (address: string) =>
    request.get<{ positions: DcaPosition[] }>(`/api/dca-bot/positions/${address}`),

  // Get a single position
  getPosition: (id: string) =>
    request.get<DcaPosition>(`/api/dca-bot/position/${id}`),

  // Get DCA opportunities
  getOpportunities: (chain?: string, limit?: number) => {
    const params = new URLSearchParams();
    if (chain) params.append('chain', chain);
    if (limit) params.append('limit', limit.toString());
    return request.get<{ opportunities: DcaOpportunity[] }>(`/api/dca-bot/opportunities?${params.toString()}`);
  },

  // Analyze an opportunity
  analyzeOpportunity: (fromToken: string, toToken: string, chain: string) =>
    request.post<any>('/api/dca-bot/opportunity/analyze', { fromToken, toToken, chain }),

  // Get statistics
  getStatistics: (address: string) =>
    request.get<DcaStatistics>(`/api/dca-bot/statistics/${address}`),

  // Get supported chains
  getSupportedChains: () =>
    request.get<string[]>('/api/dca-bot/supported-chains'),

  // Get supported tokens
  getSupportedTokens: (chain?: string) => {
    const params = chain ? `?chain=${chain}` : '';
    return request.get<Record<string, string[]>>(`/api/dca-bot/supported-tokens${params}`);
  },

  // Calculate DCA
  calculateDca: (amount: number, frequency: string, token: string, duration: number) => {
    const params = new URLSearchParams();
    params.append('amount', amount.toString());
    params.append('frequency', frequency);
    params.append('token', token);
    params.append('duration', duration.toString());
    return request.get<any>(`/api/dca-bot/calculate?${params.toString()}`);
  },
};
