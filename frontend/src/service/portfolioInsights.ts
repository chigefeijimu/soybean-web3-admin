import { request } from '../request';

// Portfolio Insights API
export const portfolioInsightsApi = {
  // Get AI-powered portfolio insights
  getInsights: (address: string, chainId: number = 1) => {
    return request.get('/api/portfolio-insights', {
      params: { address, chainId },
    });
  },

  // Get portfolio risk assessment
  getRiskAssessment: (address: string, chainId: number = 1) => {
    return request.get('/api/portfolio-insights/risk', {
      params: { address, chainId },
    });
  },

  // Get optimization recommendations
  getOptimization: (address: string, chainId: number = 1) => {
    return request.get('/api/portfolio-insights/optimize', {
      params: { address, chainId },
    });
  },

  // Get market sentiment analysis
  getSentiment: (address: string, chainId: number = 1) => {
    return request.get('/api/portfolio-insights/sentiment', {
      params: { address, chainId },
    });
  },

  // Compare with benchmark
  getBenchmark: (address: string, chainId: number = 1) => {
    return request.get('/api/portfolio-insights/benchmark', {
      params: { address, chainId },
    });
  },
};
