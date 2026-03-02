import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { GasPriceApiCacheService } from './services/gas-price-api-cache.service';

export interface ChainGasPrice {
  chainId: number;
  chainName: string;
  slow: string;
  normal: string;
  fast: string;
  baseFee: string;
  priorityFeeSlow: string;
  priorityFeeNormal: string;
  priorityFeeFast: string;
  lastUpdated: number;
}

export interface GasPrediction {
  chainId: number;
  predictedLow: string;
  predictedNormal: string;
  predictedFast: string;
  confidence: number;
  trend: 'rising' | 'falling' | 'stable';
  nextPeak: string;
  nextLow: string;
}

export interface GasHistoryPoint {
  timestamp: number;
  slow: number;
  normal: number;
  fast: number;
}

@Injectable()
export class GasPriceApiService {
  private readonly logger = new Logger(GasPriceApiService.name);
  
  // Chain RPC URLs for gas estimation
  private readonly chainRpcUrls: Record<number, string> = {
    1: 'https://eth-mainnet.g.alchemy.com/v2/demo', // Ethereum
    137: 'https://polygon-mainnet.g.alchemy.com/v2/demo', // Polygon
    42161: 'https://arb-mainnet.g.alchemy.com/v2/demo', // Arbitrum
    10: 'https://opt-mainnet.g.alchemy.com/v2/demo', // Optimism
    56: 'https://bsc-dataseed.binance.org', // BSC
    8453: 'https://base-mainnet.g.alchemy.com/v2/demo', // Base
  };

  private readonly chainNames: Record<number, string> = {
    1: 'Ethereum',
    137: 'Polygon',
    42161: 'Arbitrum',
    10: 'Optimism',
    56: 'BSC',
    8453: 'Base',
  };

  constructor(
    private readonly httpService: HttpService,
    private readonly cacheService: GasPriceApiCacheService,
  ) {}

  async getGasPrice(chainId: number): Promise<ChainGasPrice | null> {
    // Check cache first
    const cached = this.cacheService.getGasPrice(chainId);
    if (cached) {
      return cached;
    }

    try {
      const gasPrice = await this.fetchGasPrice(chainId);
      if (gasPrice) {
        this.cacheService.setGasPrice(chainId, gasPrice);
      }
      return gasPrice;
    } catch (error) {
      this.logger.error(`Failed to fetch gas price for chain ${chainId}`, error);
      return null;
    }
  }

  async getAllGasPrices(): Promise<ChainGasPrice[]> {
    const results: ChainGasPrice[] = [];
    const chainIds = Object.keys(this.chainRpcUrls).map(Number);

    for (const chainId of chainIds) {
      const gasPrice = await this.getGasPrice(chainId);
      if (gasPrice) {
        results.push(gasPrice);
      }
    }

    return results;
  }

  async getGasPrediction(chainId: number): Promise<GasPrediction | null> {
    // Check cache first
    const cached = this.cacheService.getPrediction(chainId);
    if (cached) {
      return cached;
    }

    try {
      // Get historical data for prediction
      const history = this.cacheService.getHistory(chainId);
      
      if (!history || history.length < 10) {
        // Not enough data for prediction
        return this.getDefaultPrediction(chainId);
      }

      const prediction = this.calculatePrediction(chainId, history);
      this.cacheService.setPrediction(chainId, prediction);
      return prediction;
    } catch (error) {
      this.logger.error(`Failed to calculate prediction for chain ${chainId}`, error);
      return this.getDefaultPrediction(chainId);
    }
  }

  async getGasHistory(chainId: number, hours: number = 24): Promise<GasHistoryPoint[]> {
    return this.cacheService.getHistory(chainId, hours);
  }

  async getOptimalGasTime(chainId: number): Promise<{ bestTime: string; estimatedGas: string; confidence: number }> {
    const history = this.cacheService.getHistory(chainId);
    
    if (!history || history.length < 10) {
      return {
        bestTime: 'Unknown',
        estimatedGas: '0',
        confidence: 0,
      };
    }

    // Find the hour with lowest average gas
    const hourlyAvg: Record<number, { total: number; count: number }> = {};
    
    for (const point of history) {
      const date = new Date(point.timestamp * 1000);
      const hour = date.getUTCHours();
      if (!hourlyAvg[hour]) {
        hourlyAvg[hour] = { total: 0, count: 0 };
      }
      hourlyAvg[hour].total += point.normal;
      hourlyAvg[hour].count++;
    }

    let bestHour = 0;
    let lowestAvg = Infinity;
    
    for (const [hour, data] of Object.entries(hourlyAvg)) {
      const avg = data.total / data.count;
      if (avg < lowestAvg) {
        lowestAvg = avg;
        bestHour = parseInt(hour);
      }
    }

    const bestTime = `${bestHour.toString().padStart(2, '0')}:00 UTC`;
    const confidence = Math.min(90, Math.round((history.length / 100) * 100));

    return {
      bestTime,
      estimatedGas: lowestAvg.toFixed(0),
      confidence,
    };
  }

  private async fetchGasPrice(chainId: number): Promise<ChainGasPrice | null> {
    const rpcUrl = this.chainRpcUrls[chainId];
    if (!rpcUrl) {
      return null;
    }

    try {
      // Get block to estimate base fee
      const blockResponse = await firstValueFrom(
        this.httpService.post(rpcUrl, {
          jsonrpc: '2.0',
          method: 'eth_getBlockByNumber',
          params: ['latest', false],
          id: 1,
        }),
      );

      const baseFee = blockResponse.data?.result?.baseFeePerGas 
        ? parseInt(blockResponse.data.result.baseFeePerGas, 16)
        : 0;

      // Get current gas price
      const gasPriceResponse = await firstValueFrom(
        this.httpService.post(rpcUrl, {
          jsonrpc: '2.0',
          method: 'eth_gasPrice',
          params: [],
          id: 2,
        }),
      );

      const gasPrice = gasPriceResponse.data?.result 
        ? parseInt(gasPriceResponse.data.result, 16)
        : 0;

      // Calculate different speed tiers (in Gwei)
      const baseFeeGwei = this.toGwei(baseFee);
      const gasPriceGwei = this.toGwei(gasPrice);

      const slow = (baseFeeGwei * 1.0).toFixed(2);
      const normal = (baseFeeGwei * 1.2).toFixed(2);
      const fast = (baseFeeGwei * 1.5).toFixed(2);

      // Store in history for prediction
      this.cacheService.addHistoryPoint(chainId, {
        timestamp: Math.floor(Date.now() / 1000),
        slow: parseFloat(slow),
        normal: parseFloat(normal),
        fast: parseFloat(fast),
      });

      return {
        chainId,
        chainName: this.chainNames[chainId] || `Chain ${chainId}`,
        slow,
        normal,
        fast,
        baseFee: baseFeeGwei.toFixed(2),
        priorityFeeSlow: '1',
        priorityFeeNormal: '2',
        priorityFeeFast: '5',
        lastUpdated: Date.now(),
      };
    } catch (error) {
      this.logger.error(`Error fetching gas price from RPC for chain ${chainId}`, error);
      // Return simulated data for demo
      return this.getSimulatedGasPrice(chainId);
    }
  }

  private getSimulatedGasPrice(chainId: number): ChainGasPrice {
    const baseValues: Record<number, number> = {
      1: 30,    // Ethereum - higher base
      137: 50,  // Polygon - lower
      42161: 0.1, // Arbitrum - very low
      10: 0.001, // Optimism - very low
      56: 5,    // BSC - low
      8453: 0.01, // Base - very low
    };

    const base = baseValues[chainId] || 10;

    return {
      chainId,
      chainName: this.chainNames[chainId] || `Chain ${chainId}`,
      slow: (base * 1.0).toFixed(2),
      normal: (base * 1.2).toFixed(2),
      fast: (base * 1.5).toFixed(2),
      baseFee: base.toFixed(2),
      priorityFeeSlow: '1',
      priorityFeeNormal: '2',
      priorityFeeFast: '5',
      lastUpdated: Date.now(),
    };
  }

  private calculatePrediction(chainId: number, history: GasHistoryPoint[]): GasPrediction {
    const recent = history.slice(-20);
    const older = history.slice(-40, -20);

    if (recent.length === 0) {
      return this.getDefaultPrediction(chainId);
    }

    const recentAvg = recent.reduce((a, b) => a + b.normal, 0) / recent.length;
    const olderAvg = older?.length > 0 
      ? older.reduce((a, b) => a + b.normal, 0) / older.length 
      : recentAvg;

    const trend = recentAvg > olderAvg * 1.1 
      ? 'rising' 
      : recentAvg < olderAvg * 0.9 
        ? 'falling' 
        : 'stable';

    const volatility = this.calculateVolatility(recent);
    const confidence = Math.max(50, 100 - volatility * 10);

    // Predict for next hour
    const trendMultiplier = trend === 'rising' ? 1.2 : trend === 'falling' ? 0.8 : 1.0;
    const predictedNormal = (recentAvg * trendMultiplier).toFixed(2);

    return {
      chainId,
      predictedLow: (recentAvg * 0.8 * trendMultiplier).toFixed(2),
      predictedNormal,
      predictedFast: (recentAvg * 1.3 * trendMultiplier).toFixed(2),
      confidence: Math.round(confidence),
      trend,
      nextPeak: this.predictNextPeak(history),
      nextLow: this.predictNextLow(history),
    };
  }

  private calculateVolatility(points: GasHistoryPoint[]): number {
    if (points.length < 2) return 0;
    
    const values = points.map(p => p.normal);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
    
    return Math.sqrt(variance) / mean;
  }

  private predictNextPeak(history: GasHistoryPoint[]): string {
    // Simple prediction: find common peak hours
    const hourCounts: Record<number, number> = {};
    
    for (const point of history) {
      const date = new Date(point.timestamp * 1000);
      const hour = date.getUTCHours();
      if (point.normal > 20) { // Consider as peak
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      }
    }

    let peakHour = 14; // Default to 2pm UTC
    let maxCount = 0;
    
    for (const [hour, count] of Object.entries(hourCounts)) {
      if (count > maxCount) {
        maxCount = count;
        peakHour = parseInt(hour);
      }
    }

    return `${peakHour.toString().padStart(2, '0')}:00 UTC`;
  }

  private predictNextLow(history: GasHistoryPoint[]): string {
    // Find common low hours
    const hourCounts: Record<number, number> = {};
    
    for (const point of history) {
      const date = new Date(point.timestamp * 1000);
      const hour = date.getUTCHours();
      if (point.normal < 10) { // Consider as low
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      }
    }

    let lowHour = 3; // Default to 3am UTC
    let maxCount = 0;
    
    for (const [hour, count] of Object.entries(hourCounts)) {
      if (count > maxCount) {
        maxCount = count;
        lowHour = parseInt(hour);
      }
    }

    return `${lowHour.toString().padStart(2, '0')}:00 UTC`;
  }

  private getDefaultPrediction(chainId: number): GasPrediction {
    return {
      chainId,
      predictedLow: '0',
      predictedNormal: '0',
      predictedFast: '0',
      confidence: 0,
      trend: 'stable',
      nextPeak: 'Unknown',
      nextLow: 'Unknown',
    };
  }

  private toGwei(wei: number): number {
    return wei / 1e9;
  }
}
