import { request } from '../request';

// DeFi Protocol Metrics API
export const defiProtocolMetricsApi = {
  // Get overview of all protocols
  getOverview(chains?: string) {
    return request.get('/defi-protocol-metrics/overview', { chains });
  },

  // Get protocols with filters
  getProtocols(chain?: string, category?: string, sortBy?: string, limit?: number) {
    return request.get('/defi-protocol-metrics/protocols', {
      chain,
      category,
      sortBy,
      limit,
    });
  },

  // Get protocol details
  getProtocolDetails(id: string) {
    return request.get(`/defi-protocol-metrics/protocol/${id}`);
  },

  // Compare protocols
  compareProtocols(protocols: string) {
    return request.get('/defi-protocol-metrics/compare', { protocols });
  },

  // Get trending protocols
  getTrending(timeRange?: string) {
    return request.get('/defi-protocol-metrics/trending', { timeRange });
  },

  // Get categories
  getCategories() {
    return request.get('/defi-protocol-metrics/categories');
  },

  // Get chains
  getChains() {
    return request.get('/defi-protocol-metrics/chains');
  },

  // Search protocols
  searchProtocols(query: string) {
    return request.get('/defi-protocol-metrics/search', { q: query });
  },
};
