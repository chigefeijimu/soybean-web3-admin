import { Injectable } from '@nestjs/common';

interface GasPriceData {
  timestamp: number;
  slow: number;
  normal: number;
  fast: number;
}

interface Prediction {
  timeframe: string;
  predicted: number;
  confidence: number;
  trend: 'up' | 'down' | 'stable';
  recommendation: string;
}

interface ChainGasInfo {
  chainId: number;
  chainName: string;
  current: {
    slow: number;
    normal: number;
    fast: number;
  };
  predictions: Prediction[];
  historical: GasPriceData[];
  analysis: {
    volatility: 'low' | 'medium' | 'high';
    trend: string;
    bestTimeToTransact: string;
    avgPrice: number;
  };
}

@Injectable()
export class GasPricePredictionService {
  // Simulated historical gas data (in production, this would come from a database)
  private historicalData: Map<number, GasPriceData[]> = new Map();
  
  // Chain configurations
  private chains = [
    { id: 1, name: 'Ethereum', symbol: 'ETH' },
    { id: 137, name: 'Polygon', symbol: 'MATIC' },
    { id: 42161, name: 'Arbitrum', symbol: 'ETH' },
    { id: 10, name: 'Optimism', symbol: 'ETH' },
    { id: 56, name: 'BNB Chain', symbol: 'BNB' },
    { id: 8453, name: 'Base', symbol: 'ETH' },
    { id: 43114, name: 'Avalanche', symbol: 'AVAX' },
  ];

  constructor() {
    this.initializeHistoricalData();
  }

  private initializeHistoricalData() {
    // Generate 7 days of historical data for each chain
    const now = Date.now();
    const hourMs = 3600000;
    
    this.chains.forEach(chain => {
      const data: GasPriceData[] = [];
      let basePrice = this.getBasePrice(chain.id);
      
      for (let i = 168; i >= 0; i--) { // 7 days * 24 hours
        const timestamp = now - (i * hourMs);
        
        // Simulate realistic gas price patterns
        const hourOfDay = new Date(timestamp).getHours();
        const dayOfWeek = new Date(timestamp).getDay();
        
        // Higher during peak hours (9-18 UTC), lower on weekends
        let multiplier = 1;
        if (hourOfDay >= 9 && hourOfDay <= 18) {
          multiplier = 1.3;
        } else if (hourOfDay >= 0 && hourOfDay <= 6) {
          multiplier = 0.7;
        }
        
        if (dayOfWeek === 0 || dayOfWeek === 6) {
          multiplier *= 0.8;
        }
        
        // Add some randomness
        const randomFactor = 0.8 + Math.random() * 0.4;
        
        const normalPrice = basePrice * multiplier * randomFactor;
        
        data.push({
          timestamp,
          slow: Math.round(normalPrice * 0.7 * 100) / 100,
          normal: Math.round(normalPrice * 100) / 100,
          fast: Math.round(normalPrice * 1.4 * 100) / 100,
        });
        
        // Slowly change base price for trends
        basePrice *= 0.99 + Math.random() * 0.02;
      }
      
      this.historicalData.set(chain.id, data);
    });
  }

  private getBasePrice(chainId: number): number {
    const basePrices: Record<number, number> = {
      1: 25,      // Ethereum
      137: 50,    // Polygon (in Gwei)
      42161: 0.1, // Arbitrum
      10: 0.01,   // Optimism
      56: 3,      // BNB Chain
      8453: 0.01, // Base
      43114: 25,  // Avalanche
    };
    return basePrices[chainId] || 10;
  }

  private calculateSMA(data: number[], period: number): number {
    if (data.length < period) return data[data.length - 1] || 0;
    const slice = data.slice(-period);
    return slice.reduce((a, b) => a + b, 0) / slice.length;
  }

  private calculateEMA(data: number[], period: number): number {
    if (data.length === 0) return 0;
    const k = 2 / (period + 1);
    let ema = data[0];
    for (let i = 1; i < data.length; i++) {
      ema = data[i] * k + ema * (1 - k);
    }
    return ema;
  }

  private calculateVolatility(data: number[]): number {
    if (data.length < 2) return 0;
    const mean = data.reduce((a, b) => a + b, 0) / data.length;
    const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
    return Math.sqrt(variance) / mean;
  }

  private predictFuture(current: number, historical: number[], hoursAhead: number): Prediction {
    const sma24 = this.calculateSMA(historical, 24);
    const sma168 = this.calculateSMA(historical, 168);
    const ema12 = this.calculateEMA(historical, 12);
    const volatility = this.calculateVolatility(historical.slice(-48));
    
    // Calculate trend
    const trend = sma24 > sma168 * 1.1 ? 'up' : sma24 < sma168 * 0.9 ? 'down' : 'stable';
    
    // Simple linear regression for prediction
    const n = historical.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    const recentData = historical.slice(-24);
    
    for (let i = 0; i < recentData.length; i++) {
      sumX += i;
      sumY += recentData[i];
      sumXY += i * recentData[i];
      sumX2 += i * i;
    }
    
    const slope = n > 1 ? (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX) : 0;
    
    // Predict based on trend and seasonality
    let predicted = current;
    const hourOfDay = new Date().getHours();
    
    // Apply trend
    predicted += slope * hoursAhead;
    
    // Apply time-of-day factor
    const futureHour = (hourOfDay + hoursAhead) % 24;
    if (futureHour >= 9 && futureHour <= 18) {
      predicted *= 1.15;
    } else if (futureHour >= 0 && futureHour <= 6) {
      predicted *= 0.85;
    }
    
    // Confidence based on data consistency
    const confidence = Math.max(50, Math.min(95, 100 - volatility * 100));
    
    // Recommendation
    let recommendation = '';
    if (predicted < current * 0.8) {
      recommendation = 'Wait for lower prices';
    } else if (predicted > current * 1.2) {
      recommendation = ' transact now to avoid higher fees';
    } else if (trend === 'up') {
      recommendation = 'Consider transacting soon';
    } else {
      recommendation = 'Normal conditions';
    }
    
    return {
      timeframe: `${hoursAhead}h`,
      predicted: Math.round(predicted * 100) / 100,
      confidence: Math.round(confidence),
      trend: trend === 1 ? 'up' : trend === -1 ? 'down' : 'stable',
      recommendation,
    };
  }

  getPrediction(chainId?: number): ChainGasInfo[] {
    if (chainId) {
      return [this.getChainPrediction(chainId)];
    }
    
    return this.chains.map(chain => this.getChainPrediction(chain.id));
  }

  private getChainPrediction(chainId: number): ChainGasInfo {
    const chain = this.chains.find(c => c.id === chainId);
    const historical = this.historicalData.get(chainId) || [];
    const recentPrices = historical.slice(-24).map(d => d.normal);
    
    const current = recentPrices[recentPrices.length - 1] || this.getBasePrice(chainId);
    const avgPrice = recentPrices.reduce((a, b) => a + b, 0) / recentPrices.length;
    
    // Calculate volatility level
    const volatility = this.calculateVolatility(recentPrices);
    let volatilityLevel: 'low' | 'medium' | 'high' = 'medium';
    if (volatility < 0.15) volatilityLevel = 'low';
    else if (volatility > 0.35) volatilityLevel = 'high';
    
    // Determine trend
    const sma24 = this.calculateSMA(recentPrices, 24);
    const sma168 = this.calculateSMA(recentPrices, 168);
    let trend = 'stable';
    if (sma24 > avgPrice * 1.1) trend = 'rising';
    else if (sma24 < avgPrice * 0.9) trend = 'falling';
    
    // Best time to transact
    const currentHour = new Date().getHours();
    let bestTime = currentHour >= 9 && currentHour <= 18 
      ? 'Off-peak hours (22:00-06:00 UTC)' 
      : 'Current time is good';
    
    return {
      chainId,
      chainName: chain?.name || 'Unknown',
      current: {
        slow: Math.round(current * 0.7 * 100) / 100,
        normal: Math.round(current * 100) / 100,
        fast: Math.round(current * 1.4 * 100) / 100,
      },
      predictions: [
        this.predictFuture(current, recentPrices, 1),
        this.predictFuture(current, recentPrices, 4),
        this.predictFuture(current, recentPrices, 12),
        this.predictFuture(current, recentPrices, 24),
      ],
      historical: historical.slice(-48),
      analysis: {
        volatility: volatilityLevel,
        trend,
        bestTimeToTransact: bestTime,
        avgPrice: Math.round(avgPrice * 100) / 100,
      },
    };
  }

  getHistorical(chainId: number, hours: number = 24): GasPriceData[] {
    const data = this.historicalData.get(chainId) || [];
    return data.slice(-Math.min(hours, data.length));
  }

  getAnalysis(chainId: number): any {
    return this.getChainPrediction(chainId)[0]?.analysis || {};
  }
}
