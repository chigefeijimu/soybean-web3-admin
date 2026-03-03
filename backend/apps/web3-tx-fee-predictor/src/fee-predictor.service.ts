import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

interface FeeData {
  gasPrice: number;
  gasPriceUSD: number;
  timestamp: number;
}

export interface FeePrediction {
  current: number;
  predicted: {
    '1h': number;
    '4h': number;
    '12h': number;
    '24h': number;
  };
  trend: 'rising' | 'falling' | 'stable';
  confidence: number;
  optimalTime: string;
  savings: {
    potential: number;
    percentage: number;
  };
}

interface ChainConfig {
  name: string;
  symbol: string;
  color: string;
  baseGasLimit: {
    eth_transfer: number;
    erc20_transfer: number;
    swap: number;
    nft_transfer: number;
    contract_deploy: number;
    staking: number;
    bridge: number;
  };
}

@Injectable()
export class FeePredictorService {
  private readonly chainConfigs: Record<string, ChainConfig> = {
    ethereum: {
      name: 'Ethereum',
      symbol: 'ETH',
      color: '#627EEA',
      baseGasLimit: {
        eth_transfer: 21000,
        erc20_transfer: 65000,
        swap: 150000,
        nft_transfer: 85000,
        contract_deploy: 2000000,
        staking: 100000,
        bridge: 200000,
      },
    },
    polygon: {
      name: 'Polygon',
      symbol: 'MATIC',
      color: '#8247E5',
      baseGasLimit: {
        eth_transfer: 21000,
        erc20_transfer: 65000,
        swap: 150000,
        nft_transfer: 85000,
        contract_deploy: 1500000,
        staking: 100000,
        bridge: 150000,
      },
    },
    arbitrum: {
      name: 'Arbitrum',
      symbol: 'ETH',
      color: '#28A0F0',
      baseGasLimit: {
        eth_transfer: 21000,
        erc20_transfer: 65000,
        swap: 130000,
        nft_transfer: 75000,
        contract_deploy: 1000000,
        staking: 80000,
        bridge: 150000,
      },
    },
    optimism: {
      name: 'Optimism',
      symbol: 'ETH',
      color: '#FF0420',
      baseGasLimit: {
        eth_transfer: 21000,
        erc20_transfer: 65000,
        swap: 130000,
        nft_transfer: 75000,
        contract_deploy: 1000000,
        staking: 80000,
        bridge: 150000,
      },
    },
    bsc: {
      name: 'BNB Chain',
      symbol: 'BNB',
      color: '#F3BA2F',
      baseGasLimit: {
        eth_transfer: 21000,
        erc20_transfer: 65000,
        swap: 120000,
        nft_transfer: 75000,
        contract_deploy: 800000,
        staking: 80000,
        bridge: 120000,
      },
    },
    base: {
      name: 'Base',
      symbol: 'ETH',
      color: '#0052FF',
      baseGasLimit: {
        eth_transfer: 21000,
        erc20_transfer: 65000,
        swap: 130000,
        nft_transfer: 75000,
        contract_deploy: 1000000,
        staking: 80000,
        bridge: 150000,
      },
    },
    avalanche: {
      name: 'Avalanche',
      symbol: 'AVAX',
      color: '#E84142',
      baseGasLimit: {
        eth_transfer: 21000,
        erc20_transfer: 65000,
        swap: 150000,
        nft_transfer: 85000,
        contract_deploy: 1500000,
        staking: 100000,
        bridge: 180000,
      },
    },
  };

  constructor(private readonly httpService: HttpService) {}

  async predictFee(chain: string, transactionType: string, gasLimit?: number): Promise<FeePrediction> {
    const config = this.chainConfigs[chain];
    if (!config) {
      throw new Error(`Unsupported chain: ${chain}`);
    }

    const limit = gasLimit || config.baseGasLimit[transactionType] || 21000;
    
    // Simulate current gas price (in real implementation, fetch from RPC)
    const currentGasPrice = await this.getCurrentGasPrice(chain);
    
    // AI prediction based on historical patterns
    const prediction = this.generatePrediction(currentGasPrice);
    
    const optimalHour = prediction.optimalTime.split(':')[0];
    const currentHour = new Date().getHours();
    const hoursUntilOptimal = (parseInt(optimalHour) - currentHour + 24) % 24;
    
    const potentialSavings = currentGasPrice * limit * (hoursUntilOptimal > 2 ? 0.15 : 0);
    
    return {
      current: currentGasPrice,
      predicted: prediction.predicted,
      trend: prediction.trend,
      confidence: prediction.confidence,
      optimalTime: prediction.optimalTime,
      savings: {
        potential: Math.round(potentialSavings),
        percentage: hoursUntilOptimal > 2 ? 15 : 5,
      },
    };
  }

  private async getCurrentGasPrice(chain: string): Promise<number> {
    // Simulated gas prices in Gwei
    const gasPrices: Record<string, number[]> = {
      ethereum: [15, 25, 35, 45, 60, 80, 45, 30, 20, 15, 12, 10],
      polygon: [50, 80, 120, 180, 250, 300, 180, 100, 70, 50, 45, 40],
      arbitrum: [0.1, 0.15, 0.2, 0.3, 0.5, 0.8, 0.4, 0.2, 0.15, 0.1, 0.08, 0.05],
      optimism: [0.001, 0.002, 0.005, 0.01, 0.02, 0.05, 0.015, 0.005, 0.002, 0.001, 0.0008, 0.0005],
      bsc: [3, 5, 8, 12, 18, 25, 15, 8, 5, 3, 2.5, 2],
      base: [0.01, 0.02, 0.05, 0.1, 0.2, 0.3, 0.15, 0.05, 0.02, 0.01, 0.008, 0.005],
      avalanche: [20, 30, 45, 70, 100, 150, 80, 45, 30, 20, 15, 12],
    };
    
    const prices = gasPrices[chain] || gasPrices.ethereum;
    const hour = new Date().getHours();
    return prices[hour] || prices[0];
  }

  private generatePrediction(currentPrice: number): any {
    const hour = new Date().getHours();
    
    // Predict based on time of day patterns
    let trend: 'rising' | 'falling' | 'stable' = 'stable';
    let predicted: any = {};
    let confidence = 75;

    // US evening hours typically have higher fees
    if (hour >= 13 && hour <= 21) {
      trend = 'rising';
      predicted = {
        '1h': currentPrice * 1.2,
        '4h': currentPrice * 1.4,
        '12h': currentPrice * 1.3,
        '24h': currentPrice * 1.1,
      };
    } else if (hour >= 0 && hour <= 6) {
      trend = 'falling';
      predicted = {
        '1h': currentPrice * 0.7,
        '4h': currentPrice * 0.5,
        '12h': currentPrice * 0.6,
        '24h': currentPrice * 0.8,
      };
      confidence = 85;
    } else {
      predicted = {
        '1h': currentPrice * 0.95,
        '4h': currentPrice * 0.9,
        '12h': currentPrice * 1.05,
        '24h': currentPrice * 1.0,
      };
    }

    // Find optimal time (typically early morning UTC)
    const optimalHour = (24 - hour + 5) % 24;
    const optimalTime = `${optimalHour.toString().padStart(2, '0')}:00`;

    return { predicted, trend, confidence, optimalTime };
  }

  async getHistoricalFees(chain: string, timeRange: string = '7d'): Promise<any> {
    const config = this.chainConfigs[chain];
    if (!config) {
      throw new Error(`Unsupported chain: ${chain}`);
    }

    const days = timeRange === '24h' ? 1 : timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 7;
    const dataPoints = days * 24;
    
    const historicalData = [];
    const now = Date.now();
    
    for (let i = dataPoints; i >= 0; i--) {
      const timestamp = now - i * 3600 * 1000;
      const hour = new Date(timestamp).getHours();
      
      // Simulate historical gas prices
      let basePrice = 20;
      if (chain === 'polygon') basePrice = 80;
      else if (chain === 'arbitrum' || chain === 'optimism' || chain === 'base') basePrice = 0.1;
      else if (chain === 'bsc') basePrice = 5;
      else if (chain === 'avalanche') basePrice = 30;
      
      // Add time-based variation
      const variation = Math.sin((hour / 24) * Math.PI * 2) * 0.3 + 
                       Math.random() * 0.2;
      const price = basePrice * (1 + variation);
      
      historicalData.push({
        timestamp,
        date: new Date(timestamp).toISOString(),
        gasPrice: Math.round(price * 100) / 100,
        unit: chain === 'arbitrum' || chain === 'optimism' || chain === 'base' ? 'gwei' : 'gwei',
      });
    }

    // Calculate statistics
    const prices = historicalData.map(d => d.gasPrice);
    const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
    const min = Math.min(...prices);
    const max = Math.max(...prices);

    return {
      chain,
      chainName: config.name,
      symbol: config.symbol,
      timeRange,
      statistics: {
        average: Math.round(avg * 100) / 100,
        minimum: Math.round(min * 100) / 100,
        maximum: Math.round(max * 100) / 100,
        volatility: Math.round((max - min) / avg * 100),
      },
      data: historicalData,
    };
  }

  async getFeeComparison(chains: string[], transactionType?: string, gasLimit?: number): Promise<any> {
    const results = [];
    
    for (const chain of chains) {
      const config = this.chainConfigs[chain];
      if (!config) continue;

      const limit = gasLimit || config.baseGasLimit[transactionType || 'swap'] || 21000;
      const currentGasPrice = await this.getCurrentGasPrice(chain);
      const feeUSD = await this.estimateFeeUSD(chain, currentGasPrice, limit);
      
      results.push({
        chain,
        chainName: config.name,
        symbol: config.symbol,
        color: config.color,
        gasPrice: currentGasPrice,
        gasLimit: limit,
        estimatedFee: Math.round(currentGasPrice * limit),
        estimatedFeeUSD: feeUSD,
        timestamp: Date.now(),
      });
    }

    // Sort by fee (ascending)
    results.sort((a, b) => a.estimatedFeeUSD - b.estimatedFeeUSD);

    return {
      recommendations: {
        cheapest: results[0],
        fastest: results[results.length - 1],
        balanced: results[Math.floor(results.length / 2)],
      },
      chains: results,
    };
  }

  async getOptimalTime(chain: string, transactionType: string, days: number = 3): Promise<any> {
    const config = this.chainConfigs[chain];
    if (!config) {
      throw new Error(`Unsupported chain: ${chain}`);
    }

    const optimalSlots = [];
    const now = Date.now();
    
    for (let d = 0; d < days; d++) {
      for (let h = 0; h < 24; h++) {
        const timestamp = now + d * 24 * 3600 * 1000;
        const date = new Date(timestamp);
        date.setHours(h, 0, 0, 0);
        
        // Predict fee for this hour
        const predictedFee = await this.getCurrentGasPrice(chain);
        const adjustedFee = this.adjustFeeForHour(predictedFee, h);
        
        optimalSlots.push({
          date: date.toISOString().split('T')[0],
          hour: h,
          time: `${h.toString().padStart(2, '0')}:00`,
          predictedFee: Math.round(adjustedFee * 100) / 100,
          score: this.calculateScore(adjustedFee),
        });
      }
    }

    // Sort by score (lower is better)
    optimalSlots.sort((a, b) => a.score - b.score);

    return {
      chain,
      chainName: config.name,
      transactionType,
      recommendation: optimalSlots[0],
      top5OptimalTimes: optimalSlots.slice(0, 5),
      allSlots: optimalSlots.slice(0, 24), // Return top 24 hours
    };
  }

  private adjustFeeForHour(baseFee: number, hour: number): number {
    // US timezone patterns
    if (hour >= 13 && hour <= 21) {
      return baseFee * 1.5; // Peak hours
    } else if (hour >= 0 && hour <= 6) {
      return baseFee * 0.6; // Off-peak
    }
    return baseFee;
  }

  private calculateScore(fee: number): number {
    // Score based on fee (lower is better)
    return Math.round(fee * 100);
  }

  private async estimateFeeUSD(chain: string, gasPrice: number, gasLimit: number): Promise<number> {
    // Get ETH price (simulated)
    const ethPrice = 2500; // Would fetch from price API
    const gasPriceETH = gasPrice * 1e-9;
    return gasPriceETH * gasLimit * ethPrice;
  }

  async getFeeAlerts(chain: string, thresholdGwei: number): Promise<any> {
    const currentGasPrice = await this.getCurrentGasPrice(chain);
    const isBelowThreshold = currentGasPrice < thresholdGwei;
    
    return {
      chain,
      currentGasPrice,
      thresholdGwei,
      isBelowThreshold,
      message: isBelowThreshold 
        ? `Current gas (${currentGasPrice} gwei) is below your threshold of ${thresholdGwei} gwei!`
        : `Current gas (${currentGasPrice} gwei) is above your threshold of ${thresholdGwei} gwei.`,
      nextCheck: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    };
  }

  async getGasPriceRecommendations(chain: string): Promise<any> {
    const currentGasPrice = await this.getCurrentGasPrice(chain);
    const config = this.chainConfigs[chain];
    
    if (!config) {
      throw new Error(`Unsupported chain: ${chain}`);
    }

    // Calculate recommendations for different speeds
    const slowMultiplier = 0.9;
    const normalMultiplier = 1.0;
    const fastMultiplier = 1.2;

    return {
      chain,
      chainName: config.name,
      symbol: config.symbol,
      recommendations: {
        slow: {
          gasPrice: Math.round(currentGasPrice * slowMultiplier * 100) / 100,
          estimatedTime: '10-30 min',
          savings: Math.round((1 - slowMultiplier) * 100),
        },
        normal: {
          gasPrice: Math.round(currentGasPrice * normalMultiplier * 100) / 100,
          estimatedTime: '1-5 min',
          savings: 0,
        },
        fast: {
          gasPrice: Math.round(currentGasPrice * fastMultiplier * 100) / 100,
          estimatedTime: '< 1 min',
          savings: -Math.round((fastMultiplier - 1) * 100),
        },
      },
      timestamp: Date.now(),
    };
  }
}
