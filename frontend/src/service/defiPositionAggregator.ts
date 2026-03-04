import { request } from '@/utils/request';

export interface DefiPosition {
  id: string;
  protocol: string;
  protocolLogo: string;
  chain: string;
  type: 'lending' | 'liquidity' | 'staking' | 'farming' | 'borrow' | 'vesting';
  token0?: string;
  token1?: string;
  token0Amount: string;
  token1Amount?: string;
  usdValue: number;
  apy: number;
  rewards?: Array<{ token: string; amount: string; usdValue: number }>;
  healthFactor?: number;
  liquidationPrice?: number;
  lastUpdated: string;
}

export interface AggregatedPositions {
  address: string;
  totalValue: number;
  totalApy: number;
  positions: DefiPosition[];
  chainDistribution: Record<string, number>;
  protocolDistribution: Record<string, number>;
  typeDistribution: Record<string, number>;
  summary: {
    lending: number;
    liquidity: number;
    staking: number;
    farming: number;
    borrow: number;
    vesting: number;
  };
}

export interface PositionHealth {
  score: number;
  level: 'excellent' | 'good' | 'fair' | 'poor';
  factors: Array<{ name: string; value: number; weight: number; score: number }>;
  recommendations: string[];
}

export interface PositionComparison {
  addresses: string[];
  totalValues: number[];
  comparisons: Array<{
    address: string;
    totalValue: number;
    positionCount: number;
    chains: string[];
    protocols: string[];
  }>;
}

export const defiPositionAggregator = {
  async getPositions(address: string, chains?: string): Promise<AggregatedPositions> {
    const params = new URLSearchParams();
    if (chains) params.append('chains', chains);
    const query = params.toString() ? `?${params.toString()}` : '';
    return request.get(`/defi-position-aggregator/positions/${address}${query}`);
  },

  async comparePositions(addresses: string, chains?: string): Promise<PositionComparison> {
    const params = new URLSearchParams({ addresses });
    if (chains) params.append('chains', chains);
    return request.get(`/defi-position-aggregator/compare?${params.toString()}`);
  },

  async getTopPositions(limit?: number, chain?: string): Promise<DefiPosition[]> {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (chain) params.append('chain', chain);
    return request.get(`/defi-position-aggregator/top-positions?${params.toString()}`);
  },

  async getPositionHealth(positions: DefiPosition[]): Promise<PositionHealth> {
    return request.post('/defi-position-aggregator/health', { positions });
  },

  async getAddressHealth(address: string, chains?: string): Promise<PositionHealth> {
    const params = new URLSearchParams();
    if (chains) params.append('chains', chains);
    const query = params.toString() ? `?${params.toString()}` : '';
    return request.get(`/defi-position-aggregator/health/${address}${query}`);
  },

  async getSupportedChains(): Promise<string[]> {
    return request.get('/defi-position-aggregator/supported-chains');
  },

  async getSupportedProtocols(): Promise<Record<string, string[]>> {
    return request.get('/defi-position-aggregator/supported-protocols');
  },
};
