import { Injectable } from '@nestjs/common';

interface ArbitrageOpportunity {
  id: string;
  chain: string;
  tokenPair: string;
  buyDex: string;
  sellDex: string;
  buyPrice: number;
  sellPrice: number;
  spread: number;
  estimatedProfit: number;
  gasCost: number;
  netProfit: number;
  confidence: number;
  risk: 'low' | 'medium' | 'high';
  timestamp: number;
  volume24h: number;
  liquidity: number;
  executionSteps: string[];
}

interface PoolInfo {
  dex: string;
  token0: string;
  token1: string;
  liquidity: number;
  volume24h: number;
  fee: number;
}

interface AlertConfig {
  id: string;
  address: string;
  minProfit: number;
  chains: string[];
  tokens: string[];
  createdAt: number;
}

@Injectable()
export class AppService {
  private opportunities: ArbitrageOpportunity[] = [];
  private pools: Map<string, PoolInfo[]> = new Map();
  private alerts: AlertConfig[] = [];
  private history: ArbitrageOpportunity[] = [];

  constructor() {
    this.initializeData();
  }

  private initializeData() {
    const chains = ['ethereum', 'arbitrum', 'optimism', 'bsc', 'polygon', 'base', 'avalanche'];
    const dexes = ['Uniswap V3', 'SushiSwap', 'Curve', 'Balancer', 'PancakeSwap', 'QuickSwap', 'GMX', 'Orca'];
    const tokenPairs = [
      { pair: 'ETH/USDC', baseToken: 'ETH' },
      { pair: 'WBTC/USDC', baseToken: 'WBTC' },
      { pair: 'USDT/USDC', baseToken: 'USDT' },
      { pair: 'DAI/USDC', baseToken: 'DAI' },
      { pair: 'SOL/USDC', baseToken: 'SOL' },
      { pair: 'ARB/USDC', baseToken: 'ARB' },
      { pair: 'OP/USDC', baseToken: 'OP' },
      { pair: 'MATIC/USDC', baseToken: 'MATIC' },
      { pair: 'AVAX/USDC', baseToken: 'AVAX' },
      { pair: 'LINK/USDC', baseToken: 'LINK' },
      { pair: 'UNI/USDC', baseToken: 'UNI' },
      { pair: 'AAVE/USDC', baseToken: 'AAVE' },
      { pair: 'CRV/USDC', baseToken: 'CRV' },
      { pair: 'LDO/USDC', baseToken: 'LDO' },
    ];

    // Generate opportunities for each chain
    chains.forEach((chain) => {
      tokenPairs.forEach((tp, idx) => {
        if (Math.random() > 0.4) {
          const buyDex = dexes[Math.floor(Math.random() * dexes.length)];
          let sellDex = dexes[Math.floor(Math.random() * dexes.length)];
          while (sellDex === buyDex) {
            sellDex = dexes[Math.floor(Math.random() * dexes.length)];
          }

          const basePrice = this.getBasePrice(tp.baseToken);
          const spread = (Math.random() * 3 + 0.1) * (Math.random() > 0.5 ? 1 : -1);
          const buyPrice = basePrice * (1 + spread / 100);
          const sellPrice = basePrice;
          
          const volume24h = Math.random() * 50000000 + 100000;
          const liquidity = Math.random() * 100000000 + 500000;
          const gasCost = this.getGasCost(chain);
          const flashloanFee = 0.0006; // 0.06% for Aave
          const estimatedProfit = (buyPrice * volume24h * (spread / 100)) - gasCost;
          const netProfit = estimatedProfit - (volume24h * flashloanFee);

          const confidence = Math.min(95, Math.max(20, 85 + Math.random() * 10 - spread * 5));
          
          let risk: 'low' | 'medium' | 'high' = 'low';
          if (Math.abs(spread) > 2 || liquidity < 1000000) risk = 'high';
          else if (Math.abs(spread) > 1 || liquidity < 5000000) risk = 'medium';

          this.opportunities.push({
            id: `${chain}-${tp.pair}-${idx}-${Date.now()}`,
            chain,
            tokenPair: tp.pair,
            buyDex,
            sellDex,
            buyPrice,
            sellPrice,
            spread: Math.abs(spread),
            estimatedProfit,
            gasCost,
            netProfit,
            confidence: Math.round(confidence),
            risk,
            timestamp: Date.now() - Math.random() * 3600000,
            volume24h: Math.round(volume24h),
            liquidity: Math.round(liquidity),
            executionSteps: [
              `1. Flashloan ${tp.baseToken === 'ETH' ? 'WETH' : tp.baseToken} from Aave`,
              `2. Swap ${tp.baseToken} for USDC on ${buyDex}`,
              `3. Swap USDC back to ${tp.baseToken} on ${sellDex}`,
              `4. Repay flashloan and keep profit`,
            ],
          });
        }
      });
    });

    // Sort by net profit
    this.opportunities.sort((a, b) => b.netProfit - a.netProfit);

    // Initialize pools
    chains.forEach((chain) => {
      const chainPools: PoolInfo[] = [];
      tokenPairs.forEach((tp) => {
        dexes.forEach((dex) => {
          chainPools.push({
            dex,
            token0: tp.pair.split('/')[0],
            token1: tp.pair.split('/')[1],
            liquidity: Math.random() * 100000000 + 100000,
            volume24h: Math.random() * 50000000 + 50000,
            fee: this.getDexFee(dex),
          });
        });
      });
      this.pools.set(chain, chainPools);
    });

    // Initialize sample alerts
    this.alerts = [
      {
        id: 'alert-1',
        address: '0x742d35Cc6634C0532925a3b844Bc9e7595f1234',
        minProfit: 100,
        chains: ['ethereum', 'arbitrum'],
        tokens: ['ETH', 'WBTC', 'ARB'],
        createdAt: Date.now() - 86400000,
      },
      {
        id: 'alert-2',
        address: '0x1234567890abcdef1234567890abcdef12345678',
        minProfit: 50,
        chains: ['ethereum', 'bsc', 'polygon'],
        tokens: ['ETH', 'BNB', 'MATIC'],
        createdAt: Date.now() - 172800000,
      },
    ];

    // Generate history
    for (let i = 0; i < 100; i++) {
      const chain = chains[Math.floor(Math.random() * chains.length)];
      const pair = tokenPairs[Math.floor(Math.random() * tokenPairs.length)];
      const profit = (Math.random() * 1000 - 50) * (Math.random() > 0.3 ? 1 : 0);
      this.history.push({
        id: `history-${i}`,
        chain,
        tokenPair: pair.pair,
        buyDex: dexes[Math.floor(Math.random() * dexes.length)],
        sellDex: dexes[Math.floor(Math.random() * dexes.length)],
        buyPrice: this.getBasePrice(pair.baseToken),
        sellPrice: this.getBasePrice(pair.baseToken),
        spread: Math.random() * 2,
        estimatedProfit: profit,
        gasCost: this.getGasCost(chain),
        netProfit: profit - this.getGasCost(chain),
        confidence: Math.round(50 + Math.random() * 45),
        risk: Math.random() > 0.7 ? 'high' : Math.random() > 0.4 ? 'medium' : 'low',
        timestamp: Date.now() - Math.random() * 7 * 86400000,
        volume24h: Math.random() * 50000000,
        liquidity: Math.random() * 100000000,
        executionSteps: [],
      });
    }
  }

  private getBasePrice(token: string): number {
    const prices: Record<string, number> = {
      ETH: 3250,
      WBTC: 68500,
      USDC: 1,
      USDT: 1,
      DAI: 1,
      SOL: 145,
      ARB: 1.85,
      OP: 3.2,
      MATIC: 0.85,
      AVAX: 38,
      LINK: 18,
      UNI: 12,
      AAVE: 95,
      CRV: 0.55,
      LDO: 2.8,
    };
    return prices[token] || 100;
  }

  private getGasCost(chain: string): number {
    const gasCosts: Record<string, number> = {
      ethereum: 25,
      arbitrum: 0.5,
      optimism: 0.8,
      bsc: 1.5,
      polygon: 0.1,
      base: 0.3,
      avalanche: 1.2,
    };
    return gasCosts[chain] || 10;
  }

  private getDexFee(dex: string): number {
    const fees: Record<string, number> = {
      'Uniswap V3': 0.3,
      'SushiSwap': 0.3,
      'Curve': 0.04,
      'Balancer': 0.2,
      'PancakeSwap': 0.3,
      'QuickSwap': 0.3,
      'GMX': 0.1,
      'Orca': 0.3,
    };
    return fees[dex] || 0.3;
  }

  getOpportunities(chain?: string, minProfit?: number, limit: number = 20) {
    let filtered = [...this.opportunities];
    
    if (chain) {
      filtered = filtered.filter((o) => o.chain === chain);
    }
    if (minProfit !== undefined) {
      filtered = filtered.filter((o) => o.netProfit >= minProfit);
    }
    
    return {
      success: true,
      data: filtered.slice(0, limit),
      total: filtered.length,
      timestamp: Date.now(),
    };
  }

  getOpportunity(id: string) {
    const opportunity = this.opportunities.find((o) => o.id === id);
    if (!opportunity) {
      return { success: false, error: 'Opportunity not found' };
    }
    return { success: true, data: opportunity };
  }

  getPools(chain?: string, token?: string) {
    let allPools: PoolInfo[] = [];
    
    if (chain) {
      allPools = this.pools.get(chain) || [];
    } else {
      this.pools.forEach((pools) => {
        allPools = allPools.concat(pools);
      });
    }

    if (token) {
      allPools = allPools.filter(
        (p) => p.token0 === token || p.token1 === token,
      );
    }

    return {
      success: true,
      data: allPools.slice(0, 50),
      total: allPools.length,
    };
  }

  getHistory(chain?: string, limit: number = 50) {
    let filtered = [...this.history];
    
    if (chain) {
      filtered = filtered.filter((h) => h.chain === chain);
    }
    
    filtered.sort((a, b) => b.timestamp - a.timestamp);
    
    return {
      success: true,
      data: filtered.slice(0, limit),
      total: filtered.length,
    };
  }

  createAlert(body: {
    address: string;
    minProfit: number;
    chains?: string[];
    tokens?: string[];
  }) {
    const alert: AlertConfig = {
      id: `alert-${Date.now()}`,
      address: body.address,
      minProfit: body.minProfit,
      chains: body.chains || [],
      tokens: body.tokens || [],
      createdAt: Date.now(),
    };
    this.alerts.push(alert);
    
    return { success: true, data: alert };
  }

  getAlerts(address?: string) {
    if (address) {
      return {
        success: true,
        data: this.alerts.filter((a) => a.address === address),
      };
    }
    return { success: true, data: this.alerts };
  }

  getStats(chain?: string) {
    let filtered = [...this.opportunities];
    if (chain) {
      filtered = filtered.filter((o) => o.chain === chain);
    }

    const totalProfit = filtered.reduce((sum, o) => sum + o.netProfit, 0);
    const avgProfit = filtered.length > 0 ? totalProfit / filtered.length : 0;
    const avgConfidence = filtered.length > 0
      ? filtered.reduce((sum, o) => sum + o.confidence, 0) / filtered.length
      : 0;

    const chainStats = filtered.reduce((acc, o) => {
      if (!acc[o.chain]) {
        acc[o.chain] = { count: 0, totalProfit: 0 };
      }
      acc[o.chain].count++;
      acc[o.chain].totalProfit += o.netProfit;
      return acc;
    }, {} as Record<string, { count: number; totalProfit: number }>);

    return {
      success: true,
      data: {
        totalOpportunities: filtered.length,
        averageProfit: avgProfit.toFixed(2),
        averageConfidence: Math.round(avgConfidence),
        totalProfit24h: totalProfit.toFixed(2),
        byChain: chainStats,
        riskDistribution: {
          low: filtered.filter((o) => o.risk === 'low').length,
          medium: filtered.filter((o) => o.risk === 'medium').length,
          high: filtered.filter((o) => o.risk === 'high').length,
        },
      },
    };
  }

  getTradingPairs(chain?: string) {
    const pairs = new Set<string>();
    this.opportunities.forEach((o) => {
      if (!chain || o.chain === chain) {
        pairs.add(o.tokenPair);
      }
    });

    return {
      success: true,
      data: Array.from(pairs).map((pair) => ({
        pair,
        opportunities: this.opportunities.filter((o) => o.tokenPair === pair).length,
      })),
    };
  }
}
