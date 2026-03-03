import { request } from '@/service/http';

const baseUrl = '/api/pool-deep-analytics';

export const PoolDeepAnalytics = {
  // Pool Depth Analysis
  getPoolDepth(poolAddress, token0Address, token1Address, depthLevels = 10) {
    return request({
      url: `${baseUrl}/depth`,
      method: 'GET',
      params: {
        poolAddress,
        token0Address,
        token1Address,
        depthLevels,
      },
    });
  },

  // Impermanent Loss Calculator
  calculateImpermanentLoss(token0Amount, token1Amount, initialPrice, currentPrice) {
    return request({
      url: `${baseUrl}/impermanent-loss`,
      method: 'POST',
      data: {
        token0Amount,
        token1Amount,
        initialPrice,
        currentPrice,
      },
    });
  },

  // Range Order Recommendation
  getRangeOrderRecommendation(token0Address, token1Address, currentPrice, volatility = 'medium') {
    return request({
      url: `${baseUrl}/range-order`,
      method: 'POST',
      data: {
        token0Address,
        token1Address,
        currentPrice,
        volatility,
      },
    });
  },

  // Pool Efficiency
  getPoolEfficiency(poolAddress) {
    return request({
      url: `${baseUrl}/efficiency/${poolAddress}`,
      method: 'GET',
    });
  },

  // Price Impact Calculator
  calculatePriceImpact(poolAddress, tokenIn, amountIn) {
    return request({
      url: `${baseUrl}/price-impact`,
      method: 'POST',
      data: {
        poolAddress,
        tokenIn,
        amountIn,
      },
    });
  },

  // Historical IL
  getHistoricalIL(token0Address, token1Address, days = 30) {
    return request({
      url: `${baseUrl}/historical-il`,
      method: 'POST',
      data: {
        token0Address,
        token1Address,
        days,
      },
    });
  },

  // Pool Health Score
  getPoolHealthScore(poolAddress) {
    return request({
      url: `${baseUrl}/health/${poolAddress}`,
      method: 'GET',
    });
  },

  // Compare Pools
  comparePools(poolAddresses) {
    return request({
      url: `${baseUrl}/compare`,
      method: 'POST',
      data: {
        poolAddresses,
      },
    });
  },

  // Dashboard
  getDashboard() {
    return request({
      url: `${baseUrl}/dashboard`,
      method: 'GET',
    });
  },
};
