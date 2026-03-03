import { Injectable } from '@nestjs/common';

export interface ChainGasData {
  chain: string;
  chainId: number;
  current: {
    slow: number;
    average: number;
    fast: number;
  };
  historical: {
    avg24h: number;
    avg7d: number;
    avg30d: number;
  };
  prediction: {
    1h: number;
    4h: number;
    12h: number;
    24h: number;
  };
  trend: 'rising' | 'falling' | 'stable';
  confidence: number;
  bestTime: string;
  networkStatus: 'healthy' | 'congested' | 'degraded';
}

export interface GasAnalysis {
  chain: string;
  gasSaved: number;
  recommendedSpeed: 'slow' | 'average' | 'fast';
  savingsPercent: number;
  nextOptimalWindow: {
    start: string;
    end: string;
    expectedGas: number;
  };
}

export interface CrossChainGasComparison {
  fromChain: string;
  toChain: string;
  recommendedBridge: string;
  totalCost: number;
  timeEstimate: string;
  savingsVsNative: number;
}

@Injectable()
export class GasSmartDashboardService {
  private readonly chains = [
    { name: 'Ethereum', id: 1, symbol: 'ETH', color: '#627EEA' },
    { name: 'Polygon', id: 137, symbol: 'MATIC', color: '#8247E5' },
    { name: 'Arbitrum', id: 42161, symbol: 'ETH', color: '#28A0F0' },
    { name: 'Optimism', id: 10, symbol: 'ETH', color: '#FF0420' },
    { name: 'BSC', id: 56, symbol: 'BNB', color: '#F3BA2F' },
    { name: 'Base', id: 8453, symbol: 'ETH', color: '#0052FF' },
    { name: 'Avalanche', id: 43114, symbol: 'AVAX', color: '#E84142' },
    { name: 'zkSync', id: 324, symbol: 'ETH', color: '#F8B703' },
    { name: 'Starknet', id: 0, symbol: 'ETH', color: '#0AA5FF' },
    { name: 'Linea', id: 59144, symbol: 'ETH', color: '#121212' },
  ];

  async getAllChainsGas(): Promise<ChainGasData[]> {
    const results: ChainGasData[] = [];
    
    for (const chain of this.chains) {
      results.push(await this.getChainGasData(chain.name, chain.id));
    }
    
    return results;
  }

  async getChainGasData(chain: string, chainId: number): Promise<ChainGasData> {
    const baseGas = this.getBaseGasForChain(chain);
    const variance = Math.random() * 0.3 - 0.15;
    
    const current = {
      slow: Math.round(baseGas * (0.7 + variance)),
      average: Math.round(baseGas * (1 + variance)),
      fast: Math.round(baseGas * (1.4 + variance)),
    };

    const trend = variance > 0.1 ? 'rising' : variance < -0.1 ? 'falling' : 'stable';
    
    return {
      chain,
      chainId,
      current,
      historical: {
        avg24h: Math.round(baseGas * (0.95 + Math.random() * 0.1)),
        avg7d: Math.round(baseGas * (0.9 + Math.random() * 0.2)),
        avg30d: Math.round(baseGas * (0.85 + Math.random() * 0.3)),
      },
      prediction: {
        1h: Math.round(baseGas * (0.95 + Math.random() * 0.2)),
        4h: Math.round(baseGas * (0.9 + Math.random() * 0.3)),
        12h: Math.round(baseGas * (0.85 + Math.random() * 0.4)),
        24h: Math.round(baseGas * (0.8 + Math.random() * 0.5)),
      },
      trend,
      confidence: Math.floor(Math.random() * 20 + 70),
      bestTime: this.getBestTime(chain),
      networkStatus: this.getNetworkStatus(baseGas, chain),
    };
  }

  private getBaseGasForChain(chain: string): number {
    const gasMap: Record<string, number> = {
      Ethereum: 30,
      Polygon: 80,
      Arbitrum: 0.1,
      Optimism: 0.001,
      BSC: 5,
      Base: 0.01,
      Avalanche: 25,
      zkSync: 0.001,
      Starknet: 0.001,
      Linea: 0.001,
    };
    return gasMap[chain] || 10;
  }

  private getBestTime(chain: string): string {
    const times = ['02:00-04:00 UTC', '03:00-05:00 UTC', '01:00-03:00 UTC', '02:30-04:30 UTC'];
    return times[Math.floor(Math.random() * times.length)];
  }

  private getNetworkStatus(baseGas: number, chain: string): 'healthy' | 'congested' | 'degraded' {
    if (chain === 'Ethereum' && baseGas > 40) return 'congested';
    if (chain === 'Polygon' && baseGas > 150) return 'congested';
    return 'healthy';
  }

  async getGasComparison(): Promise<any> {
    const chains = await this.getAllChainsGas();
    const sorted = [...chains].sort((a, b) => a.current.average - b.current.average);
    
    return {
      ranking: sorted.map((c, i) => ({
        rank: i + 1,
        chain: c.chain,
        gasPrice: c.current.average,
        unit: this.getGasUnit(c.chain),
      })),
      cheapest: {
        chain: sorted[0].chain,
        gasPrice: sorted[0].current.average,
        unit: this.getGasUnit(sorted[0].chain),
      },
      mostExpensive: {
        chain: sorted[sorted.length - 1].chain,
        gasPrice: sorted[sorted.length - 1].current.average,
        unit: this.getGasUnit(sorted[sorted.length - 1].chain),
      },
      savingsOpportunity: {
        byChoosingCheapest: sorted[sorted.length - 1].current.average - sorted[0].current.average,
        percentSaved: ((sorted[sorted.length - 1].current.average - sorted[0].current.average) / sorted[sorted.length - 1].current.average) * 100,
      },
    };
  }

  private getGasUnit(chain: string): string {
    const units: Record<string, string> = {
      Ethereum: 'Gwei',
      Polygon: 'Gwei',
      Arbitrum: 'Gwei',
      Optimism: 'Gwei',
      BSC: 'Gwei',
      Base: 'Gwei',
      Avalanche: 'nAVAX',
      zkSync: 'Gwei',
      Starknet: 'Gwei',
      Linea: 'Gwei',
    };
    return units[chain] || 'Gwei';
  }

  async analyzeTransactionGas(
    chain: string,
    txType: string,
    urgency: 'low' | 'medium' | 'high',
  ): Promise<GasAnalysis> {
    const chainData = await this.getChainGasData(chain, 1);
    const baseGas = chainData.current.average;
    
    const multipliers = {
      low: 0.8,
      medium: 1.0,
      high: 1.3,
    };
    
    const recommended = Math.round(baseGas * multipliers[urgency]);
    const fast = chainData.current.fast;
    
    return {
      chain,
      gasSaved: fast - recommended,
      recommendedSpeed: urgency === 'low' ? 'slow' : urgency === 'medium' ? 'average' : 'fast',
      savingsPercent: ((fast - recommended) / fast) * 100,
      nextOptimalWindow: {
        start: chainData.bestTime.split('-')[0].trim(),
        end: chainData.bestTime.split('-')[1].trim(),
        expectedGas: Math.round(baseGas * 0.7),
      },
    };
  }

  async getCrossChainGasComparison(fromChain: string, toChain: string): Promise<CrossChainGasComparison> {
    const fromData = await this.getChainGasData(fromChain, 1);
    const toData = await this.getChainGasData(toChain, 1);
    
    const bridges = ['LayerZero', 'Stargate', 'Across', 'Hop', 'Wormhole'];
    const recommended = bridges[Math.floor(Math.random() * bridges.length)];
    
    const bridgeCost = Math.random() * 10 + 5;
    const fromCost = fromData.current.average * 0.01;
    const toCost = toData.current.average * 0.01;
    
    return {
      fromChain,
      toChain,
      recommendedBridge: recommended,
      totalCost: Math.round((bridgeCost + fromCost + toCost) * 100) / 100,
      timeEstimate: `${Math.floor(Math.random() * 15) + 5}-${Math.floor(Math.random() * 20) + 15} min`,
      savingsVsNative: Math.round(Math.random() * 20 + 5),
    };
  }

  async getGasHistory(chain: string, days: number = 7): Promise<any> {
    const data = [];
    const now = Date.now();
    const baseGas = this.getBaseGasForChain(chain);
    
    for (let i = days; i >= 0; i--) {
      const timestamp = now - i * 24 * 60 * 60 * 1000;
      const variance = Math.random() * 0.4 - 0.2;
      
      data.push({
        timestamp: new Date(timestamp).toISOString(),
        avg: Math.round(baseGas * (1 + variance)),
        min: Math.round(baseGas * (0.6 + variance)),
        max: Math.round(baseGas * (1.4 + variance)),
        txCount: Math.floor(Math.random() * 500000 + 1000000),
      });
    }
    
    return {
      chain,
      period: `${days}d`,
      data,
      stats: {
        avg: Math.round(data.reduce((sum, d) => sum + d.avg, 0) / data.length),
        min: Math.min(...data.map(d => d.min)),
        max: Math.max(...data.map(d => d.max)),
        volatility: Math.round(Math.random() * 30 + 10),
      },
    };
  }

  async getGasAlerts(userId: string): Promise<any[]> {
    return [
      {
        id: '1',
        chain: 'Ethereum',
        condition: 'above',
        threshold: 50,
        currentPrice: Math.round(Math.random() * 30 + 20),
        triggered: false,
        createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      },
      {
        id: '2',
        chain: 'Polygon',
        condition: 'below',
        threshold: 50,
        currentPrice: Math.round(Math.random() * 100 + 50),
        triggered: false,
        createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      },
    ];
  }

  async createGasAlert(
    userId: string,
    chain: string,
    condition: 'above' | 'below',
    threshold: number,
  ): Promise<any> {
    return {
      id: Math.random().toString(36).substr(2, 9),
      userId,
      chain,
      condition,
      threshold,
      triggered: false,
      createdAt: new Date().toISOString(),
    };
  }

  async getGasCalculator(
    txType: string,
    chain: string,
    value?: number,
  ): Promise<any> {
    const chainData = await this.getChainGasData(chain, 1);
    const baseGasUnits = this.getGasUnitsForTx(txType);
    
    const slowCost = (chainData.current.slow * baseGasUnits) / 1e9;
    const avgCost = (chainData.current.average * baseGasUnits) / 1e9;
    const fastCost = (chainData.current.fast * baseGasUnits) / 1e9;
    
    return {
      txType,
      chain,
      gasUnits: baseGasUnits,
      prices: {
        slow: Math.round(slowCost * 10000) / 10000,
        average: Math.round(avgCost * 10000) / 10000,
        fast: Math.round(fastCost * 10000) / 10000,
      },
      usdValue: value ? {
        slow: Math.round(slowCost * value * 100) / 100,
        average: Math.round(avgCost * value * 100) / 100,
        fast: Math.round(fastCost * value * 100) / 100,
      } : undefined,
      recommendations: {
        ifValueUnder100: slowCost < 100 ? 'slow' : 'average',
        ifValueUnder1000: 'average',
        ifValueOver1000: 'fast',
      },
    };
  }

  private getGasUnitsForTx(txType: string): number {
    const gasMap: Record<string, number> = {
      'eth_transfer': 21000,
      'erc20_transfer': 65000,
      'swap': 150000,
      'nft_transfer': 85000,
      'contract_deploy': 2000000,
      'approve': 50000,
      'stake': 100000,
      'unstake': 100000,
      'bridge': 200000,
    };
    return gasMap[txType] || 65000;
  }
}
