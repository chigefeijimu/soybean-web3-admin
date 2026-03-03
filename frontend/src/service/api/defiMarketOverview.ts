import { defiRequest } from '../request';

export const defiMarketOverviewApi = {
  // Get market overview
  getOverview: (chain?: string) => 
    defiRequest.get('/defi-market-overview/overview', { chain }),

  // Get protocols list
  getProtocols: (params: {
    chain?: string;
    category?: string;
    sort?: string;
    limit?: number;
  }) => defiRequest.get('/defi-market-overview/protocols', params),

  // Get protocol details
  getProtocolDetails: (id: string) => 
    defiRequest.get(`/defi-market-overview/protocol/${id}`),

  // Get categories
  getCategories: () => 
    defiRequest.get('/defi-market-overview/categories'),

  // Get trends
  getTrends: (period: string = '7d') => 
    defiRequest.get('/defi-market-overview/trends', { period }),

  // Get top gainers/losers
  getTopGainersLosers: (period: string = '24h') => 
    defiRequest.get('/defi-market-overview/top-gainers-losers', { period }),

  // Get yield opportunities
  getYieldOpportunities: (chain?: string, minTvl?: number) => 
    defiRequest.get('/defi-market-overview/yield-opportunities', { chain, minTvl }),

  // Get chain stats
  getChainStats: () => 
    defiRequest.get('/defi-market-overview/chain-stats'),

  // Get historical TVL
  getHistoricalTvl: (period: string = '30d', chain?: string) => 
    defiRequest.get('/defi-market-overview/historical-tvl', { period, chain }),

  // Search protocols
  searchProtocols: (query: string) => 
    defiRequest.get('/defi-market-overview/search', { q: query }),
};
