export interface DcaStrategy {
  id: string;
  userAddress: string;
  fromToken: string;
  toToken: string;
  chain: string;
  amountPerPurchase: number;
  frequency: 'hourly' | 'daily' | 'weekly' | 'biweekly' | 'monthly';
  totalPurchases: number;
  completedPurchases: number;
  nextPurchaseTime: Date;
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  startDate: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface DcaPosition {
  id: string;
  strategyId: string;
  userAddress: string;
  token: string;
  chain: string;
  totalAmount: number;
  averagePrice: number;
  currentPrice: number;
  pnl: number;
  pnlPercentage: number;
  purchaseHistory: Array<{
    timestamp: Date;
    amount: number;
    price: number;
    txHash: string;
  }>;
}

export interface DcaOpportunity {
  fromToken: string;
  toToken: string;
  chain: string;
  fromTokenSymbol: string;
  toTokenSymbol: string;
  currentPrice: number;
  avgPrice7d: number;
  avgPrice30d: number;
  volatility: number;
  trend: 'bullish' | 'bearish' | 'neutral';
  apy: number;
  risk: 'low' | 'medium' | 'high';
  confidence: number;
}

export interface DcaStatistics {
  totalStrategies: number;
  activeStrategies: number;
  totalInvested: number;
  totalValue: number;
  totalPnL: number;
  totalPnLPercentage: number;
  averageApy: number;
  chainDistribution: Record<string, number>;
  tokenDistribution: Record<string, number>;
}

export interface CreateStrategyDto {
  userAddress: string;
  fromToken: string;
  toToken: string;
  chain: string;
  amountPerPurchase: number;
  frequency: 'hourly' | 'daily' | 'weekly' | 'biweekly' | 'monthly';
  totalPurchases: number;
  startDate: string;
  endDate?: string;
}

export class DcaBotService {
  private strategies: Map<string, DcaStrategy> = new Map();
  private positions: Map<string, DcaPosition> = new Map();

  constructor() {
    this.initializeMockData();
  }

  private initializeMockData() {
    // Mock supported chains
  }

  async getStrategies(address: string): Promise<{ strategies: DcaStrategy[] }> {
    const strategies = Array.from(this.strategies.values()).filter(
      s => s.userAddress === address,
    );
    return { strategies };
  }

  async createStrategy(dto: CreateStrategyDto): Promise<DcaStrategy> {
    const id = `dca_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const now = new Date();
    const nextPurchase = this.calculateNextPurchaseTime(dto.frequency, new Date(dto.startDate));

    const strategy: DcaStrategy = {
      id,
      userAddress: dto.userAddress.toLowerCase(),
      fromToken: dto.fromToken.toUpperCase(),
      toToken: dto.toToken.toUpperCase(),
      chain: dto.chain,
      amountPerPurchase: dto.amountPerPurchase,
      frequency: dto.frequency,
      totalPurchases: dto.totalPurchases,
      completedPurchases: 0,
      nextPurchaseTime: nextPurchase,
      status: 'active',
      startDate: new Date(dto.startDate),
      endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      createdAt: now,
      updatedAt: now,
    };

    this.strategies.set(id, strategy);

    // Create position
    const positionId = `pos_${id}`;
    const position: DcaPosition = {
      id: positionId,
      strategyId: id,
      userAddress: dto.userAddress.toLowerCase(),
      token: dto.toToken.toUpperCase(),
      chain: dto.chain,
      totalAmount: 0,
      averagePrice: 0,
      currentPrice: this.getMockPrice(dto.toToken),
      pnl: 0,
      pnlPercentage: 0,
      purchaseHistory: [],
    };
    this.positions.set(positionId, position);

    return strategy;
  }

  async pauseStrategy(id: string): Promise<{ success: boolean; strategy: DcaStrategy }> {
    const strategy = this.strategies.get(id);
    if (!strategy) {
      throw new Error('Strategy not found');
    }
    strategy.status = 'paused';
    strategy.updatedAt = new Date();
    return { success: true, strategy };
  }

  async resumeStrategy(id: string): Promise<{ success: boolean; strategy: DcaStrategy }> {
    const strategy = this.strategies.get(id);
    if (!strategy) {
      throw new Error('Strategy not found');
    }
    strategy.status = 'active';
    strategy.nextPurchaseTime = this.calculateNextPurchaseTime(strategy.frequency, new Date());
    strategy.updatedAt = new Date();
    return { success: true, strategy };
  }

  async deleteStrategy(id: string): Promise<{ success: boolean }> {
    const strategy = this.strategies.get(id);
    if (strategy) {
      strategy.status = 'cancelled';
    }
    return { success: true };
  }

  async getPositions(address: string): Promise<{ positions: DcaPosition[] }> {
    const positions = Array.from(this.positions.values()).filter(
      p => p.userAddress === address.toLowerCase(),
    );
    return { positions };
  }

  async getPosition(id: string): Promise<DcaPosition> {
    const position = this.positions.get(id);
    if (!position) {
      throw new Error('Position not found');
    }
    return position;
  }

  async getOpportunities(chain?: string, limit: number = 20): Promise<{ opportunities: DcaOpportunity[] }> {
    const opportunities: DcaOpportunity[] = [];
    const chains = chain ? [chain] : ['Ethereum', 'Arbitrum', 'Optimism', 'Polygon', 'Base', 'Avalanche', 'BSC'];
    
    const tokenPairs = [
      { from: 'ETH', to: 'USDC' },
      { from: 'BTC', to: 'USDC' },
      { from: 'ETH', to: 'USDT' },
      { from: 'SOL', to: 'USDC' },
      { from: 'ARB', to: 'USDC' },
      { from: 'OP', to: 'USDC' },
      { from: 'MATIC', to: 'USDC' },
      { from: 'AVAX', to: 'USDC' },
      { from: 'BNB', to: 'USDC' },
    ];

    for (const c of chains) {
      for (const pair of tokenPairs) {
        if (opportunities.length >= limit) break;
        
        const fromPrice = this.getMockPrice(pair.from);
        const toPrice = this.getMockPrice(pair.to);
        
        opportunities.push({
          fromToken: pair.from,
          toToken: pair.to,
          chain: c,
          fromTokenSymbol: pair.from,
          toTokenSymbol: pair.to,
          currentPrice: fromPrice,
          avgPrice7d: fromPrice * (0.98 + Math.random() * 0.04),
          avgPrice30d: fromPrice * (0.95 + Math.random() * 0.1),
          volatility: Math.random() * 40 + 10,
          trend: Math.random() > 0.5 ? 'bullish' : Math.random() > 0.5 ? 'bearish' : 'neutral',
          apy: Math.random() * 15 + 2,
          risk: Math.random() > 0.6 ? 'low' : Math.random() > 0.3 ? 'medium' : 'high',
          confidence: Math.random() * 30 + 70,
        });
      }
    }

    return { opportunities: opportunities.slice(0, limit) };
  }

  async analyzeOpportunity(fromToken: string, toToken: string, chain: string): Promise<any> {
    const currentPrice = this.getMockPrice(fromToken);
    const avgPrice7d = currentPrice * (0.98 + Math.random() * 0.04);
    const avgPrice30d = currentPrice * (0.95 + Math.random() * 0.1);
    const priceChange = ((currentPrice - avgPrice30d) / avgPrice30d) * 100;
    const volatility = Math.random() * 40 + 10;

    return {
      opportunity: {
        fromToken,
        toToken,
        chain,
        fromTokenSymbol: fromToken,
        toTokenSymbol: toToken,
        currentPrice,
        avgPrice7d,
        avgPrice30d,
        volatility,
        trend: priceChange > 2 ? 'bullish' : priceChange < -2 ? 'bearish' : 'neutral',
        apy: Math.random() * 15 + 2,
        risk: Math.random() > 0.6 ? 'low' : Math.random() > 0.3 ? 'medium' : 'high',
        confidence: Math.random() * 30 + 70,
      },
      historicalPerformance: {
        avgPurchasePrice: avgPrice30d,
        currentPrice,
        priceChange,
        volatility,
      },
      projections: {
        daily: currentPrice * (1 + (Math.random() - 0.5) * 0.02),
        weekly: currentPrice * (1 + (Math.random() - 0.5) * 0.05),
        monthly: currentPrice * (1 + (Math.random() - 0.5) * 0.1),
        yearly: currentPrice * (1 + (Math.random() - 0.5) * 0.3),
      },
    };
  }

  async getStatistics(address: string): Promise<DcaStatistics> {
    const strategies = Array.from(this.strategies.values()).filter(
      s => s.userAddress === address.toLowerCase(),
    );
    const positions = Array.from(this.positions.values()).filter(
      p => p.userAddress === address.toLowerCase(),
    );

    const activeStrategies = strategies.filter(s => s.status === 'active').length;
    const totalInvested = strategies.reduce((sum, s) => sum + (s.amountPerPurchase * s.completedPurchases), 0);
    const totalValue = positions.reduce((sum, p) => sum + (p.totalAmount * p.currentPrice), 0);
    const totalPnL = positions.reduce((sum, p) => sum + p.pnl, 0);
    const totalPnLPercentage = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;

    const chainDistribution: Record<string, number> = {};
    const tokenDistribution: Record<string, number> = {};

    strategies.forEach(s => {
      chainDistribution[s.chain] = (chainDistribution[s.chain] || 0) + 1;
      tokenDistribution[s.toToken] = (tokenDistribution[s.toToken] || 0) + s.amountPerPurchase * s.completedPurchases;
    });

    return {
      totalStrategies: strategies.length,
      activeStrategies,
      totalInvested,
      totalValue,
      totalPnL,
      totalPnLPercentage,
      averageApy: 8.5,
      chainDistribution,
      tokenDistribution,
    };
  }

  getSupportedChains(): string[] {
    return ['Ethereum', 'Polygon', 'Arbitrum', 'Optimism', 'Base', 'Avalanche', 'BSC'];
  }

  getSupportedTokens(chain?: string): Record<string, string[]> {
    const tokens: Record<string, string[]> = {
      Ethereum: ['ETH', 'WBTC', 'USDC', 'USDT', 'DAI', 'LINK', 'UNI', 'AAVE'],
      Polygon: ['MATIC', 'USDC', 'USDT', 'QUICK', 'AAVE'],
      Arbitrum: ['ETH', 'ARB', 'USDC', 'USDT', 'GMX', 'MAGIC'],
      Optimism: ['OP', 'ETH', 'USDC', 'USDT', 'VELO'],
      Base: ['ETH', 'USDC', 'USDT', 'DEGEN'],
      Avalanche: ['AVAX', 'USDC', 'USDT', 'JOE', 'GMX'],
      BSC: ['BNB', 'USDC', 'USDT', 'CAKE', 'BURGER'],
    };

    if (chain) {
      return { [chain]: tokens[chain] || [] };
    }
    return tokens;
  }

  async calculateDca(
    amount: number,
    frequency: string,
    token: string,
    duration: number,
  ): Promise<any> {
    const purchasesPerDay = frequency === 'hourly' ? 24 : frequency === 'daily' ? 1 : frequency === 'weekly' ? 0.14 : frequency === 'biweekly' ? 0.07 : 0.03;
    const totalPurchases = Math.floor(purchasesPerDay * duration);
    const totalInvested = totalPurchases * amount;
    const currentPrice = this.getMockPrice(token);
    const priceVariation = 1 + (Math.random() - 0.5) * 0.1;
    const estimatedTokens = totalInvested / (currentPrice * priceVariation);
    const averagePrice = totalInvested / estimatedTokens;

    return {
      totalInvested,
      estimatedTokens,
      averagePrice,
      projection: {
        daily: amount * 365,
        weekly: amount * 52,
        monthly: amount * 12,
        yearly: amount * 12,
      },
    };
  }

  private calculateNextPurchaseTime(frequency: string, startDate: Date): Date {
    const next = new Date(startDate);
    switch (frequency) {
      case 'hourly':
        next.setHours(next.getHours() + 1);
        break;
      case 'daily':
        next.setDate(next.getDate() + 1);
        break;
      case 'weekly':
        next.setDate(next.getDate() + 7);
        break;
      case 'biweekly':
        next.setDate(next.getDate() + 14);
        break;
      case 'monthly':
        next.setMonth(next.getMonth() + 1);
        break;
    }
    return next;
  }

  private getMockPrice(token: string): number {
    const prices: Record<string, number> = {
      ETH: 3245.67,
      WBTC: 67890.12,
      BTC: 67890.12,
      USDC: 1.0,
      USDT: 1.0,
      DAI: 1.0,
      LINK: 18.45,
      UNI: 12.34,
      AAVE: 245.67,
      MATIC: 0.89,
      QUICK: 45.67,
      ARB: 1.23,
      OP: 2.45,
      GMX: 35.67,
      MAGIC: 1.89,
      VELO: 0.12,
      DEGEN: 0.023,
      AVAX: 38.45,
      JOE: 0.45,
      BNB: 567.89,
      CAKE: 2.34,
      BURGER: 0.56,
      SOL: 145.67,
      RNDR: 8.90,
      INJ: 25.60,
    };
    return prices[token.toUpperCase()] || 100 + Math.random() * 100;
  }
}
