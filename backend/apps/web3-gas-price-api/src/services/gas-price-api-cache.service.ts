import { Injectable, Logger } from '@nestjs/common';
import { ChainGasPrice, GasPrediction, GasHistoryPoint } from './gas-price-api.service';

@Injectable()
export class GasPriceApiCacheService {
  private readonly logger = new Logger(GasPriceApiCacheService.name);
  
  // In-memory cache
  private gasPriceCache: Map<number, ChainGasPrice> = new Map();
  private predictionCache: Map<number, GasPrediction> = new Map();
  private historyCache: Map<number, GasHistoryPoint[]> = new Map();
  
  // Cache TTL in milliseconds
  private readonly CACHE_TTL = 30000; // 30 seconds for gas prices
  private readonly HISTORY_MAX_POINTS = 200; // Keep last 200 points per chain

  constructor() {
    // Cleanup old data periodically
    setInterval(() => this.cleanup(), 60000);
  }

  getGasPrice(chainId: number): ChainGasPrice | null {
    const cached = this.gasPriceCache.get(chainId);
    if (!cached) return null;

    // Check if expired
    if (Date.now() - cached.lastUpdated > this.CACHE_TTL) {
      this.gasPriceCache.delete(chainId);
      return null;
    }

    return cached;
  }

  setGasPrice(chainId: number, price: ChainGasPrice): void {
    this.gasPriceCache.set(chainId, price);
  }

  getPrediction(chainId: number): GasPrediction | null {
    const cached = this.predictionCache.get(chainId);
    if (!cached) return null;

    // Predictions are valid for 5 minutes
    const age = Date.now() - (cached as any).cachedAt || 0;
    if (age > 300000) {
      this.predictionCache.delete(chainId);
      return null;
    }

    return cached;
  }

  setPrediction(chainId: number, prediction: GasPrediction): void {
    (prediction as any).cachedAt = Date.now();
    this.predictionCache.set(chainId, prediction);
  }

  addHistoryPoint(chainId: number, point: GasHistoryPoint): void {
    let history = this.historyCache.get(chainId) || [];
    history.push(point);
    
    // Keep only the last N points
    if (history.length > this.HISTORY_MAX_POINTS) {
      history = history.slice(-this.HISTORY_MAX_POINTS);
    }
    
    this.historyCache.set(chainId, history);
  }

  getHistory(chainId: number, hours?: number): GasHistoryPoint[] {
    const history = this.historyCache.get(chainId) || [];
    
    if (!hours) return history;
    
    // Filter by hours
    const cutoff = Math.floor(Date.now() / 1000) - (hours * 3600);
    return history.filter(p => p.timestamp >= cutoff);
  }

  private cleanup(): void {
    // Clean up old predictions
    for (const [chainId, prediction] of this.predictionCache.entries()) {
      const age = Date.now() - ((prediction as any).cachedAt || 0);
      if (age > 300000) {
        this.predictionCache.delete(chainId);
      }
    }
  }
}
