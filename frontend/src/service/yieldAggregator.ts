import { request } from '@/service/request';

export const yieldAggregatorApi = {
  getCrossChainYield: (chains?: number[]) => 
    request.get('/yield-aggregator/cross-chain', { 
      params: { chains: chains?.join(',') } 
    }),
  
  getTopOpportunities: (limit?: number) => 
    request.get('/yield-aggregator/top-opportunities', { 
      params: { limit } 
    }),
  
  getYieldComparison: (token: string) => 
    request.get('/yield-aggregator/compare', { 
      params: { token } 
    }),
  
  getProtocolYield: (name: string) => 
    request.get(`/yield-aggregator/protocol/${name}`),
  
  calculateReturns: (data: {
    principal: number;
    apy: number;
    durationDays: number;
    compoundFrequency?: 'daily' | 'weekly' | 'monthly';
  }) => request.post('/yield-aggregator/calculate', data),
};
