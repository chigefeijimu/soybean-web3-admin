import { request } from '../request';

export const tokenCorrelation = {
  getCorrelationMatrix(params: {
    tokens?: string;
    chain?: string;
    timeframe?: string;
  }) {
    return request.get('/web3/token-correlation/matrix', { params });
  },

  getTopCorrelations(params: {
    token?: string;
    chain?: string;
    timeframe?: string;
    limit?: number;
  }) {
    return request.get('/web3/token-correlation/top-correlations', { params });
  },

  getDiversificationScore(params: {
    tokens: string;
    chain?: string;
    timeframe?: string;
  }) {
    return request.get('/web3/token-correlation/diversification-score', { params });
  },

  getTrendingCorrelations(params?: {
    chain?: string;
    timeframe?: string;
  }) {
    return request.get('/web3/token-correlation/trending', { params });
  },

  getHeatmapData(params?: {
    chain?: string;
    timeframe?: string;
  }) {
    return request.get('/web3/token-correlation/heatmap-data', { params });
  },
};
