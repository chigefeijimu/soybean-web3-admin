import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';

export interface TreasuryAsset {
  chain: string;
  symbol: string;
  address: string;
  balance: string;
  valueUsd: number;
  type: 'native' | 'erc20' | 'nft';
}

export interface TreasuryPosition {
  protocol: string;
  chain: string;
  type: 'staking' | 'lending' | 'liquidity' | 'vault';
  token0: string;
  token1?: string;
  valueUsd: number;
  apy: number;
  risk: 'low' | 'medium' | 'high';
}

export interface TreasuryReport {
  dao: string;
  totalValueUsd: number;
  assets: TreasuryAsset[];
  positions: TreasuryPosition[];
  distribution: {
    byChain: Record<string, number>;
    byCategory: Record<string, number>;
  };
  health: {
    score: number;
    liquidity: number;
    diversification: number;
    sustainability: number;
  };
  recommendations: string[];
}

export interface DaoTreasury {
  name: string;
  address: string;
  chains: string[];
  totalValueUsd: number;
  assets: TreasuryAsset[];
  positions: TreasuryPosition[];
  history: {
    date: string;
    valueUsd: number;
  }[];
}

@Injectable()
export class DaoTreasuryManagerService {
  private readonly supportedChains = [
    'ethereum',
    'arbitrum',
    'optimism',
    'polygon',
    'base',
    'avalanche',
    'bsc',
  ];

  private readonly supportedDaos = [
    { name: 'Uniswap', address: '0x1a96412f71d4d7f42c0a34e4a57e92f2b2e4c6f1' },
    { name: 'Aave', address: '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9' },
    { name: 'MakerDAO', address: '0x9f8f72aa9304c8b593d555fa12c629ba5a5dccf3' },
    { name: 'Compound', address: '0xc00e94cb662c3520282e6f5717214004a7f26888' },
    { name: 'Curve', address: '0xd533a949740bb3306d119cc777fa900ba034cd52' },
    { name: 'Lido', address: '0xae7ab96520de3a18e5e111b5eaab095312d7fe84' },
    { name: 'ENS', address: '0xc18360217d8f7be5d91d5d14621b7ce3362fa0c8' },
    { name: 'Balancer', address: '0xba100000625a3754423978a60c9317c58a424e3d' },
    { name: 'Optimism', address: '0x4200000000000000000000000000000000000042' },
    { name: 'Arbitrum', address: '0x912ce59144191c1204e64559fe8253a0e49e6548' },
  ];

  constructor(private readonly httpService: HttpService) {}

  async getTreasuryOverview(dao: string): Promise<DaoTreasury> {
    const daoInfo = this.supportedDaos.find(
      (d) => d.name.toLowerCase() === dao.toLowerCase(),
    );

    if (!daoInfo) {
      return this.generateMockTreasury(dao);
    }

    return this.generateMockTreasury(daoInfo.name);
  }

  async getTreasuryByAddress(address: string): Promise<DaoTreasury> {
    const dao = this.supportedDaos.find(
      (d) => d.address.toLowerCase() === address.toLowerCase(),
    );
    return this.generateMockTreasury(dao?.name || 'Custom DAO');
  }

  async getTreasuryReport(dao: string): Promise<TreasuryReport> {
    const treasury = await this.getTreasuryOverview(dao);

    const byChain: Record<string, number> = {};
    const byCategory: Record<string, number> = {};

    treasury.assets.forEach((asset) => {
      byChain[asset.chain] = (byChain[asset.chain] || 0) + asset.valueUsd;
    });

    treasury.positions.forEach((pos) => {
      byCategory[pos.type] = (byCategory[pos.type] || 0) + pos.valueUsd;
    });

    const liquidity = Math.min(
      100,
      (treasury.assets.filter((a) => a.type === 'native').reduce(
        (sum, a) => sum + a.valueUsd,
        0,
      ) / treasury.totalValueUsd) * 100,
    );

    const diversification = Math.min(
      100,
      (treasury.assets.length / 20) * 100,
    );

    const sustainability = treasury.positions.length > 0
      ? 70 + Math.random() * 20
      : 50;

    const recommendations: string[] = [];
    if (liquidity < 30) {
      recommendations.push('Consider maintaining higher liquid reserves for operational needs');
    }
    if (diversification < 50) {
      recommendations.push('Diversify assets across more tokens to reduce concentration risk');
    }
    if (treasury.positions.length < 3) {
      recommendations.push('Explore DeFi yield opportunities to maximize treasury growth');
    }

    return {
      dao: treasury.name,
      totalValueUsd: treasury.totalValueUsd,
      assets: treasury.assets,
      positions: treasury.positions,
      distribution: { byChain, byCategory },
      health: {
        score: Math.round((liquidity + diversification + sustainability) / 3),
        liquidity: Math.round(liquidity),
        diversification: Math.round(diversification),
        sustainability: Math.round(sustainability),
      },
      recommendations,
    };
  }

  async compareTreasuries(daos: string[]): Promise<
    {
      dao: string;
      totalValueUsd: number;
      assetCount: number;
      positionCount: number;
      health: number;
    }[]
  > {
    const results = [];
    for (const dao of daos) {
      const report = await this.getTreasuryReport(dao);
      results.push({
        dao: report.dao,
        totalValueUsd: report.totalValueUsd,
        assetCount: report.assets.length,
        positionCount: report.positions.length,
        health: report.health.score,
      });
    }
    return results.sort((a, b) => b.totalValueUsd - a.totalValueUsd);
  }

  async getTopTreasuries(limit = 10): Promise<
    {
      rank: number;
      dao: string;
      totalValueUsd: number;
      change24h: number;
    }[]
  > {
    const treasuries = [];
    for (const dao of this.supportedDaos) {
      const report = await this.getTreasuryReport(dao.name);
      treasuries.push({
        dao: dao.name,
        totalValueUsd: report.totalValueUsd,
        change24h: (Math.random() - 0.5) * 10,
      });
    }

    return treasuries
      .sort((a, b) => b.totalValueUsd - a.totalValueUsd)
      .slice(0, limit)
      .map((t, i) => ({ rank: i + 1, ...t }));
  }

  async getTreasuryHistory(
    dao: string,
    days: number = 30,
  ): Promise<{ date: string; valueUsd: number }[]> {
    const history = [];
    const now = new Date();
    let baseValue = 1000000 + Math.random() * 5000000;

    for (let i = days; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      baseValue *= 1 + (Math.random() - 0.48) * 0.05;
      history.push({
        date: date.toISOString().split('T')[0],
        valueUsd: Math.round(baseValue),
      });
    }

    return history;
  }

  async getSupportedDaos(): Promise<
    { name: string; address: string; chains: string[] }[]
  > {
    return this.supportedDaos.map((dao) => ({
      name: dao.name,
      address: dao.address,
      chains: this.supportedChains,
    }));
  }

  async analyzeTreasuryRisks(dao: string): Promise<{
    risks: {
      category: string;
      level: 'low' | 'medium' | 'high' | 'critical';
      description: string;
      mitigation: string;
    }[];
    overallRisk: number;
  }> {
    const treasury = await this.getTreasuryOverview(dao);
    const risks = [];

    if (treasury.assets.length < 5) {
      risks.push({
        category: 'Diversification',
        level: 'high' as const,
        description: 'Treasury has limited asset diversification',
        mitigation: 'Spread holdings across more assets and chains',
      });
    }

    const nativeRatio = treasury.assets
      .filter((a) => a.type === 'native')
      .reduce((sum, a) => sum + a.valueUsd, 0) / treasury.totalValueUsd;

    if (nativeRatio < 0.1) {
      risks.push({
        category: 'Liquidity',
        level: 'critical' as const,
        description: 'Very low native token reserves for operations',
        mitigation: 'Maintain at least 10% in native tokens for operational needs',
      });
    }

    if (treasury.positions.length > 0) {
      const highRiskPositions = treasury.positions.filter(
        (p) => p.risk === 'high',
      );
      if (highRiskPositions.length > 0) {
        risks.push({
          category: 'Yield Farming Risk',
          level: 'medium' as const,
          description: `${highRiskPositions.length} high-risk DeFi positions detected`,
          mitigation: 'Review and potentially reduce exposure to high-risk yield strategies',
        });
      }
    }

    const chains = [...new Set(treasury.assets.map((a) => a.chain))];
    if (chains.length < 3) {
      risks.push({
        category: 'Chain Concentration',
        level: 'medium' as const,
        description: 'Treasury assets concentrated on fewer than 3 chains',
        mitigation: 'Consider spreading across more chains for better risk distribution',
      });
    }

    const overallRisk = Math.min(
      100,
      risks.reduce((sum, r) => {
        if (r.level === 'critical') return sum + 30;
        if (r.level === 'high') return sum + 20;
        if (r.level === 'medium') return sum + 10;
        return sum + 5;
      }, 0),
    );

    return { risks, overallRisk };
  }

  async getYieldOpportunities(
    dao: string,
  ): Promise<{
    protocol: string;
    chain: string;
    type: string;
    apy: number;
    risk: 'low' | 'medium' | 'high';
    minDeposit: number;
    description: string;
  }[]> {
    const opportunities = [
      {
        protocol: 'Aave',
        chain: 'ethereum',
        type: 'Lending',
        apy: 4.5 + Math.random() * 2,
        risk: 'low' as const,
        minDeposit: 1000,
        description: 'Stablecoin lending with proven track record',
      },
      {
        protocol: 'Compound',
        chain: 'ethereum',
        type: 'Lending',
        apy: 3.8 + Math.random() * 2,
        risk: 'low' as const,
        minDeposit: 1000,
        description: 'Established lending protocol',
      },
      {
        protocol: 'Lido',
        chain: 'ethereum',
        type: 'Liquid Staking',
        apy: 3.2 + Math.random() * 1,
        risk: 'low' as const,
        minDeposit: 10000,
        description: 'ETH liquid staking with stETH token',
      },
      {
        protocol: 'Curve',
        chain: 'ethereum',
        type: 'Stable Swap',
        apy: 5 + Math.random() * 3,
        risk: 'medium' as const,
        minDeposit: 5000,
        description: 'Stablecoin AMM with low slippage',
      },
      {
        protocol: 'Balancer',
        chain: 'arbitrum',
        type: 'Liquidity',
        apy: 8 + Math.random() * 4,
        risk: 'medium' as const,
        minDeposit: 3000,
        description: 'Weighted pool liquidity provision',
      },
      {
        protocol: 'GMX',
        chain: 'arbitrum',
        type: 'Vault',
        apy: 12 + Math.random() * 5,
        risk: 'high' as const,
        minDeposit: 5000,
        description: 'Decentralized perpetual trading vault',
      },
    ];

    return opportunities.sort((a, b) => b.apy - a.apy);
  }

  private generateMockTreasury(daoName: string): DaoTreasury {
    const assets: TreasuryAsset[] = [];
    const positions: TreasuryPosition[] = [];
    let totalValue = 0;

    const tokens = [
      { symbol: 'ETH', value: 500000 + Math.random() * 1000000 },
      { symbol: 'USDC', value: 300000 + Math.random() * 500000 },
      { symbol: 'USDT', value: 200000 + Math.random() * 400000 },
      { symbol: 'WBTC', value: 400000 + Math.random() * 800000 },
      { symbol: 'DAI', value: 100000 + Math.random() * 200000 },
      { symbol: 'UNI', value: 50000 + Math.random() * 150000 },
      { symbol: 'AAVE', value: 30000 + Math.random() * 100000 },
    ];

    tokens.forEach((token) => {
      const chain = this.supportedChains[Math.floor(Math.random() * 4)];
      assets.push({
        chain,
        symbol: token.symbol,
        address: `0x${Math.random().toString(16).slice(2, 42)}`,
        balance: (Math.random() * 10000).toFixed(4),
        valueUsd: Math.round(token.value),
        type: 'erc20' as const,
      });
      totalValue += token.value;
    });

    assets.push({
      chain: 'ethereum',
      symbol: 'ETH',
      address: '0x0000000000000000000000000000000000000000',
      balance: (Math.random() * 1000).toFixed(4),
      valueUsd: Math.round(Math.random() * 2000000),
      type: 'native',
    });

    const protocols = [
      { protocol: 'Aave', type: 'lending' as const, apy: 4.5 },
      { protocol: 'Lido', type: 'staking' as const, apy: 3.5 },
      { protocol: 'Curve', type: 'liquidity' as const, apy: 8 },
      { protocol: 'Yearn', type: 'vault' as const, apy: 12 },
    ];

    protocols.forEach((p) => {
      const value = 100000 + Math.random() * 500000;
      positions.push({
        protocol: p.protocol,
        chain: this.supportedChains[Math.floor(Math.random() * 4)],
        type: p.type,
        token0: 'USDC',
        token1: Math.random() > 0.5 ? 'USDT' : undefined,
        valueUsd: Math.round(value),
        apy: p.apy + Math.random() * 3,
        risk: p.type === 'lending' ? 'low' : p.type === 'staking' ? 'low' : 'medium',
      });
      totalValue += value;
    });

    return {
      name: daoName,
      address: `0x${Math.random().toString(16).slice(2, 42)}`,
      chains: this.supportedChains.slice(0, 4 + Math.floor(Math.random() * 3)),
      totalValueUsd: Math.round(totalValue),
      assets,
      positions,
      history: [],
    };
  }
}
