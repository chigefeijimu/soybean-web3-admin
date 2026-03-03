import { request } from '@/service/request';

export interface TreasuryAsset {
  token: string;
  symbol: string;
  balance: string;
  value: number;
  chain: string;
  percentage: number;
}

export interface TreasuryFlow {
  type: 'inflow' | 'outflow';
  amount: number;
  token: string;
  from: string;
  to: string;
  timestamp: number;
  txHash: string;
}

export interface TreasuryHealth {
  score: number;
  rating: 'excellent' | 'good' | 'fair' | 'poor';
  diversification: number;
  liquidity: number;
  sustainability: number;
  factors: string[];
}

export interface DaoTreasury {
  dao: string;
  totalValue: number;
  assets: TreasuryAsset[];
  chains: string[];
  flows: TreasuryFlow[];
  health: TreasuryHealth;
  lastUpdated: number;
}

export interface TreasuryComparison {
  dao: string;
  totalValue: number;
  rank: number;
  change24h: number;
}

export interface TreasuryAlert {
  type: string;
  severity: 'low' | 'medium' | 'high';
  message: string;
  value?: number;
}

export const treasuryApi = {
  // Get treasury overview for a DAO
  getTreasuryOverview(dao: string) {
    return request.get<DaoTreasury>(`/treasury-analytics/overview/${dao}`);
  },

  // Get all treasuries comparison
  getAllTreasuries() {
    return request.get<TreasuryComparison[]>('/treasury-analytics/list');
  },

  // Get treasury history
  getTreasuryHistory(dao: string, days: number = 30) {
    return request.get(`/treasury-analytics/history/${dao}`, {
      params: { days }
    });
  },

  // Get treasury flows
  getTreasuryFlows(dao: string, days: number = 7) {
    return request.get<TreasuryFlow[]>(`/treasury-analytics/flows/${dao}`, {
      params: { days }
    });
  },

  // Get asset allocation
  getAssetAllocation(dao: string) {
    return request.get(`/treasury-analytics/allocation/${dao}`);
  },

  // Compare treasuries
  compareTreasuries(daos: string[]) {
    return request.get<TreasuryComparison[]>('/treasury-analytics/compare', {
      params: { daos: daos.join(',') }
    });
  },

  // Get treasury alerts
  getTreasuryAlerts(dao: string) {
    return request.get<TreasuryAlert[]>(`/treasury-analytics/alerts/${dao}`);
  },

  // Get supported DAOs
  getSupportedDaos() {
    return request.get('/treasury-analytics/supported-daos');
  }
};
