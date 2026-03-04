import { Injectable } from '@nestjs/common';

export interface GasPrice {
  chain: string;
  chainId: number;
  slow: number;
  normal: number;
  fast: number;
  unit: string;
  lastUpdated: string;
  trend: 'rising' | 'falling' | 'stable';
  confidence: number;
}

export interface GasRecommendation {
  recommendedChain: string;
  recommendedSpeed: 'slow' | 'normal' | 'fast';
  estimatedTime: string;
  savings: number;
  savingsPercent: number;
  alternativeChains: AlternativeChain[];
}

export interface AlternativeChain {
  chain: string;
  gasPrice: number;
  estimatedTime: string;
  crossChainCost: number;
  totalCost: number;
  recommendation: string;
}

export interface TransactionEstimate {
  chain: string;
  txType: string;
  slow: number;
  normal: number;
  fast: number;
  currency: string;
}

export interface GasHistoryPoint {
  timestamp: string;
  slow: number;
  normal: number;
  fast: number;
}

export interface ChainComparison {
  chain: string;
  avgGasPrice: number;
  avgConfirmationTime: number;
  score: number;
  recommendation: string;
}

export interface GasAlert {
  id: string;
  chain: string;
  threshold: number;
  condition: 'above' | 'below';
  active: boolean;
  createdAt: string;
}

@Injectable()
export class GasStationNetworkService {
  private readonly chains = [
    { name: 'Ethereum', chainId: 1, unit: 'Gwei' },
    { name: 'Polygon', chainId: 137, unit: 'Gwei' },
    { name: 'Arbitrum', chainId: 42161, unit: 'Gwei' },
    { name: 'Optimism', chainId: 10, unit: 'Gwei' },
    { name: 'BSC', chainId: 56, unit: 'Gwei' },
    { name: 'Base', chainId: 8453, unit: 'Gwei' },
    { name: 'Avalanche', chainId: 43114, unit: 'Gwei' },
    { name: 'zkSync', chainId: 324, unit: 'Gwei' },
    { name: 'Linea', chainId: 59144, unit: 'Gwei' },
    { name: 'Scroll', chainId: 534352, unit: 'Gwei' },
  ];

  private readonly txTypes = [
    'eth_transfer',
    'erc20_transfer',
    'swap',
    'nft_transfer',
    'approve',
    'contract_deploy',
    'stake',
    'unstake',
    'bridge',
  ];

  // Simulated gas prices database (in production, this would come from APIs)
  private getGasPrices(): GasPrice[] {
    const basePrices: Record<string, { slow: number; normal: number; fast: number }> = {
      Ethereum: { slow: 25, normal: 35, fast: 50 },
      Polygon: { slow: 45, normal: 55, fast: 80 },
      Arbitrum: { slow: 0.1, normal: 0.15, fast: 0.25 },
      Optimism: { slow: 0.001, normal: 0.002, fast: 0.005 },
      BSC: { slow: 3, normal: 5, fast: 8 },
      Base: { slow: 0.01, normal: 0.02, fast: 0.05 },
      Avalanche: { slow: 25, normal: 30, fast: 45 },
      zkSync: { slow: 0.001, normal: 0.002, fast: 0.005 },
      Linea: { slow: 0.5, normal: 1, fast: 2 },
      Scroll: { slow: 0.5, normal: 1, fast: 2 },
    };

    return this.chains.map((chain) => {
      const prices = basePrices[chain.name];
      const variance = (Math.random() - 0.5) * 0.2;
      const trend = Math.random() > 0.6 ? 'rising' : Math.random() > 0.5 ? 'falling' : 'stable';
      
      return {
        chain: chain.name,
        chainId: chain.chainId,
        slow: Number((prices.slow * (1 + variance)).toFixed(4)),
        normal: Number((prices.normal * (1 + variance)).toFixed(4)),
        fast: Number((prices.fast * (1 + variance)).toFixed(4)),
        unit: chain.unit,
        lastUpdated: new Date().toISOString(),
        trend,
        confidence: Math.floor(75 + Math.random() * 20),
      };
    });
  }

  // Get all chain gas prices
  async getAllGasPrices(): Promise<{ prices: GasPrice[]; summary: any }> {
    const prices = this.getGasPrices();
    
    const summary = {
      totalChains: prices.length,
      cheapestChain: prices.reduce((min, p) => p.normal < min.normal ? p : min, prices[0]),
      fastestChain: prices.reduce((min, p) => p.fast < min.fast ? p : min, prices[0]),
      overallAvgGas: prices.reduce((sum, p) => sum + p.normal, 0) / prices.length,
      timestamp: new Date().toISOString(),
    };

    return { prices, summary };
  }

  // Get gas price for specific chain
  async getChainGasPrice(chain: string): Promise<GasPrice | null> {
    const prices = this.getGasPrices();
    return prices.find(p => p.chain.toLowerCase() === chain.toLowerCase()) || null;
  }

  // Get gas recommendations for a transaction
  async getRecommendation(txType: string = 'swap'): Promise<GasRecommendation> {
    const prices = this.getGasPrices();
    
    // Sort by normal gas price
    const sorted = [...prices].sort((a, b) => a.normal - b.normal);
    
    const cheapest = sorted[0];
    const recommended = sorted[0].normal < sorted[1].normal * 0.5 ? sorted[0] : sorted[1];
    
    const speedMap = {
      slow: { time: '10-30 min', speed: 'slow' as const },
      normal: { time: '1-5 min', speed: 'normal' as const },
      fast: { time: '< 1 min', speed: 'fast' as const },
    };

    const alternativeChains: AlternativeChain[] = sorted.slice(1, 4).map((chain, idx) => ({
      chain: chain.chain,
      gasPrice: chain.normal,
      estimatedTime: idx === 0 ? '1-3 min' : idx === 1 ? '2-5 min' : '3-10 min',
      crossChainCost: idx === 0 ? 5 : idx === 1 ? 8 : 12,
      totalCost: chain.normal + (idx === 0 ? 5 : idx === 1 ? 8 : 12),
      recommendation: idx === 0 ? 'Good alternative' : idx === 1 ? 'Consider if urgent' : 'Last resort',
    }));

    const savings = sorted[1].normal - sorted[0].normal;
    const savingsPercent = ((savings / sorted[1].normal) * 100);

    return {
      recommendedChain: recommended.chain,
      recommendedSpeed: 'normal',
      estimatedTime: '1-5 min',
      savings: Number(savings.toFixed(4)),
      savingsPercent: Number(savingsPercent.toFixed(1)),
      alternativeChains,
    };
  }

  // Get transaction cost estimates
  async getTransactionEstimates(txType?: string): Promise<TransactionEstimate[]> {
    const prices = this.getGasPrices();
    const multipliers: Record<string, Record<string, number>> = {
      eth_transfer: { slow: 21000, normal: 21000, fast: 21000 },
      erc20_transfer: { slow: 65000, normal: 65000, fast: 65000 },
      swap: { slow: 150000, normal: 180000, fast: 250000 },
      nft_transfer: { slow: 85000, normal: 85000, fast: 85000 },
      approve: { slow: 50000, normal: 50000, fast: 50000 },
      contract_deploy: { slow: 1000000, normal: 1500000, fast: 2000000 },
      stake: { slow: 100000, normal: 120000, fast: 150000 },
      unstake: { slow: 100000, normal: 120000, fast: 150000 },
      bridge: { slow: 200000, normal: 250000, fast: 350000 },
    };

    const type = txType || 'swap';
    const mult = multipliers[type] || multipliers.swap;

    return prices.map(price => ({
      chain: price.chain,
      txType: type,
      slow: Number((price.slow * mult.slow / 1e9).toFixed(6)),
      normal: Number((price.normal * mult.normal / 1e9).toFixed(6)),
      fast: Number((price.fast * mult.fast / 1e9).toFixed(6)),
      currency: price.chain === 'Ethereum' ? 'ETH' : 
                price.chain === 'BSC' ? 'BNB' :
                price.chain === 'Avalanche' ? 'AVAX' : 'MATIC',
    }));
  }

  // Get gas price history
  async getGasHistory(chain: string, days: number = 7): Promise<{ chain: string; history: GasHistoryPoint[] }> {
    const daysCount = Math.min(Math.max(days, 1), 30);
    const history: GasHistoryPoint[] = [];
    
    const basePrice = 30 + Math.random() * 20;
    
    for (let i = daysCount * 24; i >= 0; i -= 24) {
      const date = new Date();
      date.setHours(date.getHours() - i);
      
      const variance = (Math.random() - 0.5) * 0.4;
      history.push({
        timestamp: date.toISOString(),
        slow: Number((basePrice * (0.6 + variance) / 1e9).toFixed(8)),
        normal: Number((basePrice * (1 + variance) / 1e9).toFixed(8)),
        fast: Number((basePrice * (1.4 + variance) / 1e9).toFixed(8)),
      });
    }

    return { chain, history };
  }

  // Compare chains for optimization
  async compareChains(): Promise<ChainComparison[]> {
    const prices = this.getGasPrices();
    const confirmationTimes: Record<string, number> = {
      Ethereum: 12,
      Polygon: 2,
      Arbitrum: 1,
      Optimism: 2,
      BSC: 3,
      Base: 2,
      Avalanche: 1,
      zkSync: 1,
      Linea: 2,
      Scroll: 3,
    };

    return prices.map(price => {
      const confirmTime = confirmationTimes[price.chain];
      const gasScore = 100 - (price.normal * 2);
      const timeScore = 100 - (confirmTime * 10);
      const score = Math.max(0, Math.min(100, (gasScore + timeScore) / 2));

      return {
        chain: price.chain,
        avgGasPrice: price.normal,
        avgConfirmationTime: confirmTime,
        score: Math.round(score),
        recommendation: score > 80 ? 'Highly Recommended' : 
                        score > 60 ? 'Recommended' : 
                        score > 40 ? 'Acceptable' : 'Not Recommended',
      };
    }).sort((a, b) => b.score - a.score);
  }

  // Get best time to transact
  async getBestTimeToTransact(): Promise<{
    bestHour: number;
    bestDay: number;
    estimatedSavings: number;
    pattern: string;
  }> {
    // Simulated historical pattern analysis
    const bestHour = 3 + Math.floor(Math.random() * 3); // Early morning UTC
    const bestDay = 1 + Math.floor(Math.random() * 2); // Weekdays
    
    return {
      bestHour,
      bestDay,
      estimatedSavings: 15 + Math.random() * 20,
      pattern: 'Gas prices are typically lowest during early morning UTC hours (2-5 AM) and on weekdays. Weekend transactions tend to be 10-20% more expensive.',
    };
  }

  // Cross-chain cost analysis
  async getCrossChainAnalysis(fromChain: string, toChain: string): Promise<{
    fromChain: string;
    toChain: string;
    bridgeCost: number;
    gasDiff: number;
    totalSavings: number;
    recommendation: string;
  }> {
    const prices = this.getGasPrices();
    const fromPrice = prices.find(p => p.chain === fromChain)?.normal || 30;
    const toPrice = prices.find(p => p.chain === toChain)?.normal || 30;
    
    const bridgeCosts: Record<string, Record<string, number>> = {
      Ethereum: { Polygon: 5, Arbitrum: 8, Optimism: 6, BSC: 4, Base: 7, Avalanche: 10 },
      Polygon: { Ethereum: 5, Arbitrum: 4, Optimism: 3, BSC: 3, Base: 4, Avalanche: 6 },
      Arbitrum: { Ethereum: 8, Polygon: 4, Optimism: 2, BSC: 6, Base: 3, Avalanche: 8 },
    };

    const bridgeCost = bridgeCosts[fromChain]?.[toChain] || 5;
    const gasDiff = fromPrice - toPrice;
    const totalSavings = gasDiff - bridgeCost;

    return {
      fromChain,
      toChain,
      bridgeCost,
      gasDiff: Number(gasDiff.toFixed(4)),
      totalSavings: Number(totalSavings.toFixed(4)),
      recommendation: totalSavings > 0 
        ? `Switching to ${toChain} could save approximately ${totalSavings.toFixed(2)} in total costs`
        : `Staying on ${fromChain} is more cost-effective`,
    };
  }

  // Get network status
  async getNetworkStatus(): Promise<{
    chains: Array<{
      chain: string;
      status: 'healthy' | 'congested' | 'degraded';
      tps: number;
      avgBlockTime: number;
    }>;
    overallStatus: string;
  }> {
    return {
      chains: this.chains.map(chain => ({
        chain: chain.name,
        status: Math.random() > 0.9 ? 'congested' : Math.random() > 0.8 ? 'degraded' : 'healthy',
        tps: Math.floor(10 + Math.random() * 100),
        avgBlockTime: chain.name === 'Ethereum' ? 12 :
                     chain.name === 'Polygon' ? 2 :
                     chain.name === 'Arbitrum' ? 1 : 3,
      })),
      overallStatus: 'healthy',
    };
  }

  // Gas saving tips
  async getGasSavingTips(): Promise<Array<{
    tip: string;
    savings: string;
    difficulty: 'easy' | 'medium' | 'hard';
  }>> {
    return [
      {
        tip: 'Transact during off-peak hours (2-5 AM UTC)',
        savings: '15-25%',
        difficulty: 'easy',
      },
      {
        tip: 'Use Layer 2 networks (Arbitrum, Optimism, Base)',
        savings: '80-95%',
        difficulty: 'easy',
      },
      {
        tip: 'Set custom gas limits instead of using defaults',
        savings: '5-10%',
        difficulty: 'medium',
      },
      {
        tip: 'Batch multiple transactions together',
        savings: '20-30%',
        difficulty: 'hard',
      },
      {
        tip: 'Use gas tokens (CHI) when available',
        savings: '10-20%',
        difficulty: 'medium',
      },
      {
        tip: 'Consider cross-chain bridges during low-traffic periods',
        savings: '15-25%',
        difficulty: 'medium',
      },
    ];
  }
}
