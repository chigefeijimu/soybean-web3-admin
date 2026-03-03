import { Injectable } from '@nestjs/common';

export interface LiquidityPool {
  dex: string;
  chain: string;
  token0: string;
  token1: string;
  tvl: number;
  volume24h: number;
  fee24h: number;
  apy: number;
  token0Price: number;
  token1Price: number;
  priceImpact: number;
}

export interface HeatmapCell {
  chain: string;
  dex: string;
  tvl: number;
  volume24h: number;
  liquidityScore: number;
}

export interface LiquidityAlert {
  id: string;
  type: 'high' | 'low' | 'change';
  chain: string;
  dex: string;
  token0?: string;
  token1?: string;
  threshold: number;
  currentValue: number;
  triggered: boolean;
  createdAt: string;
}

@Injectable()
export class LiquidityHeatmapService {
  private readonly supportedChains = [
    'ethereum',
    'polygon',
    'arbitrum',
    'optimism',
    'bsc',
    'base',
    'avalanche',
    'solana',
  ];

  private readonly supportedDexes = [
    { name: 'Uniswap V3', chain: 'ethereum', category: 'AMM' },
    { name: 'Uniswap V3', chain: 'arbitrum', category: 'AMM' },
    { name: 'Uniswap V3', chain: 'optimism', category: 'AMM' },
    { name: 'Uniswap V3', chain: 'base', category: 'AMM' },
    { name: 'SushiSwap', chain: 'ethereum', category: 'AMM' },
    { name: 'SushiSwap', chain: 'polygon', category: 'AMM' },
    { name: 'SushiSwap', chain: 'arbitrum', category: 'AMM' },
    { name: 'SushiSwap', chain: 'bsc', category: 'AMM' },
    { name: 'Curve', chain: 'ethereum', category: 'Stable' },
    { name: 'Curve', chain: 'polygon', category: 'Stable' },
    { name: 'Curve', chain: 'arbitrum', category: 'Stable' },
    { name: 'Curve', chain: 'avalanche', category: 'Stable' },
    { name: 'Balancer', chain: 'ethereum', category: 'AMM' },
    { name: 'Balancer', chain: 'polygon', category: 'AMM' },
    { name: 'Balancer', chain: 'arbitrum', category: 'AMM' },
    { name: 'PancakeSwap', chain: 'bsc', category: 'AMM' },
    { name: 'PancakeSwap', chain: 'ethereum', category: 'AMM' },
    { name: 'QuickSwap', chain: 'polygon', category: 'AMM' },
    { name: 'GMX', chain: 'arbitrum', category: 'Perpetual' },
    { name: 'GMX', chain: 'avalanche', category: 'Perpetual' },
    { name: 'DODO', chain: 'ethereum', category: 'AMM' },
    { name: 'DODO', chain: 'polygon', category: 'AMM' },
    { name: 'Orca', chain: 'solana', category: 'AMM' },
    { name: 'Raydium', chain: 'solana', category: 'AMM' },
  ];

  private readonly trackedTokens = [
    { symbol: 'ETH', name: 'Ethereum', price: 3000 },
    { symbol: 'BTC', name: 'Bitcoin', price: 65000 },
    { symbol: 'USDC', name: 'USD Coin', price: 1 },
    { symbol: 'USDT', name: 'Tether', price: 1 },
    { symbol: 'DAI', name: 'Dai', price: 1 },
    { symbol: 'MATIC', name: 'Polygon', price: 0.9 },
    { symbol: 'ARB', name: 'Arbitrum', price: 1.2 },
    { symbol: 'OP', name: 'Optimism', price: 2.5 },
    { symbol: 'BNB', name: 'BNB', price: 600 },
    { symbol: 'AVAX', name: 'Avalanche', price: 35 },
    { symbol: 'SOL', name: 'Solana', price: 120 },
    { symbol: 'LINK', name: 'Chainlink', price: 15 },
    { symbol: 'UNI', name: 'Uniswap', price: 10 },
    { symbol: 'AAVE', name: 'Aave', price: 250 },
    { symbol: 'CRV', name: 'Curve DAO', price: 0.5 },
    { symbol: 'LDO', name: 'Lido DAO', price: 2.8 },
    { symbol: 'MKR', name: 'Maker', price: 2800 },
    { symbol: 'SNX', name: 'Synthetix', price: 3 },
    { symbol: 'BAL', name: 'Balancer', price: 4 },
    { symbol: 'SUSHI', name: 'SushiSwap', price: 1.2 },
  ];

  private alerts: LiquidityAlert[] = [];

  async getLiquidityOverview(): Promise<any> {
    const totalTvl = await this.calculateTotalTvl();
    const totalVolume24h = await this.calculateTotalVolume();
    const chainDistribution = await this.getChainDistribution();
    const dexDistribution = await this.getDexDistribution();
    const topTokens = this.getTopLiquidityTokens();

    return {
      totalTvl,
      totalVolume24h,
      totalPools: this.supportedDexes.length * 20,
      chains: this.supportedChains.length,
      dexes: this.supportedDexes.length,
      chainDistribution,
      dexDistribution,
      topTokens,
      lastUpdated: new Date().toISOString(),
    };
  }

  async getLiquidityHeatmap(chain?: string, token?: string): Promise<HeatmapCell[]> {
    const heatmap: HeatmapCell[] = [];
    const chains = chain ? [chain] : this.supportedChains;

    for (const c of chains) {
      const dexes = this.supportedDexes.filter(d => d.chain === c);
      
      for (const dex of dexes) {
        const pools = await this.getPoolsForDex(dex.name, c, token);
        const totalTvl = pools.reduce((sum, p) => sum + p.tvl, 0);
        const totalVolume = pools.reduce((sum, p) => sum + p.volume24h, 0);
        
        // Calculate liquidity score (0-100)
        const liquidityScore = this.calculateLiquidityScore(totalTvl, totalVolume);
        
        heatmap.push({
          chain: c,
          dex: dex.name,
          tvl: totalTvl,
          volume24h: totalVolume,
          liquidityScore,
        });
      }
    }

    return heatmap.sort((a, b) => b.liquidityScore - a.liquidityScore);
  }

  async getDexLiquidity(dex: string, chain?: string): Promise<any> {
    const pools = await this.getPoolsForDex(dex, chain);
    const totalTvl = pools.reduce((sum, p) => sum + p.tvl, 0);
    const totalVolume = pools.reduce((sum, p) => sum + p.volume24h, 0);

    // Group by token pair
    const tokenPairs: Record<string, LiquidityPool[]> = {};
    for (const pool of pools) {
      const pairKey = `${pool.token0}-${pool.token1}`;
      if (!tokenPairs[pairKey]) {
        tokenPairs[pairKey] = [];
      }
      tokenPairs[pairKey].push(pool);
    }

    return {
      dex,
      chain: chain || 'all',
      poolCount: pools.length,
      totalTvl,
      totalVolume24h: totalVolume,
      averageApy: pools.length > 0 ? pools.reduce((sum, p) => sum + p.apy, 0) / pools.length : 0,
      tokenPairs: Object.entries(tokenPairs).map(([pair, pools]) => ({
        pair,
        pools: pools.length,
        bestTvl: Math.max(...pools.map(p => p.tvl)),
        bestVolume: Math.max(...pools.map(p => p.volume24h)),
      })),
    };
  }

  async getChainLiquidity(chain: string): Promise<any> {
    const dexes = this.supportedDexes.filter(d => d.chain === chain);
    let totalTvl = 0;
    let totalVolume = 0;
    const dexData: any[] = [];

    for (const dex of dexes) {
      const pools = await this.getPoolsForDex(dex.name, chain);
      const tvl = pools.reduce((sum, p) => sum + p.tvl, 0);
      const volume = pools.reduce((sum, p) => sum + p.volume24h, 0);
      
      totalTvl += tvl;
      totalVolume += volume;
      
      dexData.push({
        dex: dex.name,
        category: dex.category,
        poolCount: pools.length,
        tvl,
        volume24h: volume,
        fee24h: volume * 0.003,
        apy: pools.length > 0 ? pools.reduce((sum, p) => sum + p.apy, 0) / pools.length : 0,
      });
    }

    return {
      chain,
      dexCount: dexes.length,
      totalTvl,
      totalVolume24h: totalVolume,
      dexData: dexData.sort((a, b) => b.tvl - a.tvl),
      topDex: dexData.length > 0 ? dexData[0]?.dex : null,
    };
  }

  async getTokenPairLiquidity(token0: string, token1: string, chains?: string): Promise<any> {
    const targetChains = chains ? chains.split(',') : this.supportedChains;
    const results: any[] = [];

    for (const chain of targetChains) {
      const pools = await this.getPoolsForTokenPair(token0, token1, chain);
      
      if (pools.length > 0) {
        const bestPool = pools.reduce((best, p) => p.tvl > best.tvl ? p : best);
        
        results.push({
          chain,
          dex: bestPool.dex,
          poolCount: pools.length,
          bestTvl: bestPool.tvl,
          bestVolume: bestPool.volume24h,
          bestApy: bestPool.apy,
          priceImpact: bestPool.priceImpact,
          pools: pools.map(p => ({
            dex: p.dex,
            tvl: p.tvl,
            volume24h: p.volume24h,
            apy: p.apy,
            priceImpact: p.priceImpact,
          })),
        });
      }
    }

    // Sort by TVL
    results.sort((a, b) => b.bestTvl - a.bestTvl);

    return {
      token0: token0.toUpperCase(),
      token1: token1.toUpperCase(),
      results,
      bestRoute: results.length > 0 ? {
        chain: results[0].chain,
        dex: results[0].dex,
        tvl: results[0].bestTvl,
      } : null,
    };
  }

  async getTopPools(chain?: string, limit: number = 20): Promise<LiquidityPool[]> {
    const pools: LiquidityPool[] = [];
    const targetChains = chain ? [chain] : this.supportedChains;

    for (const c of targetChains) {
      const dexes = this.supportedDexes.filter(d => d.chain === c);
      
      for (const dex of dexes) {
        const dexPools = await this.getPoolsForDex(dex.name, c);
        pools.push(...dexPools);
      }
    }

    return pools.sort((a, b) => b.tvl - a.tvl).slice(0, limit);
  }

  async compareLiquidity(token0: string, token1: string): Promise<any> {
    const pairs = [
      [token0, token1],
      [token1, token0],
      ['USDC', token0],
      ['USDC', token1],
    ];

    const comparisons: any[] = [];

    for (const [t0, t1] of pairs) {
      const result = await this.getTokenPairLiquidity(t0, t1);
      if (result.results.length > 0) {
        comparisons.push({
          pair: `${t0}/${t1}`,
          totalLiquidity: result.results.reduce((sum: number, r: any) => sum + r.bestTvl, 0),
          chains: result.results.map((r: any) => r.chain),
        });
      }
    }

    return {
      token0: token0.toUpperCase(),
      token1: token1.toUpperCase(),
      comparisons,
      recommendation: this.getLiquidityRecommendation(comparisons),
    };
  }

  async getLiquidityTrends(days: number = 30): Promise<any> {
    const trends: any[] = [];
    
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      // Generate historical data with some variance
      const baseTvl = 15000000000;
      const variance = (Math.random() - 0.5) * 0.1;
      
      trends.push({
        date: dateStr,
        totalTvl: Math.round(baseTvl * (1 + variance + i * 0.001)),
        volume24h: Math.round(3000000000 * (1 + (Math.random() - 0.5) * 0.2)),
        txCount: Math.round(500000 * (1 + (Math.random() - 0.5) * 0.3)),
      });
    }

    return {
      period: `${days} days`,
      trends: trends.reverse(),
      summary: {
        avgTvl: Math.round(trends.reduce((sum, t) => sum + t.totalTvl, 0) / trends.length),
        avgVolume: Math.round(trends.reduce((sum, t) => sum + t.volume24h, 0) / trends.length),
        tvlChange: ((trends[trends.length - 1].totalTvl - trends[0].totalTvl) / trends[0].totalTvl * 100).toFixed(2),
        volumeChange: ((trends[trends.length - 1].volume24h - trends[0].volume24h) / trends[0].volume24h * 100).toFixed(2),
      },
    };
  }

  async getLiquidityAlerts(): Promise<LiquidityAlert[]> {
    // Check alert conditions
    const pools = await this.getTopPools(undefined, 50);
    
    for (const pool of pools) {
      // Check for high liquidity alerts
      if (pool.tvl > 100000000 && !this.alerts.find(a => a.type === 'high' && a.dex === pool.dex && a.chain === pool.chain)) {
        this.alerts.push({
          id: `alert-${Date.now()}-${Math.random()}`,
          type: 'high',
          chain: pool.chain,
          dex: pool.dex,
          token0: pool.token0,
          token1: pool.token1,
          threshold: 100000000,
          currentValue: pool.tvl,
          triggered: true,
          createdAt: new Date().toISOString(),
        });
      }
    }

    return this.alerts.slice(-20);
  }

  async createAlert(alert: Partial<LiquidityAlert>): Promise<LiquidityAlert> {
    const newAlert: LiquidityAlert = {
      id: `alert-${Date.now()}`,
      type: alert.type || 'low',
      chain: alert.chain || 'ethereum',
      dex: alert.dex || 'Uniswap V3',
      token0: alert.token0,
      token1: alert.token1,
      threshold: alert.threshold || 0,
      currentValue: 0,
      triggered: false,
      createdAt: new Date().toISOString(),
    };
    
    this.alerts.push(newAlert);
    return newAlert;
  }

  async getStatistics(): Promise<any> {
    const pools = await this.getTopPools(undefined, 100);
    
    return {
      totalPools: pools.length,
      averageTvl: pools.reduce((sum, p) => sum + p.tvl, 0) / pools.length,
      medianTvl: pools[Math.floor(pools.length / 2)]?.tvl || 0,
      totalVolume24h: pools.reduce((sum, p) => sum + p.volume24h, 0),
      averageApy: pools.reduce((sum, p) => sum + p.apy, 0) / pools.length,
      byCategory: {
        AMM: pools.filter(p => ['Uniswap V3', 'SushiSwap', 'PancakeSwap'].includes(p.dex)).length,
        Stable: pools.filter(p => p.dex === 'Curve').length,
        Perpetual: pools.filter(p => p.dex === 'GMX').length,
      },
      topChains: await this.getChainDistribution(),
      topDexes: await this.getDexDistribution(),
    };
  }

  getSupportedChains(): string[] {
    return this.supportedChains;
  }

  getSupportedDexes(): { name: string; chain: string; category: string }[] {
    return this.supportedDexes;
  }

  getTrackedTokens(): { symbol: string; name: string; price: number }[] {
    return this.trackedTokens;
  }

  // Private helper methods
  private async calculateTotalTvl(): Promise<number> {
    let total = 0;
    for (const chain of this.supportedChains) {
      const dexes = this.supportedDexes.filter(d => d.chain === chain);
      for (const dex of dexes) {
        const pools = await this.getPoolsForDex(dex.name, chain);
        total += pools.reduce((sum, p) => sum + p.tvl, 0);
      }
    }
    return total;
  }

  private async calculateTotalVolume(): Promise<number> {
    let total = 0;
    for (const chain of this.supportedChains) {
      const dexes = this.supportedDexes.filter(d => d.chain === chain);
      for (const dex of dexes) {
        const pools = await this.getPoolsForDex(dex.name, chain);
        total += pools.reduce((sum, p) => sum + p.volume24h, 0);
      }
    }
    return total;
  }

  private async getChainDistribution(): Promise<Record<string, number>> {
    const distribution: Record<string, number> = {};
    
    for (const chain of this.supportedChains) {
      let chainTvl = 0;
      const dexes = this.supportedDexes.filter(d => d.chain === chain);
      for (const dex of dexes) {
        const pools = await this.getPoolsForDex(dex.name, chain);
        chainTvl += pools.reduce((sum, p) => sum + p.tvl, 0);
      }
      distribution[chain] = chainTvl;
    }
    
    return distribution;
  }

  private async getDexDistribution(): Promise<Record<string, number>> {
    const distribution: Record<string, number> = {};
    
    for (const dex of this.supportedDexes) {
      const pools = await this.getPoolsForDex(dex.name, dex.chain);
      distribution[dex.name] = (distribution[dex.name] || 0) + pools.reduce((sum, p) => sum + p.tvl, 0);
    }
    
    return distribution;
  }

  private getTopLiquidityTokens(): { symbol: string; tvl: number }[] {
    // Simulate top tokens by liquidity
    const tokenTvl: Record<string, number> = {};
    
    for (const token of this.trackedTokens) {
      // Generate TVL based on token price and a factor
      tokenTvl[token.symbol] = token.price * (500000 + Math.random() * 1000000);
    }
    
    return Object.entries(tokenTvl)
      .map(([symbol, tvl]) => ({ symbol, tvl }))
      .sort((a, b) => b.tvl - a.tvl)
      .slice(0, 10);
  }

  private calculateLiquidityScore(tvl: number, volume: number): number {
    // Weighted score based on TVL and volume
    const tvlScore = Math.min(tvl / 100000000, 50); // Max 50 points for TVL
    const volumeScore = Math.min(volume / 50000000, 50); // Max 50 points for volume
    
    return Math.round(tvlScore + volumeScore);
  }

  private async getPoolsForDex(dex: string, chain: string, token?: string): Promise<LiquidityPool[]> {
    const pools: LiquidityPool[] = [];
    const tokenPairs = this.getTokenPairs(dex, chain);
    
    for (const pair of tokenPairs) {
      if (token && !pair.includes(token.toUpperCase())) continue;
      
      const hash = this.hashCode(`${dex}-${chain}-${pair}`);
      const tvl = 100000 + Math.abs(hash % 100000000);
      const volume = 50000 + Math.abs((hash * 2) % 50000000);
      
      const [token0, token1] = pair.split('-');
      const token0Price = this.getTokenPrice(token0);
      const token1Price = this.getTokenPrice(token1);
      
      pools.push({
        dex,
        chain,
        token0,
        token1,
        tvl,
        volume24h: volume,
        fee24h: volume * 0.003,
        apy: 5 + (Math.abs(hash) % 20),
        token0Price,
        token1Price,
        priceImpact: this.calculatePriceImpact(volume, tvl),
      });
    }
    
    return pools;
  }

  private async getPoolsForTokenPair(token0: string, token1: string, chain: string): Promise<LiquidityPool[]> {
    const pools: LiquidityPool[] = [];
    const dexes = this.supportedDexes.filter(d => d.chain === chain);
    
    for (const dex of dexes) {
      const hash = this.hashCode(`${dex.name}-${chain}-${token0}-${token1}`);
      const tvl = 50000 + Math.abs(hash % 50000000);
      const volume = 10000 + Math.abs((hash * 2) % 10000000);
      
      pools.push({
        dex: dex.name,
        chain,
        token0,
        token1,
        tvl,
        volume24h: volume,
        fee24h: volume * 0.003,
        apy: 5 + (Math.abs(hash) % 15),
        token0Price: this.getTokenPrice(token0),
        token1Price: this.getTokenPrice(token1),
        priceImpact: this.calculatePriceImpact(volume, tvl),
      });
    }
    
    return pools;
  }

  private getTokenPairs(dex: string, chain: string): string[] {
    const stablecoins = ['USDC', 'USDT', 'DAI'];
    const tokens = this.trackedTokens.slice(0, 10).map(t => t.symbol);
    
    const pairs: string[] = [];
    
    // Stablecoin pairs
    for (const token of tokens) {
      if (!stablecoins.includes(token)) {
        for (const stable of stablecoins) {
          pairs.push(`${token}-${stable}`);
        }
      }
    }
    
    // Major token pairs
    const majorPairs = ['ETH-BTC', 'ETH-USDC', 'BTC-USDC', 'ETH-USDT', 'LINK-ETH', 'UNI-ETH', 'AAVE-ETH'];
    pairs.push(...majorPairs);
    
    return pairs.slice(0, 25);
  }

  private getTokenPrice(symbol: string): number {
    const token = this.trackedTokens.find(t => t.symbol === symbol);
    return token?.price || 1;
  }

  private calculatePriceImpact(volume: number, tvl: number): number {
    // Simplified price impact calculation
    const ratio = volume / tvl;
    return Math.min(ratio * 100, 5);
  }

  private getLiquidityRecommendation(comparisons: any[]): any {
    if (comparisons.length === 0) {
      return { recommended: null, reason: 'No liquidity found' };
    }

    const sorted = comparisons.sort((a, b) => b.totalLiquidity - a.totalLiquidity);
    const best = sorted[0];

    return {
      pair: best.pair,
      liquidity: best.totalLiquidity,
      chains: best.chains,
      reason: `Highest liquidity found on ${best.chains[0]}`,
    };
  }

  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash;
  }
}
