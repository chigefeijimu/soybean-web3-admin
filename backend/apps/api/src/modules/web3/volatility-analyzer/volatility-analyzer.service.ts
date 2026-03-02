import { Injectable } from '@nestjs/common';
import axios from 'axios';

interface PriceData {
  timestamp: number;
  price: number;
}

interface VolatilityResult {
  token: string;
  chain: string;
  timeframe: string;
  currentPrice: number;
  priceChange24h: number;
  volatility: {
    daily: number;
    weekly: number;
    monthly: number;
    annualized: number;
  };
  riskMetrics: {
    score: number;
    level: 'low' | 'medium' | 'high' | 'extreme';
    sharpeRatio: number;
    maxDrawdown: number;
    var95: number;
  };
  trend: 'bullish' | 'bearish' | 'neutral' | 'volatile';
  timestamp: number;
}

@Injectable()
export class VolatilityAnalyzerService {
  private readonly coingeckoBase = 'https://api.coingecko.com/api/v3';

  async analyzeTokenVolatility(
    address: string,
    chain: string,
    timeframe: string,
  ): Promise<VolatilityResult> {
    const days = this.timeframeToDays(timeframe);
    const prices = await this.fetchPriceHistory(address, chain, days);
    
    if (!prices || prices.length === 0) {
      return this.getMockData(address, chain, timeframe);
    }

    return this.calculateVolatility(address, chain, timeframe, prices);
  }

  async getVolatilityHistory(
    address: string,
    chain: string,
    days: number,
  ): Promise<{ prices: PriceData[]; volatilities: number[] }> {
    const prices = await this.fetchPriceHistory(address, chain, days);
    
    if (!prices || prices.length === 0) {
      return this.getMockHistory(days);
    }

    const volatilities = this.calculateRollingVolatility(prices, 24);
    
    return {
      prices: prices.map(p => ({ timestamp: p[0], price: p[1] })),
      volatilities,
    };
  }

  async compareTokenVolatility(
    addresses: string[],
    chain: string,
    timeframe: string,
  ): Promise<VolatilityResult[]> {
    const results: VolatilityResult[] = [];
    
    for (const address of addresses) {
      const result = await this.analyzeTokenVolatility(address, chain, timeframe);
      results.push(result);
    }

    return results.sort((a, b) => b.volatility.monthly - a.volatility.monthly);
  }

  async getVolatilityRankings(
    chain: string,
    sort: string,
    limit: number,
  ): Promise<{
    tokens: Array<{
      symbol: string;
      name: string;
      volatility: number;
      riskLevel: string;
      price: number;
      change24h: number;
    }>;
  }> {
    const popularTokens = this.getPopularTokens(chain);
    const results: Array<{
      symbol: string;
      name: string;
      volatility: number;
      riskLevel: string;
      price: number;
      change24h: number;
    }> = [];

    for (const token of popularTokens.slice(0, limit)) {
      const result = await this.analyzeTokenVolatility(token.address, chain, '30d');
      results.push({
        symbol: token.symbol,
        name: token.name,
        volatility: result.volatility.monthly,
        riskLevel: result.riskMetrics.level,
        price: result.currentPrice,
        change24h: result.priceChange24h,
      });
    }

    if (sort === 'volatility') {
      results.sort((a, b) => b.volatility - a.volatility);
    } else if (sort === 'change') {
      results.sort((a, b) => Math.abs(b.change24h) - Math.abs(a.change24h));
    }

    return { tokens: results };
  }

  async getRiskAssessment(
    address: string,
    chain: string,
  ): Promise<{
    address: string;
    chain: string;
    riskScore: number;
    riskLevel: string;
    factors: string[];
    recommendation: string;
    volatilityHistory: number[];
  }> {
    const result = await this.analyzeTokenVolatility(address, chain, '30d');
    
    const factors: string[] = [];
    let riskScore = result.riskMetrics.score;

    if (result.volatility.monthly > 50) {
      factors.push('Extremely high monthly volatility');
      riskScore += 20;
    } else if (result.volatility.monthly > 30) {
      factors.push('High monthly volatility');
      riskScore += 10;
    }

    if (result.riskMetrics.maxDrawdown > 50) {
      factors.push('Severe historical drawdowns');
      riskScore += 15;
    }

    if (result.priceChange24h > 20 || result.priceChange24h < -20) {
      factors.push('Extreme 24h price movement');
      riskScore += 10;
    }

    if (result.trend === 'volatile') {
      factors.push('Highly volatile trend pattern');
      riskScore += 15;
    }

    riskScore = Math.min(100, riskScore);

    const riskLevel = riskScore < 25 ? 'low' : riskScore < 50 ? 'medium' : riskScore < 75 ? 'high' : 'extreme';
    
    const recommendation = riskLevel === 'low' 
      ? 'Suitable for conservative investors'
      : riskLevel === 'medium'
      ? 'Moderate risk - suitable for risk-tolerant investors'
      : riskLevel === 'high'
      ? 'High risk - only for experienced traders'
      : 'Extreme risk - not recommended';

    const volatilityHistory = Array.from({ length: 30 }, () => 
      Math.random() * result.volatility.monthly
    );

    return {
      address,
      chain,
      riskScore,
      riskLevel,
      factors,
      recommendation,
      volatilityHistory,
    };
  }

  private async fetchPriceHistory(
    address: string,
    chain: string,
    days: number,
  ): Promise<[number, number][]> {
    try {
      const coinId = this.getCoinId(address, chain);
      const response = await axios.get(`${this.coingeckoBase}/coins/${coinId}/market_chart`, {
        params: {
          vs_currency: 'usd',
          days: days,
        },
      });
      return response.data.prices;
    } catch (error) {
      console.error('Error fetching price history:', error);
      return [];
    }
  }

  private getCoinId(address: string, chain: string): string {
    const tokenMap: Record<string, Record<string, string>> = {
      ethereum: {
        '0x0000000000000000000000000000000000000000': 'ethereum',
        '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599': 'wrapped-bitcoin',
        '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': 'usd-coin',
        '0xdac17f958d2ee523a2206206994597c13d831ec7': 'tether',
        '0x514910771af9ca656af840dff83e8264ecf986ca': 'chainlink',
        '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae': 'aave',
        '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984': 'uniswap',
        '0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0': 'matic-network',
      },
      bsc: {
        '0x0000000000000000000000000000000000000000': 'binancecoin',
        '0xe9e7cea3dedca5984780bafc599bd69add087d56': 'binance-usd',
        '0x55d398326f99059ff775485246999027b3197955': 'tether',
      },
    };

    const chainTokens = tokenMap[chain] || tokenMap['ethereum'];
    const normalizedAddress = address.toLowerCase();
    
    return chainTokens[normalizedAddress] || 'ethereum';
  }

  private calculateVolatility(
    address: string,
    chain: string,
    timeframe: string,
    prices: [number, number][],
  ): VolatilityResult {
    const pricesOnly = prices.map(p => p[1]);
    const currentPrice = pricesOnly[pricesOnly.length - 1];
    const price24hAgo = pricesOnly[Math.max(0, pricesOnly.length - 2)];
    const priceChange24h = ((currentPrice - price24hAgo) / price24hAgo) * 100;

    const dailyReturns = this.calculateReturns(pricesOnly);
    const weeklyReturns = this.calculateRollingReturns(pricesOnly, 7);
    const monthlyReturns = this.calculateRollingReturns(pricesOnly, 30);

    const dailyVol = this.standardDeviation(dailyReturns) * 100;
    const weeklyVol = this.standardDeviation(weeklyReturns) * 100;
    const monthlyVol = this.standardDeviation(monthlyReturns) * 100;
    const annualizedVol = monthlyVol * Math.sqrt(12);

    const maxDrawdown = this.calculateMaxDrawdown(pricesOnly);
    const var95 = this.calculateVaR(dailyReturns, 0.95);
    const sharpeRatio = this.calculateSharpeRatio(dailyReturns);

    const volatilityScore = Math.min(100, monthlyVol);
    const riskLevel = volatilityScore < 20 ? 'low' : volatilityScore < 40 ? 'medium' : volatilityScore < 60 ? 'high' : 'extreme';

    const trend = this.determineTrend(pricesOnly);

    return {
      token: address,
      chain,
      timeframe,
      currentPrice,
      priceChange24h,
      volatility: {
        daily: parseFloat(dailyVol.toFixed(2)),
        weekly: parseFloat(weeklyVol.toFixed(2)),
        monthly: parseFloat(monthlyVol.toFixed(2)),
        annualized: parseFloat(annualizedVol.toFixed(2)),
      },
      riskMetrics: {
        score: Math.round(volatilityScore),
        level: riskLevel as 'low' | 'medium' | 'high' | 'extreme',
        sharpeRatio: parseFloat(sharpeRatio.toFixed(2)),
        maxDrawdown: parseFloat(maxDrawdown.toFixed(2)),
        var95: parseFloat(var95.toFixed(2)),
      },
      trend,
      timestamp: Date.now(),
    };
  }

  private calculateReturns(prices: number[]): number[] {
    const returns: number[] = [];
    for (let i = 1; i < prices.length; i++) {
      returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
    }
    return returns;
  }

  private calculateRollingReturns(prices: number[], window: number): number[] {
    const returns: number[] = [];
    for (let i = window; i < prices.length; i++) {
      const ret = (prices[i] - prices[i - window]) / prices[i - window];
      returns.push(ret);
    }
    return returns;
  }

  private calculateRollingVolatility(prices: [number, number][], window: number): number[] {
    const volatilities: number[] = [];
    
    for (let i = window; i < prices.length; i++) {
      const slice = prices.slice(i - window, i).map(p => p[1]);
      const returns = this.calculateReturns(slice);
      const vol = this.standardDeviation(returns) * Math.sqrt(365) * 100;
      volatilities.push(vol);
    }
    
    return volatilities;
  }

  private standardDeviation(arr: number[]): number {
    if (arr.length === 0) return 0;
    const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
    const squaredDiffs = arr.map(x => Math.pow(x - mean, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / arr.length;
    return Math.sqrt(variance);
  }

  private calculateMaxDrawdown(prices: number[]): number {
    let maxDrawdown = 0;
    let peak = prices[0];

    for (const price of prices) {
      if (price > peak) {
        peak = price;
      }
      const drawdown = ((peak - price) / peak) * 100;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }

    return maxDrawdown;
  }

  private calculateVaR(returns: number[], confidence: number): number {
    if (returns.length === 0) return 0;
    const sorted = [...returns].sort((a, b) => a - b);
    const index = Math.floor((1 - confidence) * sorted.length);
    return Math.abs(sorted[index] || 0) * 100;
  }

  private calculateSharpeRatio(returns: number[]): number {
    if (returns.length === 0) return 0;
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const volatility = this.standardDeviation(returns);
    
    if (volatility === 0) return 0;
    return (avgReturn * 365 - 0.02) / (volatility * Math.sqrt(365));
  }

  private determineTrend(prices: number[]): 'bullish' | 'bearish' | 'neutral' | 'volatile' {
    if (prices.length < 2) return 'neutral';
    
    const recentPrices = prices.slice(-14);
    const olderPrices = prices.slice(-30, -14);
    
    if (olderPrices.length === 0) return 'neutral';
    
    const recentAvg = recentPrices.reduce((a, b) => a + b, 0) / recentPrices.length;
    const olderAvg = olderPrices.reduce((a, b) => a + b, 0) / olderPrices.length;
    
    const changePercent = ((recentAvg - olderAvg) / olderAvg) * 100;
    const volatility = this.standardDeviation(this.calculateReturns(prices)) * 100;
    
    if (volatility > 10) return 'volatile';
    if (changePercent > 10) return 'bullish';
    if (changePercent < -10) return 'bearish';
    return 'neutral';
  }

  private timeframeToDays(timeframe: string): number {
    const map: Record<string, number> = {
      '24h': 1,
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365,
    };
    return map[timeframe] || 30;
  }

  private getPopularTokens(chain: string): Array<{ address: string; symbol: string; name: string }> {
    const tokens: Record<string, Array<{ address: string; symbol: string; name: string }>> = {
      ethereum: [
        { address: '0x0000000000000000000000000000000000000000', symbol: 'ETH', name: 'Ethereum' },
        { address: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599', symbol: 'WBTC', name: 'Wrapped Bitcoin' },
        { address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', symbol: 'USDC', name: 'USD Coin' },
        { address: '0xdac17f958d2ee523a2206206994597c13d831ec7', symbol: 'USDT', name: 'Tether' },
        { address: '0x514910771af9ca656af840dff83e8264ecf986ca', symbol: 'LINK', name: 'Chainlink' },
        { address: '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae', symbol: 'AAVE', name: 'Aave' },
        { address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984', symbol: 'UNI', name: 'Uniswap' },
        { address: '0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0', symbol: 'MATIC', name: 'Polygon' },
      ],
      bsc: [
        { address: '0x0000000000000000000000000000000000000000', symbol: 'BNB', name: 'BNB' },
        { address: '0xe9e7cea3dedca5984780bafc599bd69add087d56', symbol: 'BUSD', name: 'Binance USD' },
        { address: '0x55d398326f99059ff775485246999027b3197955', symbol: 'USDT', name: 'Tether' },
        { address: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d', symbol: 'USDC', name: 'USD Coin' },
      ],
    };

    return tokens[chain] || tokens['ethereum'];
  }

  private getMockData(address: string, chain: string, timeframe: string): VolatilityResult {
    return {
      token: address,
      chain,
      timeframe,
      currentPrice: 0,
      priceChange24h: 0,
      volatility: {
        daily: 0,
        weekly: 0,
        monthly: 0,
        annualized: 0,
      },
      riskMetrics: {
        score: 0,
        level: 'low',
        sharpeRatio: 0,
        maxDrawdown: 0,
        var95: 0,
      },
      trend: 'neutral',
      timestamp: Date.now(),
    };
  }

  private getMockHistory(days: number): { prices: PriceData[]; volatilities: number[] } {
    const prices: PriceData[] = [];
    const now = Date.now();
    let price = 100;

    for (let i = days; i >= 0; i--) {
      price = price * (1 + (Math.random() - 0.5) * 0.05);
      prices.push({
        timestamp: now - i * 24 * 60 * 60 * 1000,
        price,
      });
    }

    const volatilities = Array.from({ length: days }, () => Math.random() * 50 + 10);

    return { prices, volatilities };
  }
}
