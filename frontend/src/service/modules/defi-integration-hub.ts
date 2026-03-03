import { request } from '@/service/request';

const baseUrl = '/defi-integration-hub';

export const defiHubApi = {
  // Get unified portfolio across all protocols
  getUnifiedPortfolio: (address: string) => {
    return request.get(`${baseUrl}/portfolio/${address}`);
  },

  // Get all positions across protocols
  getPositions: (address: string) => {
    return request.get(`${baseUrl}/positions/${address}`);
  },

  // Add or update a position
  addPosition: (data: any) => {
    return request.post(`${baseUrl}/positions`, data);
  },

  // Get supported protocols list
  getSupportedProtocols: () => {
    return request.get(`${baseUrl}/protocols`);
  },

  // Get positions for specific protocol
  getProtocolPositions: (protocol: string, address: string) => {
    return request.get(`${baseUrl}/protocol/${protocol}/positions/${address}`);
  },

  // Get portfolio summary with risk analysis
  getPortfolioSummary: (address: string) => {
    return request.get(`${baseUrl}/summary/${address}`);
  },

  // Execute protocol interaction
  executeInteraction: (data: any) => {
    return request.post(`${baseUrl}/interact`, data);
  },

  // Get rebalancing recommendations
  getRebalanceRecommendations: (data: any) => {
    return request.post(`${baseUrl}/rebalance`, data);
  },

  // Get position history
  getPositionHistory: (address: string, protocol?: string) => {
    const params = protocol ? `?protocol=${protocol}` : '';
    return request.get(`${baseUrl}/history/${address}${params}`);
  },

  // Find yield opportunities
  findYieldOpportunities: (chain?: string, minTvL?: number) => {
    const params = new URLSearchParams();
    if (chain) params.append('chain', chain);
    if (minTvL) params.append('minTvL', minTvL.toString());
    const query = params.toString() ? `?${params.toString()}` : '';
    return request.get(`${baseUrl}/opportunities${query}`);
  },

  // Get portfolio health score
  getPortfolioHealth: (address: string) => {
    return request.get(`${baseUrl}/health/${address}`);
  },
};
