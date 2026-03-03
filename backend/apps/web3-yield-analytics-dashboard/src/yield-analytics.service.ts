import { Injectable } from '@nestjs/common';

export interface YieldPosition {
  id: string;
  protocol: string;
  chain: string;
  type: 'staking' | 'lending' | 'liquidity' | 'farming' | 'bridge';
  token0: string;
  token1?: string;
  value: number;
  valueUsd: number;
  yield: number;
  yieldUsd: number;
  apy: number;
  lastUpdated: string;
}

export interface ChainYield {
  chain: string;
  chainName: string;
  totalValue: number;
  totalYield: number;
  positions: number;
  apy: number;
}

export interface ProtocolYield {
  protocol: string;
  protocolName: string;
  totalValue: number;
  totalYield: number;
  positions: number;
  chains: string[];
  apy: number;
}

export interface YieldAnalytics {
  totalValue: number;
  totalYield: number;
  totalYieldPercent: number;
  bestPerformer: {
    protocol: string;
    apy: number;
  };
  chains: ChainYield[];
  protocols: ProtocolYield[];
  positions: YieldPosition[];
  yieldHistory: {
    date: string;
    yield: number;
  }[];
}

@Injectable()
export class YieldAnalyticsService {
  private readonly supportedChains = [
    { id: 'ethereum', name: 'Ethereum', symbol: 'ETH' },
    { id: 'polygon', name: 'Polygon', symbol: 'MATIC' },
    { id: 'arbitrum', name: 'Arbitrum', symbol: 'ETH' },
    { id: 'optimism', name: 'Optimism', symbol: 'ETH' },
    { id: 'bsc', name: 'BNB Chain', symbol: 'BNB' },
    { id: 'base', name: 'Base', symbol: 'ETH' },
    { id: 'avalanche', name: 'Avalanche', symbol: 'AVAX' },
  ];

  private readonly supportedProtocols = [
    { id: 'aave', name: 'Aave', category: 'lending' },
    { id: 'compound', name: 'Compound', category: 'lending' },
    { id: 'uniswap', name: 'Uniswap', category: 'liquidity' },
    { id: 'sushiswap', name: 'SushiSwap', category: 'liquidity' },
    { id: 'curve', name: 'Curve', category: 'liquidity' },
    { id: 'lido', name: 'Lido', category: 'staking' },
    { id: 'rocketpool', name: 'Rocket Pool', category: 'staking' },
    { id: 'yearn', name: 'Yearn', category: 'farming' },
    { id: 'pancakeswap', name: 'PancakeSwap', category: 'liquidity' },
    { id: 'aerodrome', name: 'Aerodrome', category: 'liquidity' },
    { id: 'velodrome', name: 'Velodrome', category: 'liquidity' },
    { id: 'quickswap', name: 'QuickSwap', category: 'liquidity' },
    { id: 'traderjoe', name: 'Trader Joe', category: 'liquidity' },
    { id: 'aerodrome', name: 'Aerodrome', category: 'liquidity' },
  ];

  // Mock data generation for yield positions
  private generateMockPositions(walletAddress?: string): YieldPosition[] {
    const positions: YieldPosition[] = [];
    const protocols = this.supportedProtocols;
    const chains = this.supportedChains;

    // Generate positions across different protocols and chains
    const protocolChainsMap: Record<string, string[]> = {
      aave: ['ethereum', 'polygon', 'arbitrum', 'optimism'],
      compound: ['ethereum', 'polygon'],
      uniswap: ['ethereum', 'arbitrum', 'optimism', 'polygon'],
      sushiswap: ['ethereum', 'polygon', 'arbitrum'],
      curve: ['ethereum', 'arbitrum', 'optimism'],
      lido: ['ethereum'],
      rocketpool: ['ethereum'],
      yearn: ['ethereum', 'arbitrum', 'polygon'],
      pancakeswap: ['bsc'],
      aerodrome: ['base', 'optimism'],
      velodrome: ['optimism'],
      quickswap: ['polygon'],
      traderjoe: ['avalanche'],
    };

    let id = 1;
    protocols.forEach((protocol) => {
      const chainList = protocolChainsMap[protocol.id] || ['ethereum'];
      chainList.forEach((chainId) => {
        const chain = chains.find((c) => c.id === chainId);
        if (!chain) return;

        const tokenPairs: [string, string][] = this.getTokenPairs(protocol.id, chainId);
        tokenPairs.forEach(([token0, token1]) => {
          const value = Math.random() * 50000 + 1000;
          const apy = this.getApyForProtocol(protocol.id, token0);
          const yieldAmount = value * (apy / 100);

          positions.push({
            id: `pos-${id++}`,
            protocol: protocol.name,
            chain: chainId,
            type: protocol.category as YieldPosition['type'],
            token0,
            token1,
            value,
            valueUsd: value,
            yield: yieldAmount,
            yieldUsd: yieldAmount,
            apy,
            lastUpdated: new Date().toISOString(),
          });
        });
      });
    });

    return positions;
  }

  private getTokenPairs(protocol: string, chain: string): [string, string | undefined][] {
    const pairs: Record<string, [string, string | undefined][]> = {
      aave: [['ETH', undefined], ['USDC', undefined], ['USDT', undefined], ['DAI', undefined]],
      compound: [['ETH', undefined], ['USDC', undefined], ['DAI', undefined]],
      uniswap: [
        ['ETH', 'USDC'],
        ['ETH', 'USDT'],
        ['WBTC', 'ETH'],
        ['UNI', 'ETH'],
      ],
      sushiswap: [
        ['ETH', 'USDC'],
        ['MATIC', 'ETH'],
        ['SUSHI', 'ETH'],
      ],
      curve: [
        ['ETH', 'BTC'],
        ['ETH', 'USDC'],
        ['CRV', 'ETH'],
      ],
      lido: [['stETH', undefined]],
      rocketpool: [['rETH', undefined]],
      yearn: [
        ['ETH', undefined],
        ['USDC', undefined],
        ['DAI', undefined],
      ],
      pancakeswap: [
        ['BNB', 'USDT'],
        ['CAKE', 'BNB'],
        ['ETH', 'BNB'],
      ],
      aerodrome: [
        ['ETH', 'USDC'],
        ['VELO', 'ETH'],
      ],
      velodrome: [
        ['ETH', 'USDC'],
        ['VELO', 'ETH'],
      ],
      quickswap: [
        ['MATIC', 'USDC'],
        ['QUICK', 'MATIC'],
      ],
      traderjoe: [
        ['AVAX', 'USDC'],
        ['JOE', 'AVAX'],
      ],
    };

    return pairs[protocol] || [['ETH', undefined]];
  }

  private getApyForProtocol(protocol: string, token: string): number {
    const apyRanges: Record<string, [number, number]> = {
      aave: [3, 8],
      compound: [2, 6],
      uniswap: [1, 50],
      sushiswap: [1, 40],
      curve: [2, 25],
      lido: [3, 5],
      rocketpool: [4, 7],
      yearn: [5, 30],
      pancakeswap: [2, 60],
      aerodrome: [1, 35],
      velodrome: [1, 30],
      quickswap: [1, 45],
      traderjoe: [1, 40],
    };

    const [min, max] = apyRanges[protocol] || [1, 20];
    return Number((Math.random() * (max - min) + min).toFixed(2));
  }

  async getYieldAnalytics(walletAddress?: string): Promise<YieldAnalytics> {
    const positions = this.generateMockPositions(walletAddress);

    // Calculate totals
    const totalValue = positions.reduce((sum, p) => sum + p.valueUsd, 0);
    const totalYield = positions.reduce((sum, p) => sum + p.yieldUsd, 0);
    const totalYieldPercent = totalValue > 0 ? (totalYield / totalValue) * 100 : 0;

    // Calculate chain yields
    const chainMap = new Map<string, ChainYield>();
    this.supportedChains.forEach((chain) => {
      const chainPositions = positions.filter((p) => p.chain === chain.id);
      if (chainPositions.length > 0) {
        const chainValue = chainPositions.reduce((sum, p) => sum + p.valueUsd, 0);
        const chainYield = chainPositions.reduce((sum, p) => sum + p.yieldUsd, 0);
        const avgApy = chainPositions.reduce((sum, p) => sum + p.apy, 0) / chainPositions.length;

        chainMap.set(chain.id, {
          chain: chain.id,
          chainName: chain.name,
          totalValue: chainValue,
          totalYield: chainYield,
          positions: chainPositions.length,
          apy: Number(avgApy.toFixed(2)),
        });
      }
    });

    // Calculate protocol yields
    const protocolMap = new Map<string, ProtocolYield>();
    positions.forEach((pos) => {
      const existing = protocolMap.get(pos.protocol) || {
        protocol: pos.protocol,
        protocolName: pos.protocol,
        totalValue: 0,
        totalYield: 0,
        positions: 0,
        chains: [],
        apy: 0,
      };

      existing.totalValue += pos.valueUsd;
      existing.totalYield += pos.yieldUsd;
      existing.positions += 1;
      if (!existing.chains.includes(pos.chain)) {
        existing.chains.push(pos.chain);
      }
      existing.apy = (existing.apy * (existing.positions - 1) + pos.apy) / existing.positions;

      protocolMap.set(pos.protocol, existing);
    });

    // Find best performer
    const bestPerformer = positions.reduce(
      (best, pos) => (pos.apy > best.apy ? { protocol: pos.protocol, apy: pos.apy } : best),
      { protocol: '', apy: 0 },
    );

    // Generate yield history (last 30 days)
    const yieldHistory = [];
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dailyYield = totalYield * (0.8 + Math.random() * 0.4) / 30;
      yieldHistory.push({
        date: date.toISOString().split('T')[0],
        yield: Number(dailyYield.toFixed(2)),
      });
    }

    return {
      totalValue: Number(totalValue.toFixed(2)),
      totalYield: Number(totalYield.toFixed(2)),
      totalYieldPercent: Number(totalYieldPercent.toFixed(2)),
      bestPerformer,
      chains: Array.from(chainMap.values()),
      protocols: Array.from(protocolMap.values()).map((p) => ({
        ...p,
        apy: Number(p.apy.toFixed(2)),
      })),
      positions,
      yieldHistory,
    };
  }

  async getChainYieldSummary(): Promise<{
    chains: ChainYield[];
    totalValue: number;
    totalYield: number;
  }> {
    const analytics = await this.getYieldAnalytics();
    return {
      chains: analytics.chains,
      totalValue: analytics.totalValue,
      totalYield: analytics.totalYield,
    };
  }

  async getProtocolYieldSummary(): Promise<{
    protocols: ProtocolYield[];
    totalValue: number;
    totalYield: number;
  }> {
    const analytics = await this.getYieldAnalytics();
    return {
      protocols: analytics.protocols.sort((a, b) => b.totalValue - a.totalValue),
      totalValue: analytics.totalValue,
      totalYield: analytics.totalYield,
    };
  }

  async getYieldHistory(days: number = 30): Promise<{
    history: { date: string; yield: number }[];
    totalYield: number;
    averageDailyYield: number;
  }> {
    const analytics = await this.getYieldAnalytics();
    const history = analytics.yieldHistory.slice(-days);
    const totalYield = history.reduce((sum, h) => sum + h.yield, 0);

    return {
      history,
      totalYield: Number(totalYield.toFixed(2)),
      averageDailyYield: Number((totalYield / days).toFixed(2)),
    };
  }

  async compareYieldByType(): Promise<{
    staking: { value: number; yield: number; apy: number };
    lending: { value: number; yield: number; apy: number };
    liquidity: { value: number; yield: number; apy: number };
    farming: { value: number; yield: number; apy: number };
  }> {
    const positions = await this.getYieldPositions();

    const typeMap = new Map<string, YieldPosition[]>();
    positions.forEach((pos) => {
      const existing = typeMap.get(pos.type) || [];
      existing.push(pos);
      typeMap.set(pos.type, existing);
    });

    const result: Record<string, { value: number; yield: number; apy: number }> = {};
    typeMap.forEach((posList, type) => {
      const value = posList.reduce((sum, p) => sum + p.valueUsd, 0);
      const yieldAmount = posList.reduce((sum, p) => sum + p.yieldUsd, 0);
      const avgApy = posList.reduce((sum, p) => sum + p.apy, 0) / posList.length;

      result[type] = {
        value: Number(value.toFixed(2)),
        yield: Number(yieldAmount.toFixed(2)),
        apy: Number(avgApy.toFixed(2)),
      };
    });

    return result as any;
  }

  async getYieldPositions(): Promise<YieldPosition[]> {
    const analytics = await this.getYieldAnalytics();
    return analytics.positions;
  }
}
