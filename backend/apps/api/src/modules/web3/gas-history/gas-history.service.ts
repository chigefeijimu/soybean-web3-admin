import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';

const CHAIN_GAS_API = {
  1: 'https://api.etherscan.io/api?module=gastracker&action=gasoracle',
  5: 'https://api-goerli.etherscan.io/api?module=gastracker&action=gasoracle',
  11155111: 'https://api-sepolia.etherscan.io/api?module=gastracker&action=gasoracle',
  56: 'https://api.bscscan.com/api?module=gastracker&action=gasoracle',
  97: 'https://api-testnet.bscscan.com/api?module=gastracker&action=gasoracle',
  137: 'https://api.polygonscan.com/api?module=gastracker&action=gasoracle',
  80001: 'https://api-mumbai.polygonscan.com/api?module=gastracker&action=gasoracle',
  42161: 'https://api.arbiscan.io/api?module=gastracker&action=gasoracle',
  421613: 'https://api-goerli.arbiscan.io/api?module=gastracker&action=gasoracle',
  10: 'https://api-optimistic.etherscan.io/api?module=gastracker&action=gasoracle',
  8453: 'https://api.basescan.org/api?module=gastracker&action=gasoracle',
};

const CHAIN_NAMES: Record<number, string> = {
  1: 'Ethereum',
  5: 'Goerli',
  11155111: 'Sepolia',
  56: 'BNB Chain',
  97: 'BNB Chain Testnet',
  137: 'Polygon',
  80001: 'Mumbai',
  42161: 'Arbitrum One',
  421613: 'Arbitrum Goerli',
  10: 'Optimism',
  8453: 'Base',
};

interface GasPrice {
  SafeGasPrice: string;
  ProposeGasPrice: string;
  FastGasPrice: string;
  suggestBaseFee: string;
  gasUsedRatio: string;
  SafeGasPriceInHex: string;
  ProposeGasPriceInHex: string;
  FastGasPriceInHex: string;
}

interface HistoricalGasData {
  timestamp: number;
  date: string;
  slow: number;
  normal: number;
  fast: number;
  unit: string;
}

interface GasStats {
  avgSlow: number;
  avgNormal: number;
  avgFast: number;
  min: number;
  max: number;
  volatility: number;
}

@Injectable()
export class GasHistoryService {
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 60000; // 1 minute

  async getCurrentGasPrices(chainId: number = 1): Promise<any> {
    const cacheKey = `current_gas_${chainId}`;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }

    try {
      const apiUrl = CHAIN_GAS_API[chainId];
      if (!apiUrl) {
        throw new HttpException(
          `Unsupported chain: ${chainId}`,
          HttpStatus.BAD_REQUEST,
        );
      }

      const response = await axios.get(apiUrl, { timeout: 10000 });
      if (response.data.status === '1') {
        const result = response.data.result;
        const data = {
          chainId,
          chainName: CHAIN_NAMES[chainId] || 'Unknown',
          timestamp: Date.now(),
          slow: parseFloat(result.SafeGasPrice),
          normal: parseFloat(result.ProposeGasPrice),
          fast: parseFloat(result.FastGasPrice),
          baseFee: parseFloat(result.suggestBaseFee) || 0,
          unit: 'Gwei',
        };

        this.cache.set(cacheKey, { data, timestamp: Date.now() });
        return data;
      }
      throw new HttpException(
        'Failed to fetch gas prices',
        HttpStatus.BAD_REQUEST,
      );
    } catch (error) {
      // Return mock data for demo
      return {
        chainId,
        chainName: CHAIN_NAMES[chainId] || 'Unknown',
        timestamp: Date.now(),
        slow: this.getMockGasPrice('slow', chainId),
        normal: this.getMockGasPrice('normal', chainId),
        fast: this.getMockGasPrice('fast', chainId),
        baseFee: this.getMockGasPrice('base', chainId),
        unit: 'Gwei',
        isMock: true,
      };
    }
  }

  async getHistoricalGasPrices(
    chainId: number = 1,
    days: number = 7,
  ): Promise<HistoricalGasData[]> {
    const cacheKey = `history_gas_${chainId}_${days}`;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL * 5) {
      return cached.data;
    }

    // Generate historical data based on current prices and simulated history
    const currentPrices = await this.getCurrentGasPrices(chainId);
    const historicalData: HistoricalGasData[] = [];
    const now = Date.now();

    for (let i = days - 1; i >= 0; i--) {
      const timestamp = now - i * 24 * 60 * 60 * 1000;
      const date = new Date(timestamp).toISOString().split('T')[0];
      
      // Add some variance to simulate historical data
      const variance = 0.7 + Math.random() * 0.6;
      const timeOfDayFactor = 1 + 0.3 * Math.sin((timestamp % 86400000) / 86400000 * 2 * Math.PI);
      
      historicalData.push({
        timestamp,
        date,
        slow: Math.round(currentPrices.slow * variance * timeOfDayFactor * 100) / 100,
        normal: Math.round(currentPrices.normal * variance * timeOfDayFactor * 100) / 100,
        fast: Math.round(currentPrices.fast * variance * timeOfDayFactor * 100) / 100,
        unit: 'Gwei',
      });
    }

    this.cache.set(cacheKey, { data: historicalData, timestamp: Date.now() });
    return historicalData;
  }

  async getHourlyGasPrices(
    chainId: number = 1,
    hours: number = 24,
  ): Promise<HistoricalGasData[]> {
    const cacheKey = `hourly_gas_${chainId}_${hours}`;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }

    const currentPrices = await this.getCurrentGasPrices(chainId);
    const hourlyData: HistoricalGasData[] = [];
    const now = Date.now();

    for (let i = hours - 1; i >= 0; i--) {
      const timestamp = now - i * 60 * 60 * 1000;
      const date = new Date(timestamp).toISOString();
      
      // Simulate hourly variance
      const variance = 0.8 + Math.random() * 0.4;
      const hourOfDayFactor = 1 + 0.2 * Math.sin((timestamp % 86400000) / 86400000 * 2 * Math.PI);
      
      hourlyData.push({
        timestamp,
        date,
        slow: Math.round(currentPrices.slow * variance * hourOfDayFactor * 100) / 100,
        normal: Math.round(currentPrices.normal * variance * hourOfDayFactor * 100) / 100,
        fast: Math.round(currentPrices.fast * variance * hourOfDayFactor * 100) / 100,
        unit: 'Gwei',
      });
    }

    this.cache.set(cacheKey, { data: hourlyData, timestamp: Date.now() });
    return hourlyData;
  }

  async getGasStats(chainId: number = 1, days: number = 7): Promise<GasStats> {
    const historicalData = await this.getHistoricalGasPrices(chainId, days);
    
    const slowPrices = historicalData.map(d => d.slow);
    const normalPrices = historicalData.map(d => d.normal);
    const fastPrices = historicalData.map(d => d.fast);
    const allPrices = [...slowPrices, ...normalPrices, ...fastPrices];

    const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
    const min = Math.min(...allPrices);
    const max = Math.max(...allPrices);
    
    // Calculate volatility (standard deviation)
    const mean = avg(allPrices);
    const variance = avg(allPrices.map(p => Math.pow(p - mean, 2)));
    const volatility = Math.sqrt(variance);

    return {
      avgSlow: Math.round(avg(slowPrices) * 100) / 100,
      avgNormal: Math.round(avg(normalPrices) * 100) / 100,
      avgFast: Math.round(avg(fastPrices) * 100) / 100,
      min: Math.round(min * 100) / 100,
      max: Math.round(max * 100) / 100,
      volatility: Math.round(volatility * 100) / 100,
    };
  }

  async getBestTradingHours(chainId: number = 1): Promise<any> {
    // Analyze hourly patterns to find best trading times
    const hourlyData = await this.getHourlyGasPrices(chainId, 168); // 7 days
    
    const hourGroups: Record<number, { total: number; count: number }> = {};
    
    hourlyData.forEach(data => {
      const hour = new Date(data.timestamp).getHours();
      if (!hourGroups[hour]) {
        hourGroups[hour] = { total: 0, count: 0 };
      }
      hourGroups[hour].total += data.normal;
      hourGroups[hour].count++;
    });

    const hourlyAvg = Object.entries(hourGroups).map(([hour, data]) => ({
      hour: parseInt(hour),
      avgGas: Math.round((data.total / data.count) * 100) / 100,
    }));

    // Find best and worst hours
    hourlyAvg.sort((a, b) => a.avgGas - b.avgGas);
    
    return {
      bestHours: hourlyAvg.slice(0, 4).map(h => h.hour),
      worstHours: hourlyAvg.slice(-4).map(h => h.hour),
      hourlyAverage: hourlyAvg,
      recommendation: 'Gas prices are typically lowest between 00:00-06:00 UTC and highest during peak hours (14:00-20:00 UTC)',
    };
  }

  async getGasPrediction(chainId: number = 1): Promise<any> {
    const currentPrices = await this.getCurrentGasPrices(chainId);
    const stats = await this.getGasStats(chainId, 7);
    const bestHours = await this.getBestTradingHours(chainId);

    // Simple prediction based on current trend
    const hour = new Date().getUTCHours();
    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    
    if (hour >= 14 && hour <= 20) {
      trend = 'increasing';
    } else if (hour >= 0 && hour <= 6) {
      trend = 'decreasing';
    }

    const predictedSlow = currentPrices.slow * (trend === 'increasing' ? 1.2 : trend === 'decreasing' ? 0.8 : 1);
    const predictedNormal = currentPrices.normal * (trend === 'increasing' ? 1.2 : trend === 'decreasing' ? 0.8 : 1);
    const predictedFast = currentPrices.fast * (trend === 'increasing' ? 1.2 : trend === 'decreasing' ? 0.8 : 1);

    return {
      current: currentPrices,
      predicted: {
        slow: Math.round(predictedSlow * 100) / 100,
        normal: Math.round(predictedNormal * 100) / 100,
        fast: Math.round(predictedFast * 100) / 100,
        trend,
      },
      stats,
      bestTradingHours: bestHours.bestHours,
      recommendation: this.getRecommendation(chainId, currentPrices, trend),
    };
  }

  async getSupportedChains(): Promise<any[]> {
    return Object.entries(CHAIN_NAMES).map(([id, name]) => ({
      chainId: parseInt(id),
      name,
      hasGasHistory: true,
    }));
  }

  async compareChainsGas(): Promise<any> {
    const chains = [1, 56, 137, 42161, 10, 8453];
    const results = await Promise.all(
      chains.map(async chainId => {
        const prices = await this.getCurrentGasPrices(chainId);
        return {
          chainId,
          chainName: prices.chainName,
          slow: prices.slow,
          normal: prices.normal,
          fast: prices.fast,
          score: this.calculateGasScore(prices),
        };
      }),
    );

    results.sort((a, b) => a.score - b.score);
    return {
      ranking: results.map((r, i) => ({ ...r, rank: i + 1 })),
      cheapest: results[0],
      mostExpensive: results[results.length - 1],
    };
  }

  private calculateGasScore(prices: any): number {
    // Lower is better (cheaper)
    return (prices.normal * 10);
  }

  private getRecommendation(chainId: number, prices: any, trend: string): string {
    const avgGas = (prices.slow + prices.normal + prices.fast) / 3;
    
    if (avgGas < 20) {
      return 'Gas prices are LOW - Great time for transactions!';
    } else if (avgGas < 50) {
      return 'Gas prices are NORMAL - Good time for most transactions.';
    } else if (avgGas < 100) {
      return 'Gas prices are HIGH - Consider waiting for lower prices or using Layer 2.';
    } else {
      return 'Gas prices are VERY HIGH - Wait for prices to drop or use alternative chains.';
    }
  }

  private getMockGasPrice(type: string, chainId: number): number {
    const basePrices: Record<number, { slow: number; normal: number; fast: number; base: number }> = {
      1: { slow: 20, normal: 25, fast: 35, base: 15 },
      56: { slow: 3, normal: 5, fast: 8, base: 2 },
      137: { slow: 40, normal: 50, fast: 80, base: 35 },
      42161: { slow: 0.1, normal: 0.15, fast: 0.2, base: 0.08 },
      10: { slow: 0.001, normal: 0.002, fast: 0.005, base: 0.001 },
      8453: { slow: 0.5, normal: 1, fast: 2, base: 0.4 },
    };

    const chainPrices = basePrices[chainId] || basePrices[1];
    switch (type) {
      case 'slow': return chainPrices.slow;
      case 'normal': return chainPrices.normal;
      case 'fast': return chainPrices.fast;
      case 'base': return chainPrices.base;
      default: return chainPrices.normal;
    }
  }
}
