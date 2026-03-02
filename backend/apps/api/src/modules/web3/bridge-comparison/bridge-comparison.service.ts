import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';

interface BridgeInfo {
  name: string;
  logo: string;
  supportedChains: string[];
  avgTime: string;
  fee: string;
  securityScore: number;
  category: 'canonical' | 'optimistic' | 'atomic' | 'liquidity';
}

interface QuoteResult {
  bridge: string;
  fromChain: string;
  toChain: string;
  token: string;
  amount: number;
  estimatedOutput: number;
  fee: number;
  estimatedTime: string;
  securityScore: number;
  route: string;
  slippage: number;
}

@Injectable()
export class BridgeComparisonService {
  private readonly bridges: BridgeInfo[] = [
    {
      name: 'LayerZero',
      logo: '🪢',
      supportedChains: ['ethereum', 'arbitrum', 'optimism', 'polygon', 'avalanche', 'bsc', 'base', 'solana'],
      avgTime: '5-15 min',
      fee: '0.1-0.3%',
      securityScore: 95,
      category: 'atomic',
    },
    {
      name: 'Stargate',
      logo: '🌉',
      supportedChains: ['ethereum', 'arbitrum', 'optimism', 'polygon', 'avalanche', 'bsc', 'base'],
      avgTime: '15-30 min',
      fee: '0.2-0.5%',
      securityScore: 92,
      category: 'liquidity',
    },
    {
      name: 'Across',
      logo: '↔️',
      supportedChains: ['ethereum', 'arbitrum', 'optimism', 'polygon'],
      avgTime: '2-5 min',
      fee: '0.1-0.2%',
      securityScore: 90,
      category: 'optimistic',
    },
    {
      name: 'Hop',
      logo: '🐰',
      supportedChains: ['ethereum', 'arbitrum', 'optimism', 'polygon'],
      avgTime: '5-15 min',
      fee: '0.15-0.25%',
      securityScore: 88,
      category: 'liquidity',
    },
    {
      name: 'Orbiter',
      logo: '🛸',
      supportedChains: ['ethereum', 'arbitrum', 'optimism', 'polygon', 'base', 'zksync', 'starknet'],
      avgTime: '1-3 min',
      fee: '0.05-0.15%',
      securityScore: 85,
      category: 'atomic',
    },
    {
      name: 'Celer cBridge',
      logo: '🌐',
      supportedChains: ['ethereum', 'arbitrum', 'optimism', 'polygon', 'avalanche', 'bsc', 'base'],
      avgTime: '10-20 min',
      fee: '0.1-0.3%',
      securityScore: 87,
      category: 'liquidity',
    },
    {
      name: 'Axelar',
      logo: '🔗',
      supportedChains: ['ethereum', 'arbitrum', 'optimism', 'polygon', 'avalanche', 'bsc', 'base', 'solana'],
      avgTime: '15-25 min',
      fee: '0.2-0.4%',
      securityScore: 91,
      category: 'canonical',
    },
    {
      name: 'Wormhole',
      logo: '🕳️',
      supportedChains: ['ethereum', 'solana', 'avalanche', 'polygon', 'bsc', 'arbitrum', 'optimism'],
      avgTime: '15-30 min',
      fee: '0.2-0.5%',
      securityScore: 89,
      category: 'canonical',
    },
  ];

  constructor(private readonly httpService: HttpService) {}

  async getSupportedBridges(): Promise<BridgeInfo[]> {
    return this.bridges;
  }

  async getBridgeByName(name: string): Promise<BridgeInfo | undefined> {
    return this.bridges.find(b => b.name.toLowerCase() === name.toLowerCase());
  }

  async getChainsForBridge(bridgeName: string): Promise<string[]> {
    const bridge = await this.getBridgeByName(bridgeName);
    return bridge?.supportedChains || [];
  }

  async getQuotes(fromChain: string, toChain: string, token: string, amount: number): Promise<QuoteResult[]> {
    const quotes: QuoteResult[] = [];
    
    // Filter bridges that support both chains
    const availableBridges = this.bridges.filter(
      b => b.supportedChains.includes(fromChain) && b.supportedChains.includes(toChain)
    );

    for (const bridge of availableBridges) {
      const fee = this.calculateFee(bridge, token, amount);
      const estimatedOutput = amount * (1 - fee / 100);
      const slippage = this.estimateSlippage(bridge, fromChain, toChain, token);
      
      quotes.push({
        bridge: bridge.name,
        fromChain,
        toChain,
        token,
        amount,
        estimatedOutput,
        fee,
        estimatedTime: bridge.avgTime,
        securityScore: bridge.securityScore,
        route: this.getRouteType(bridge.category),
        slippage,
      });
    }

    return quotes.sort((a, b) => {
      const scoreA = this.calculateValueScore(a);
      const scoreB = this.calculateValueScore(b);
      return scoreB - scoreA;
    });
  }

  async getBestQuote(fromChain: string, toChain: string, token: string, amount: number): Promise<QuoteResult | null> {
    const quotes = await this.getQuotes(fromChain, toChain, token, amount);
    return quotes[0] || null;
  }

  async compareBridges(fromChain: string, toChain: string, token: string, amount: number): Promise<{
    fastest: QuoteResult | null;
    cheapest: QuoteResult | null;
    safest: QuoteResult | null;
    bestValue: QuoteResult | null;
  }> {
    const quotes = await this.getQuotes(fromChain, toChain, token, amount);
    
    if (quotes.length === 0) {
      return {
        fastest: null,
        cheapest: null,
        safest: null,
        bestValue: null,
      };
    }

    const timeOrder = ['1-3 min', '2-5 min', '5-15 min', '5-15 min', '10-20 min', '15-25 min', '15-30 min'];
    const fastest = [...quotes].sort((a, b) => {
      const idxA = timeOrder.indexOf(a.estimatedTime);
      const idxB = timeOrder.indexOf(b.estimatedTime);
      return idxA - idxB;
    })[0];

    const cheapest = [...quotes].sort((a, b) => a.fee - b.fee)[0];
    const safest = [...quotes].sort((a, b) => b.securityScore - a.securityScore)[0];
    const bestValue = quotes[0];

    return { fastest, cheapest, safest, bestValue };
  }

  async getBridgeStatistics(bridgeName: string): Promise<{
    name: string;
    totalVolume24h: number;
    totalTransactions24h: number;
    avgConfirmationTime: number;
    successRate: number;
    supportedChains: string[];
  }> {
    const bridge = await this.getBridgeByName(bridgeName);
    if (!bridge) {
      throw new Error(`Bridge ${bridgeName} not found`);
    }

    return {
      name: bridge.name,
      totalVolume24h: Math.random() * 1000000000 + 100000000,
      totalTransactions24h: Math.floor(Math.random() * 50000) + 10000,
      avgConfirmationTime: this.parseTimeToMinutes(bridge.avgTime),
      successRate: 98 + Math.random() * 2,
      supportedChains: bridge.supportedChains,
    };
  }

  async getPopularRoutes(): Promise<Array<{
    fromChain: string;
    toChain: string;
    volume24h: number;
    popularBridges: string[];
  }>> {
    return [
      { fromChain: 'ethereum', toChain: 'arbitrum', volume24h: 250000000, popularBridges: ['LayerZero', 'Stargate', 'Across'] },
      { fromChain: 'ethereum', toChain: 'optimism', volume24h: 180000000, popularBridges: ['Across', 'LayerZero', 'Hop'] },
      { fromChain: 'ethereum', toChain: 'polygon', volume24h: 150000000, popularBridges: ['LayerZero', 'Stargate', 'Celer'] },
      { fromChain: 'ethereum', toChain: 'avalanche', volume24h: 120000000, popularBridges: ['LayerZero', 'Axelar', 'Wormhole'] },
      { fromChain: 'ethereum', toChain: 'bsc', volume24h: 100000000, popularBridges: ['LayerZero', 'Celer', 'Stargate'] },
      { fromChain: 'arbitrum', toChain: 'ethereum', volume24h: 200000000, popularBridges: ['Across', 'LayerZero', 'Hop'] },
      { fromChain: 'optimism', toChain: 'ethereum', volume24h: 160000000, popularBridges: ['Across', 'LayerZero', 'Orbiter'] },
      { fromChain: 'polygon', toChain: 'ethereum', volume24h: 130000000, popularBridges: ['LayerZero', 'Stargate', 'Celer'] },
      { fromChain: 'ethereum', toChain: 'base', volume24h: 90000000, popularBridges: ['LayerZero', 'Orbiter', 'Stargate'] },
      { fromChain: 'ethereum', toChain: 'zksync', volume24h: 80000000, popularBridges: ['Orbiter', 'LayerZero'] },
    ];
  }

  private calculateFee(bridge: BridgeInfo, token: string, amount: number): number {
    const feeMatch = bridge.fee.match(/(\d+\.?\d*)-(\d+\.?\d*)%/);
    if (!feeMatch) return 0.2;
    
    const minFee = parseFloat(feeMatch[1]);
    const maxFee = parseFloat(feeMatch[2]);
    
    let rate = (minFee + maxFee) / 2;
    if (amount > 10000) rate *= 0.8;
    if (amount > 100000) rate *= 0.7;
    if (amount > 1000000) rate *= 0.6;
    
    return parseFloat(rate.toFixed(3));
  }

  private estimateSlippage(bridge: BridgeInfo, fromChain: string, toChain: string, token: string): number {
    const baseSlippage: Record<string, number> = {
      atomic: 0.1,
      optimistic: 0.2,
      liquidity: 0.3,
      canonical: 0.15,
    };
    
    let slippage = baseSlippage[bridge.category] || 0.3;
    slippage += Math.random() * 0.1;
    
    return parseFloat(slippage.toFixed(2));
  }

  private getRouteType(category: string): string {
    const routes: Record<string, string> = {
      atomic: 'Instant (Atomic Swap)',
      optimistic: 'Optimistic Verification',
      liquidity: 'Liquidity Network',
      canonical: 'Canonical Bridge',
    };
    return routes[category] || 'Standard';
  }

  private calculateValueScore(quote: QuoteResult): number {
    const feeScore = (1 - quote.fee / 10) * 40;
    const timeScore = (1 - this.parseTimeToMinutes(quote.estimatedTime) / 30) * 30;
    const securityScore = (quote.securityScore / 100) * 30;
    
    return feeScore + timeScore + securityScore;
  }

  private parseTimeToMinutes(timeStr: string): number {
    const match = timeStr.match(/(\d+)-(\d+)\s*min/);
    if (match) {
      return (parseInt(match[1]) + parseInt(match[2])) / 2;
    }
    return 15;
  }
}
