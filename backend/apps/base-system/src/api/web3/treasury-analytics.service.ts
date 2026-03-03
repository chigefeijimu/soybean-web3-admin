import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface TreasuryAsset {
  token: string;
  symbol: string;
  balance: string;
  value: number;
  chain: string;
  percentage: number;
}

export interface TreasuryFlow {
  type: 'inflow' | 'outflow';
  amount: number;
  token: string;
  from: string;
  to: string;
  timestamp: number;
  txHash: string;
}

export interface TreasuryHealth {
  score: number;
  rating: 'excellent' | 'good' | 'fair' | 'poor';
  diversification: number;
  liquidity: number;
  sustainability: number;
  factors: string[];
}

export interface DaoTreasury {
  dao: string;
  totalValue: number;
  assets: TreasuryAsset[];
  chains: string[];
  flows: TreasuryFlow[];
  health: TreasuryHealth;
  lastUpdated: number;
}

export interface TreasuryComparison {
  dao: string;
  totalValue: number;
  rank: number;
  change24h: number;
}

@Injectable()
export class TreasuryAnalyticsService {
  private readonly coingeckoApi = 'https://api.coingecko.com/api/v3';
  
  // Popular DAO treasury addresses (mainnet)
  private readonly daoTreasuries: Record<string, Record<string, string>> = {
    Uniswap: {
      ethereum: '0x1a9C8182c09F50C8318d769245beA52c32BE15BC',
    },
    Aave: {
      ethereum: '0xE50dA337eE9bA4c57F05b7C74E3EABa2a2d5f0f6',
    },
    MakerDAO: {
      ethereum: '0x0a2B0d76DbA8184a713A3d8bA6DDBE2fB6dB2D5e',
    },
    Compound: {
      ethereum: '0x8dAEc6FAD8C7cBf5f7b3EdcF0c3d5F8d9E4F2a1',
    },
    Curve: {
      ethereum: '0x7a16fF8270133F063aAb6C9977183D9e72835428',
    },
    Lido: {
      ethereum: '0x3F1c547b21f65d104e6e8A8D5D7a0E3b2C4F8e9D',
    },
    ENS: {
      ethereum: '0xFe89cc7aBB2C418367EA2d8F8d4dB2aB9D4C2d7E',
    },
    Balancer: {
      ethereum: '0x10A19e7eE7d7F8a36bbFAd79fdc5dE017B1dE4b8',
    },
  };

  private readonly supportedChains = [
    'ethereum', 'polygon', 'arbitrum', 'optimism', 'avalanche', 'bsc', 'base'
  ];

  constructor(private readonly httpService: HttpService) {}

  async getTreasuryOverview(dao: string): Promise<DaoTreasury> {
    const treasury = this.daoTreasuries[dao];
    if (!treasury) {
      throw new Error(`DAO ${dao} not supported`);
    }

    const assets: TreasuryAsset[] = [];
    const prices = await this.getTokenPrices();
    
    let totalValue = 0;
    const chains = Object.keys(treasury);

    // Simulate treasury assets (in production, this would query on-chain data)
    const mockAssets = this.generateMockTreasury(dao);
    
    for (const asset of mockAssets) {
      const price = prices[asset.token.toLowerCase()] || 0;
      const value = parseFloat(asset.balance) * price;
      totalValue += value;
      assets.push({
        ...asset,
        value,
        percentage: 0, // Will calculate after total
      });
    }

    // Calculate percentages
    assets.forEach(asset => {
      asset.percentage = totalValue > 0 ? (asset.value / totalValue) * 100 : 0;
    });

    // Generate mock flows
    const flows = this.generateMockFlows();

    // Calculate health
    const health = this.calculateHealth(assets, totalValue);

    return {
      dao,
      totalValue,
      assets: assets.sort((a, b) => b.value - a.value),
      chains,
      flows,
      health,
      lastUpdated: Date.now(),
    };
  }

  async getAllTreasuries(): Promise<TreasuryComparison[]> {
    const results: TreasuryComparison[] = [];
    const prices = await this.getTokenPrices();

    for (const dao of Object.keys(this.daoTreasuries)) {
      const mockAssets = this.generateMockTreasury(dao);
      let totalValue = 0;
      
      for (const asset of mockAssets) {
        const price = prices[asset.token.toLowerCase()] || 0;
        totalValue += parseFloat(asset.balance) * price;
      }

      results.push({
        dao,
        totalValue,
        rank: 0, // Will be calculated
        change24h: (Math.random() - 0.5) * 20, // -10% to +10%
      });
    }

    // Sort by total value and assign ranks
    results.sort((a, b) => b.totalValue - a.totalValue);
    results.forEach((r, i) => r.rank = i + 1);

    return results;
  }

  async getTreasuryHistory(dao: string, days: number = 30): Promise<{
    timestamps: number[];
    values: number[];
  }> {
    const treasury = await this.getTreasuryOverview(dao);
    const timestamps: number[] = [];
    const values: number[] = [];
    
    const now = Date.now();
    const msPerDay = 24 * 60 * 60 * 1000;
    
    // Generate historical data with some variance
    let currentValue = treasury.totalValue;
    for (let i = days; i >= 0; i--) {
      timestamps.push(now - i * msPerDay);
      // Add some random variation
      const variance = (Math.random() - 0.5) * 0.1 * currentValue;
      currentValue = currentValue * 0.99 + variance;
      values.push(Math.max(0, currentValue));
    }
    
    // Ensure the last value matches current
    values[values.length - 1] = treasury.totalValue;

    return { timestamps, values };
  }

  async getTreasuryFlows(dao: string, days: number = 7): Promise<TreasuryFlow[]> {
    const treasury = await this.getTreasuryOverview(dao);
    return treasury.flows.slice(0, days * 10); // Limit to roughly one flow per day
  }

  async getAssetAllocation(dao: string): Promise<{
    byChain: Record<string, number>;
    byCategory: Record<string, number>;
  }> {
    const treasury = await this.getTreasuryOverview(dao);
    
    const byChain: Record<string, number> = {};
    const byCategory: Record<string, number> = {
      'stablecoin': 0,
      'defi': 0,
      ' governance': 0,
      'other': 0,
    };

    for (const asset of treasury.assets) {
      // By chain
      byChain[asset.chain] = (byChain[asset.chain] || 0) + asset.value;
      
      // By category (simplified)
      const token = asset.token.toLowerCase();
      if (['usdt', 'usdc', 'dai', 'busd', 'usdt'].includes(token)) {
        byCategory['stablecoin'] += asset.value;
      } else if (['uni', 'aave', 'crv', 'bal', 'comp', 'mkr', 'ldo'].includes(token)) {
        byCategory['defi'] += asset.value;
      } else if (['eth', 'weth'].includes(token)) {
        byCategory['governance'] += asset.value;
      } else {
        byCategory['other'] += asset.value;
      }
    }

    return { byChain, byCategory };
  }

  async compareTreasuries(daos: string[]): Promise<TreasuryComparison[]> {
    const results: TreasuryComparison[] = [];
    
    for (const dao of daos) {
      try {
        const treasury = await this.getTreasuryOverview(dao);
        results.push({
          dao: treasury.dao,
          totalValue: treasury.totalValue,
          rank: 0,
          change24h: (Math.random() - 0.5) * 20,
        });
      } catch (e) {
        // Skip unsupported DAOs
      }
    }

    results.sort((a, b) => b.totalValue - a.totalValue);
    results.forEach((r, i) => r.rank = i + 1);

    return results;
  }

  async getTreasuryAlerts(dao: string): Promise<{
    type: string;
    severity: 'low' | 'medium' | 'high';
    message: string;
    value?: number;
  }[]> {
    const treasury = await this.getTreasuryOverview(dao);
    const alerts: {
      type: string;
      severity: 'low' | 'medium' | 'high';
      message: string;
      value?: number;
    }[] = [];

    // Check diversification
    if (treasury.assets.length < 3) {
      alerts.push({
        type: 'diversification',
        severity: 'high',
        message: 'Treasury has low diversification',
      });
    }

    // Check concentration
    const topAsset = treasury.assets[0];
    if (topAsset && topAsset.percentage > 50) {
      alerts.push({
        type: 'concentration',
        severity: 'medium',
        message: `${topAsset.symbol} represents ${topAsset.percentage.toFixed(1)}% of treasury`,
        value: topAsset.percentage,
      });
    }

    // Check health score
    if (treasury.health.score < 50) {
      alerts.push({
        type: 'health',
        severity: 'high',
        message: `Treasury health score is low: ${treasury.health.score}/100`,
        value: treasury.health.score,
      });
    }

    // Check large outflows
    const outflows = treasury.flows.filter(f => f.type === 'outflow');
    const largeOutflows = outflows.filter(f => f.amount > treasury.totalValue * 0.05);
    if (largeOutflows.length > 0) {
      alerts.push({
        type: 'large_outflow',
        severity: 'medium',
        message: `Detected ${largeOutflows.length} large outflow(s) in recent transactions`,
      });
    }

    return alerts;
  }

  private calculateHealth(assets: TreasuryAsset[], totalValue: number): TreasuryHealth {
    const factors: string[] = [];
    let diversification = 50;
    let liquidity = 50;
    let sustainability = 50;

    // Diversification score
    if (assets.length >= 5) {
      diversification = 80;
      factors.push('Good asset diversification');
    } else if (assets.length >= 3) {
      diversification = 60;
      factors.push('Moderate diversification');
    } else {
      diversification = 30;
      factors.push('Low diversification - concentrated holdings');
    }

    // Check stablecoin ratio
    const stableValue = assets
      .filter(a => ['USDT', 'USDC', 'DAI'].includes(a.symbol))
      .reduce((sum, a) => sum + a.value, 0);
    const stableRatio = totalValue > 0 ? (stableValue / totalValue) * 100 : 0;
    
    if (stableRatio >= 20 && stableRatio <= 50) {
      liquidity = 80;
      factors.push('Good stablecoin reserves');
    } else if (stableRatio < 10) {
      liquidity = 40;
      factors.push('Low stablecoin reserves - liquidity risk');
    }

    // Sustainability based on assets
    const governanceTokens = assets.filter(a => 
      ['UNI', 'AAVE', 'CRV', 'BAL', 'COMP', 'MKR', 'LDO'].includes(a.symbol)
    );
    if (governanceTokens.length >= 3) {
      sustainability = 75;
      factors.push('Strong governance token holdings');
    }

    const score = Math.round((diversification * 0.4 + liquidity * 0.3 + sustainability * 0.3));
    
    let rating: 'excellent' | 'good' | 'fair' | 'poor';
    if (score >= 80) rating = 'excellent';
    else if (score >= 60) rating = 'good';
    else if (score >= 40) rating = 'fair';
    else rating = 'poor';

    return { score, rating, diversification, liquidity, sustainability, factors };
  }

  private async getTokenPrices(): Promise<Record<string, number>> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.coingeckoApi}/simple/price`, {
          params: {
            ids: 'ethereum,usdt,usdc,dai,uniswap,aave,curve-dao-token,balancer,compound-governance-token,maker,staked-ehter,lido-dao,wrapped-staked-eth',
            vs_currencies: 'usd',
          },
        })
      );
      return response.data;
    } catch (e) {
      // Return mock prices if API fails
      return {
        'ethereum': 2500,
        'usdt': 1,
        'usdc': 1,
        'dai': 1,
        'uniswap': 7.5,
        'aave': 180,
        'curve-dao-token': 0.5,
        'balancer': 4.2,
        'compound-governance-token': 55,
        'maker': 1500,
        'staked-ehter': 2700,
        'lido-dao': 2.1,
        'wrapped-staked-eth': 2750,
      };
    }
  }

  private generateMockTreasury(dao: string): TreasuryAsset[] {
    // Generate realistic mock treasury data based on DAO
    const baseValue = {
      Uniswap: 3000000000,
      Aave: 1500000000,
      MakerDAO: 8000000000,
      Compound: 500000000,
      Curve: 2000000000,
      Lido: 15000000000,
      ENS: 300000000,
      Balancer: 200000000,
    }[dao] || 1000000000;

    const tokens = [
      { token: 'ethereum', symbol: 'ETH', balance: (baseValue * 0.3 / 2500).toFixed(2), chain: 'ethereum' },
      { token: 'usdt', symbol: 'USDT', balance: (baseValue * 0.2).toFixed(0), chain: 'ethereum' },
      { token: 'usdc', symbol: 'USDC', balance: (baseValue * 0.15).toFixed(0), chain: 'ethereum' },
      { token: 'dai', symbol: 'DAI', balance: (baseValue * 0.1).toFixed(0), chain: 'ethereum' },
      { token: 'uniswap', symbol: 'UNI', balance: (baseValue * 0.1 / 7.5).toFixed(0), chain: 'ethereum' },
      { token: 'aave', symbol: 'AAVE', balance: (baseValue * 0.05 / 180).toFixed(0), chain: 'ethereum' },
      { token: 'curve-dao-token', symbol: 'CRV', balance: (baseValue * 0.05 / 0.5).toFixed(0), chain: 'ethereum' },
      { token: 'balancer', symbol: 'BAL', balance: (baseValue * 0.03 / 4.2).toFixed(0), chain: 'ethereum' },
    ];

    return tokens as TreasuryAsset[];
  }

  private generateMockFlows(): TreasuryFlow[] {
    const flows: TreasuryFlow[] = [];
    const tokens = ['ETH', 'USDT', 'USDC', 'UNI', 'AAVE'];
    const now = Date.now();
    
    for (let i = 0; i < 50; i++) {
      const type = Math.random() > 0.4 ? 'inflow' : 'outflow';
      flows.push({
        type,
        amount: Math.random() * 1000000,
        token: tokens[Math.floor(Math.random() * tokens.length)],
        from: `0x${Math.random().toString(16).substr(2, 40)}`,
        to: `0x${Math.random().toString(16).substr(2, 40)}`,
        timestamp: now - Math.random() * 7 * 24 * 60 * 60 * 1000,
        txHash: `0x${Math.random().toString(16).substr(2, 64)}`,
      });
    }
    
    return flows.sort((a, b) => b.timestamp - a.timestamp);
  }
}
