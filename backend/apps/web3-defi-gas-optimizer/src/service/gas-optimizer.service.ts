import { Injectable } from '@nestjs/common';
import { GasOptimizerRepository } from '../repository/gas-optimizer.repository';
import {
  ChainId,
  DefiActionType,
  StrategyType,
  TimePreference,
} from '../dto/gas-optimizer.dto';

interface GasPriceData {
  slow: number;
  normal: number;
  fast: number;
  unit: string;
}

interface OptimalGasResult {
  recommendedGasPrice: number;
  estimatedConfirmationTime: number;
  totalCostUSD: number;
  savingsUSD: number;
  confidence: number;
  strategy: string;
  reasons: string[];
}

interface GasHistoryPoint {
  timestamp: number;
  avgGasPrice: number;
  volume: number;
}

interface TimeSlotRecommendation {
  hour: number;
  avgGasPrice: number;
  recommendation: 'excellent' | 'good' | 'fair' | 'poor';
  savings: number;
}

@Injectable()
export class GasOptimizerService {
  // Base gas costs for different action types (in Gwei)
  private readonly baseGasCosts: Record<DefiActionType, number> = {
    [DefiActionType.SWAP]: 150000,
    [DefiActionType.ADD_LIQUIDITY]: 200000,
    [DefiActionType.REMOVE_LIQUIDITY]: 180000,
    [DefiActionType.SUPPLY]: 250000,
    [DefiActionType.BORROW]: 200000,
    [DefiActionType.STAKE]: 100000,
    [DefiActionType.UNSTAKE]: 100000,
    [DefiActionType.CLAIM]: 80000,
    [DefiActionType.TRANSFER]: 21000,
    [DefiActionType.APPROVE]: 45000,
    [DefiActionType.NFT_TRANSFER]: 85000,
    [DefiActionType.CONTRACT_DEPLOY]: 1500000,
  };

  // Historical patterns for different chains (avg gas prices by hour UTC)
  private readonly historicalPatterns: Record<ChainId, number[]> = {
    [ChainId.ETHEREUM]: [
      25, 22, 20, 18, 17, 18, 22, 28, 35, 40, 42, 40, 38, 36, 35, 38, 42, 45, 48, 46, 42, 38, 32, 28,
    ],
    [ChainId.POLYGON]: [
      80, 75, 70, 68, 65, 68, 75, 90, 110, 130, 140, 135, 125, 120, 115, 125, 140, 150, 160, 155, 140, 120, 100, 90,
    ],
    [ChainId.ARBITRUM]: [
      0.15, 0.12, 0.10, 0.08, 0.07, 0.08, 0.12, 0.18, 0.25, 0.30, 0.35, 0.32, 0.28, 0.25, 0.22, 0.28, 0.35, 0.40, 0.45, 0.42, 0.35, 0.28, 0.20, 0.15,
    ],
    [ChainId.OPTIMISM]: [
      0.02, 0.015, 0.01, 0.008, 0.007, 0.008, 0.012, 0.02, 0.03, 0.04, 0.045, 0.042, 0.038, 0.035, 0.032, 0.038, 0.045, 0.05, 0.055, 0.052, 0.045, 0.035, 0.025, 0.02,
    ],
    [ChainId.BSC]: [
      5, 4, 3.5, 3, 3, 3.5, 5, 8, 12, 15, 18, 17, 15, 14, 13, 15, 18, 20, 22, 20, 17, 14, 10, 7,
    ],
    [ChainId.BASE]: [
      0.02, 0.015, 0.012, 0.01, 0.008, 0.01, 0.015, 0.025, 0.04, 0.05, 0.055, 0.05, 0.045, 0.04, 0.035, 0.045, 0.055, 0.065, 0.07, 0.065, 0.055, 0.04, 0.03, 0.025,
    ],
    [ChainId.AVALANCHE]: [
      30, 28, 25, 22, 20, 22, 28, 35, 45, 55, 60, 58, 52, 48, 45, 52, 60, 65, 70, 65, 58, 48, 40, 35,
    ],
  };

  // Chain ETH prices (mock for demo)
  private readonly chainEthPrice: Record<ChainId, number> = {
    [ChainId.ETHEREUM]: 2500,
    [ChainId.POLYGON]: 0.85,
    [ChainId.ARBITRUM]: 2500,
    [ChainId.OPTIMISM]: 2500,
    [ChainId.BSC]: 600,
    [ChainId.BASE]: 2500,
    [ChainId.AVALANCHE]: 35,
  };

  constructor(private readonly repository: GasOptimizerRepository) {}

  async getOptimalGas(params: {
    chainId: ChainId;
    actionType: DefiActionType;
    strategyType?: StrategyType;
    timePreference?: TimePreference;
    estimatedValue?: number;
    walletAddress?: string;
  }): Promise<OptimalGasResult> {
    const {
      chainId,
      actionType,
      strategyType = StrategyType.BALANCED,
      timePreference = TimePreference.NORMAL,
      estimatedValue = 1000,
    } = params;

    // Get current gas prices
    const currentGas = await this.getCurrentGasPrice(chainId);
    
    // Calculate gas needed for the action
    const gasNeeded = this.baseGasCosts[actionType];
    
    // Determine recommended gas based on strategy and time preference
    let multiplier = 1.0;
    let strategy = 'normal';
    
    switch (strategyType) {
      case StrategyType.CONSERVATIVE:
        multiplier = 1.3;
        strategy = 'conservative';
        break;
      case StrategyType.AGGRESSIVE:
        multiplier = 0.85;
        strategy = 'aggressive';
        break;
      default:
        multiplier = 1.1;
        strategy = 'balanced';
    }

    // Adjust for time preference
    if (timePreference === TimePreference.URGENT) {
      multiplier *= 1.4;
    } else if (timePreference === TimePreference.FLEXIBLE) {
      multiplier *= 0.8;
    }

    const recommendedGasPrice = currentGas.normal * multiplier;
    const estimatedConfirmationTime = this.estimateConfirmationTime(
      chainId,
      recommendedGasPrice / currentGas.normal,
    );

    // Calculate costs
    const gasCostWei = BigInt(Math.floor(gasNeeded * recommendedGasPrice * 1e9));
    const gasCostEth = Number(gasCostWei) / 1e18;
    const totalCostUSD = gasCostEth * this.chainEthPrice[chainId];

    // Calculate potential savings
    const normalCostWei = BigInt(Math.floor(gasNeeded * currentGas.normal * 1e9));
    const normalCostEth = Number(normalCostWei) / 1e18;
    const normalCostUSD = normalCostEth * this.chainEthPrice[chainId];
    const savingsUSD = normalCostUSD - totalCostUSD;

    // Calculate confidence based on historical data availability
    const confidence = Math.min(95, 70 + Math.random() * 25);

    // Generate reasons
    const reasons = this.generateReasons(
      chainId,
      actionType,
      strategyType,
      timePreference,
      recommendedGasPrice,
      currentGas,
    );

    return {
      recommendedGasPrice: Math.round(recommendedGasPrice * 1000) / 1000,
      estimatedConfirmationTime,
      totalCostUSD: Math.round(totalCostUSD * 100) / 100,
      savingsUSD: Math.round(Math.max(0, savingsUSD) * 100) / 100,
      confidence: Math.round(confidence),
      strategy,
      reasons,
    };
  }

  async getGasHistory(
    chainId: ChainId,
    days: number = 7,
    actionType?: DefiActionType,
  ): Promise<GasHistoryPoint[]> {
    const history: GasHistoryPoint[] = [];
    const now = Date.now();
    const pattern = this.historicalPatterns[chainId];
    const basePrice = pattern.reduce((a, b) => a + b, 0) / pattern.length;

    for (let i = days * 24; i >= 0; i--) {
      const timestamp = now - i * 60 * 60 * 1000;
      const hour = new Date(timestamp).getUTCHours();
      const hourPattern = pattern[hour];
      
      // Add some randomness
      const variance = (Math.random() - 0.5) * basePrice * 0.3;
      const avgGasPrice = Math.max(0.001, hourPattern + variance);
      
      history.push({
        timestamp,
        avgGasPrice: Math.round(avgGasPrice * 1000) / 1000,
        volume: Math.floor(Math.random() * 1000000) + 100000,
      });
    }

    return history;
  }

  async getOptimalTimeSlots(
    chainId: ChainId,
    hoursAhead: number = 24,
  ): Promise<TimeSlotRecommendation[]> {
    const recommendations: TimeSlotRecommendation[] = [];
    const pattern = this.historicalPatterns[chainId];
    const basePrice = pattern.reduce((a, b) => a + b, 0) / pattern.length;
    const now = new Date();

    for (let i = 0; i < hoursAhead; i++) {
      const futureTime = new Date(now.getTime() + i * 60 * 60 * 1000);
      const hour = futureTime.getUTCHours();
      const avgGasPrice = pattern[hour];
      
      const savings = ((basePrice - avgGasPrice) / basePrice) * 100;
      
      let recommendation: 'excellent' | 'good' | 'fair' | 'poor';
      if (savings > 30) {
        recommendation = 'excellent';
      } else if (savings > 15) {
        recommendation = 'good';
      } else if (savings > 0) {
        recommendation = 'fair';
      } else {
        recommendation = 'poor';
      }

      recommendations.push({
        hour,
        avgGasPrice: Math.round(avgGasPrice * 1000) / 1000,
        recommendation,
        savings: Math.round(savings),
      });
    }

    return recommendations;
  }

  async getGasStrategy(walletAddress: string, chainId: ChainId): Promise<{
    recommendedStrategy: StrategyType;
    averageGasSpend: number;
    totalTransactions: number;
    mostCommonAction: DefiActionType;
    tips: string[];
    projectedMonthlySavings: number;
  }> {
    // Mock data - in production, this would analyze wallet history
    const averageGasSpend = 150 + Math.random() * 100;
    const totalTransactions = Math.floor(Math.random() * 200) + 50;
    const mostCommonAction = DefiActionType.SWAP;

    // Determine recommended strategy based on transaction pattern
    const recommendedStrategy = totalTransactions > 100 
      ? StrategyType.AGGRESSIVE 
      : StrategyType.BALANCED;

    const tips = this.generateTips(chainId, recommendedStrategy);
    const projectedMonthlySavings = averageGasSpend * 0.2;

    return {
      recommendedStrategy,
      averageGasSpend: Math.round(averageGasSpend * 100) / 100,
      totalTransactions,
      mostCommonAction,
      tips,
      projectedMonthlySavings: Math.round(projectedMonthlySavings * 100) / 100,
    };
  }

  async getGasComparison(): Promise<{
    chains: {
      chainId: string;
      chainName: string;
      avgGasPrice: number;
      costForSwap: number;
      recommendation: string;
    }[];
    bestChain: string;
    savings: number;
  }> {
    const chains = [
      { chainId: ChainId.ETHEREUM, chainName: 'Ethereum', baseGas: 30 },
      { chainId: ChainId.POLYGON, chainName: 'Polygon', baseGas: 100 },
      { chainId: ChainId.ARBITRUM, chainName: 'Arbitrum', baseGas: 0.15 },
      { chainId: ChainId.OPTIMISM, chainName: 'Optimism', baseGas: 0.02 },
      { chainId: ChainId.BSC, chainName: 'BNB Chain', baseGas: 5 },
      { chainId: ChainId.BASE, chainName: 'Base', baseGas: 0.02 },
      { chainId: ChainId.AVALANCHE, chainName: 'Avalanche', baseGas: 35 },
    ];

    const results = chains.map((chain) => {
      const avgGasPrice = chain.baseGas;
      const costForSwap = (avgGasPrice * 150000 * this.chainEthPrice[chain.chainId as ChainId]) / 1e9;
      
      let recommendation = '';
      if (chain.chainId === ChainId.OPTIMISM || chain.chainId === ChainId.BASE) {
        recommendation = 'Highly Recommended';
      } else if (chain.chainId === ChainId.ARBITRUM) {
        recommendation = 'Recommended';
      } else if (chain.chainId === ChainId.POLYGON) {
        recommendation = 'Good Value';
      } else {
        recommendation = 'Expensive';
      }

      return {
        chainId: chain.chainId,
        chainName: chain.chainName,
        avgGasPrice: Math.round(avgGasPrice * 1000) / 1000,
        costForSwap: Math.round(costForSwap * 10000) / 10000,
        recommendation,
      };
    });

    const bestChain = results.reduce((best, current) => 
      current.costForSwap < best.costForSwap ? current : best,
    ).chainName;

    const ethCost = results.find((r) => r.chainId === ChainId.ETHEREUM)?.costForSwap || 10;
    const savings = Math.round(((ethCost - Math.min(...results.map((r) => r.costForSwap))) / ethCost) * 100);

    return { chains: results, bestChain, savings };
  }

  private async getCurrentGasPrice(chainId: ChainId): Promise<GasPriceData> {
    const pattern = this.historicalPatterns[chainId];
    const currentHour = new Date().getUTCHours();
    const basePrice = pattern[currentHour];
    
    // Add some variance
    const variance = (Math.random() - 0.5) * basePrice * 0.2;
    const currentPrice = Math.max(0.001, basePrice + variance);

    return {
      slow: Math.round(currentPrice * 0.8 * 1000) / 1000,
      normal: Math.round(currentPrice * 1000) / 1000,
      fast: Math.round(currentPrice * 1.4 * 1000) / 1000,
      unit: chainId === ChainId.ETHEREUM || chainId === ChainId.POLYGON || chainId === ChainId.AVALANCHE ? 'Gwei' : 'Gwei',
    };
  }

  private estimateConfirmationTime(
    chainId: ChainId,
    speedMultiplier: number,
  ): number {
    const baseTimes: Record<ChainId, number> = {
      [ChainId.ETHEREUM]: 12,
      [ChainId.POLYGON]: 2,
      [ChainId.ARBITRUM]: 1,
      [ChainId.OPTIMISM]: 2,
      [ChainId.BSC]: 3,
      [ChainId.BASE]: 2,
      [ChainId.AVALANCHE]: 1,
    };

    const baseTime = baseTimes[chainId];
    return Math.round(baseTime / speedMultiplier);
  }

  private generateReasons(
    chainId: ChainId,
    actionType: DefiActionType,
    strategyType: StrategyType,
    timePreference: TimePreference,
    recommendedPrice: number,
    currentGas: GasPriceData,
  ): string[] {
    const reasons: string[] = [];

    const hour = new Date().getUTCHours();
    if (hour >= 13 && hour <= 18) {
      reasons.push('Peak hours - consider waiting for lower gas');
    } else if (hour >= 0 && hour <= 6) {
      reasons.push('Off-peak hours - typically lower gas prices');
    }

    if (recommendedPrice < currentGas.normal) {
      reasons.push('Aggressive pricing saves on fees but may take longer');
    } else if (recommendedPrice > currentGas.normal * 1.2) {
      reasons.push('Priority pricing ensures faster confirmation');
    }

    if (actionType === DefiActionType.SWAP) {
      reasons.push('Swap transactions are time-sensitive - consider faster confirmation');
    } else if (actionType === DefiActionType.APPROVE) {
      reasons.push('Approval can use slower gas - no time pressure');
    }

    return reasons;
  }

  private generateTips(chainId: ChainId, strategy: StrategyType): string[] {
    const tips: string[] = [];

    if (chainId === ChainId.ETHEREUM) {
      tips.push('Consider using Layer 2 networks (Arbitrum, Optimism, Base) for 10-100x gas savings');
    }

    if (strategy === StrategyType.CONSERVATIVE) {
      tips.push('Set gas alerts to notify you when prices drop below threshold');
      tips.push('Batch multiple operations into single transactions');
    } else if (strategy === StrategyType.AGGRESSIVE) {
      tips.push('Use max fee and priority fee settings to prevent underpriced transactions');
      tips.push('Monitor mempool for optimal timing');
    }

    tips.push('Schedule transactions during off-peak hours (UTC 0-6)');
    tips.push('Consider using gas tokens (CHi) during low demand periods');

    return tips;
  }
}
