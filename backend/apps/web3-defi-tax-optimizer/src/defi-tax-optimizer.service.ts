import { Injectable } from '@nestjs/common';

export interface DefiTransaction {
  hash: string;
  timestamp: number;
  chain: string;
  protocol: string;
  type: 'swap' | 'stake' | 'unstake' | 'add_liquidity' | 'remove_liquidity' | 'borrow' | 'repay' | 'claim' | 'mint' | 'burn';
  tokenIn?: string;
  tokenOut?: string;
  amountIn?: number;
  amountOut?: number;
  valueUSD: number;
  feeUSD: number;
  gasUSD: number;
  pnl?: number;
}

export interface TaxOptimizationOpportunity {
  id: string;
  type: 'harvest_loss' | 'defer_gain' | 'rebalance' | 'wash_sale_risk' | 'cost_basis_adjustment';
  description: string;
  potentialSavings: number;
  risk: 'low' | 'medium' | 'high';
  action: string;
  transaction?: DefiTransaction;
  deadline?: string;
  confidence: number;
}

export interface DefiTaxPosition {
  address: string;
  totalValueLocked: number;
  totalUnrealizedGains: number;
  totalUnrealizedLosses: number;
  netUnrealized: number;
  realizedGainsYTD: number;
  realizedLossesYTD: number;
  netRealizedYTD: number;
  pendingTaxableEvents: number;
  taxLots: TaxLot[];
  transactions: DefiTransaction[];
  optimizationOpportunities: TaxOptimizationOpportunity[];
  chainBreakdown: { chain: string; value: number; gains: number; losses: number }[];
  protocolBreakdown: { protocol: string; value: number; pnl: number }[];
  riskAssessment: {
    washSaleRisk: boolean;
    shortTermConcentration: number;
    taxLossHarvestingPotential: number;
    complexity: 'low' | 'medium' | 'high';
  };
}

export interface TaxLot {
  token: string;
  chain: string;
  amount: number;
  costBasis: number;
  currentValue: number;
  unrealizedGain: number;
  holdingPeriod: 'short' | 'long';
  acquisitionDate: string;
  taxLots: { amount: number; costBasis: number; date: string }[];
}

export interface TaxLiability {
  address: string;
  taxYear: number;
  shortTermGains: number;
  longTermGains: number;
  shortTermLosses: number;
  longTermLosses: number;
  netGainLoss: number;
  estimatedTax: number;
  effectiveTaxRate: number;
  breakdown: { category: string; amount: number; tax: number }[];
}

export interface DashboardStats {
  totalAddressesAnalyzed: number;
  totalValueTracked: number;
  totalTaxSavingsIdentified: number;
  totalHarvestingOpportunities: number;
  averageTaxRate: number;
  topOpportunities: TaxOptimizationOpportunity[];
  chainDistribution: { chain: string; count: number }[];
  riskDistribution: { low: number; medium: number; high: number };
}

@Injectable()
export class DefiTaxOptimizerService {
  private readonly SUPPORTED_CHAINS = [
    'ethereum', 'polygon', 'arbitrum', 'optimism', 'bsc', 'base', 'avalanche', 'solana'
  ];

  private readonly DEFIPROTOCOLS = [
    'Uniswap', 'Aave', 'Compound', 'Curve', 'SushiSwap', 'Lido', 'Yearn', 
    'GMX', 'Balancer', 'Morpho', 'Rocket Pool', 'Aerodrome', 'Velodrome',
    'PancakeSwap', 'QuickSwap', 'Trader Joe', 'DODO', 'Kyber'
  ];

  private readonly MOCK_ADDRESSES = new Map<string, DefiTaxPosition>();

  constructor() {
    this.initializeMockData();
  }

  private initializeMockData() {
    const sampleAddresses = [
      '0x742d35Cc6634C0532925a3b844Bc9e7595f0fE5b',
      '0x1234567890abcdef1234567890abcdef12345678',
      '0xAb5801a7D398351b8bE11C439e05C5B3259aEC9B'
    ];

    sampleAddresses.forEach(addr => {
      this.MOCK_ADDRESSES.set(addr, this.generateMockPosition(addr));
    });
  }

  private generateMockPosition(address: string): DefiTaxPosition {
    const chains = this.SUPPORTED_CHAINS.slice(0, 5);
    const protocols = this.DEFIPROTOCOLS.slice(0, 8);

    const chainBreakdown = chains.map(chain => ({
      chain,
      value: Math.random() * 50000 + 5000,
      gains: Math.random() * 10000,
      losses: Math.random() * 3000
    }));

    const protocolBreakdown = protocols.map(protocol => ({
      protocol,
      value: Math.random() * 30000 + 2000,
      pnl: Math.random() * 5000 - 1000
    }));

    const totalValue = chainBreakdown.reduce((sum, c) => sum + c.value, 0);
    const totalGains = chainBreakdown.reduce((sum, c) => sum + c.gains, 0);
    const totalLosses = chainBreakdown.reduce((sum, c) => sum + c.losses, 0);

    return {
      address,
      totalValueLocked: totalValue,
      totalUnrealizedGains: totalGains,
      totalUnrealizedLosses: totalLosses,
      netUnrealized: totalGains - totalLosses,
      realizedGainsYTD: Math.random() * 20000 + 5000,
      realizedLossesYTD: Math.random() * 8000 + 1000,
      netRealizedYTD: 0,
      pendingTaxableEvents: Math.floor(Math.random() * 10) + 1,
      taxLots: this.generateMockTaxLots(),
      transactions: this.generateMockTransactions(),
      optimizationOpportunities: this.generateOptimizationOpportunities(),
      chainBreakdown,
      protocolBreakdown,
      riskAssessment: {
        washSaleRisk: Math.random() > 0.7,
        shortTermConcentration: Math.random() * 100,
        taxLossHarvestingPotential: Math.random() * 100,
        complexity: Math.random() > 0.6 ? 'high' : Math.random() > 0.3 ? 'medium' : 'low'
      }
    };
  }

  private generateMockTaxLots(): TaxLot[] {
    const tokens = ['ETH', 'WBTC', 'USDC', 'UNI', 'AAVE', 'CRV', 'LDO', 'MKR'];
    return tokens.slice(0, 5).map(token => ({
      token,
      chain: this.SUPPORTED_CHAINS[Math.floor(Math.random() * 4)],
      amount: Math.random() * 10 + 0.5,
      costBasis: Math.random() * 20000 + 1000,
      currentValue: Math.random() * 25000 + 1500,
      unrealizedGain: Math.random() * 5000 - 1000,
      holdingPeriod: Math.random() > 0.5 ? 'long' : 'short',
      acquisitionDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
      taxLots: [
        {
          amount: Math.random() * 5 + 0.5,
          costBasis: Math.random() * 15000 + 1000,
          date: new Date(Date.now() - Math.random() * 400 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]
    }));
  }

  private generateMockTransactions(): DefiTransaction[] {
    const types: DefiTransaction['type'][] = ['swap', 'stake', 'add_liquidity', 'claim', 'borrow'];
    const transactions: DefiTransaction[] = [];

    for (let i = 0; i < 20; i++) {
      transactions.push({
        hash: `0x${Math.random().toString(16).substr(2, 64)}`,
        timestamp: Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000,
        chain: this.SUPPORTED_CHAINS[Math.floor(Math.random() * 4)],
        protocol: this.DEFIPROTOCOLS[Math.floor(Math.random() * 8)],
        type: types[Math.floor(Math.random() * types.length)],
        tokenIn: ['ETH', 'USDC', 'WBTC', 'UNI'][Math.floor(Math.random() * 4)],
        tokenOut: ['ETH', 'USDC', 'WBTC', 'UNI'][Math.floor(Math.random() * 4)],
        amountIn: Math.random() * 5 + 0.1,
        amountOut: Math.random() * 10000 + 100,
        valueUSD: Math.random() * 20000 + 500,
        feeUSD: Math.random() * 100 + 10,
        gasUSD: Math.random() * 50 + 5,
        pnl: Math.random() * 2000 - 500
      });
    }

    return transactions.sort((a, b) => b.timestamp - a.timestamp);
  }

  private generateOptimizationOpportunities(): TaxOptimizationOpportunity[] {
    const opportunities: TaxOptimizationOpportunity[] = [
      {
        id: '1',
        type: 'harvest_loss',
        description: 'Unrealized loss in ETH liquidity position',
        potentialSavings: Math.random() * 2000 + 500,
        risk: 'low',
        action: 'Consider harvesting this loss before year-end to offset realized gains',
        deadline: '2026-12-31',
        confidence: 0.85
      },
      {
        id: '2',
        type: 'defer_gain',
        description: 'Large unrealized gain in staked ETH',
        potentialSavings: Math.random() * 1500 + 300,
        risk: 'low',
        action: 'Consider holding position until long-term capital gains treatment applies',
        deadline: '2026-08-15',
        confidence: 0.9
      },
      {
        id: '3',
        type: 'rebalance',
        description: 'Portfolio concentration in short-term gains',
        potentialSavings: Math.random() * 1000 + 200,
        risk: 'medium',
        action: 'Rebalance to include more long-term positions to reduce tax burden',
        confidence: 0.75
      },
      {
        id: '4',
        type: 'wash_sale_risk',
        description: 'Recent loss harvest may trigger wash sale rules',
        potentialSavings: 0,
        risk: 'high',
        action: 'Wait 30+ days before repurchasing same or substantially identical assets',
        confidence: 0.95
      },
      {
        id: '5',
        type: 'cost_basis_adjustment',
        description: 'Multiple small tax lots can be consolidated',
        potentialSavings: Math.random() * 800 + 100,
        risk: 'low',
        action: 'Consider specific identification method for tax lots to optimize gains/losses',
        confidence: 0.8
      }
    ];

    return opportunities;
  }

  async analyzeDefiTaxPosition(address: string, chains?: string, taxYear?: number): Promise<DefiTaxPosition> {
    const normalizedAddress = address.toLowerCase();
    const requestedChains = chains ? chains.split(',') : this.SUPPORTED_CHAINS;

    // Check if we have cached data
    if (this.MOCK_ADDRESSES.has(normalizedAddress)) {
      const position = this.MOCK_ADDRESSES.get(normalizedAddress)!;
      position.netRealizedYTD = position.realizedGainsYTD - position.realizedLossesYTD;
      return position;
    }

    // Generate new mock data for unknown addresses
    const newPosition = this.generateMockPosition(normalizedAddress);
    this.MOCK_ADDRESSES.set(normalizedAddress, newPosition);
    return newPosition;
  }

  async getTaxOptimization Opportunities(address: string, chains?: string): Promise<{
    address: string;
    opportunities: TaxOptimizationOpportunity[];
    totalPotentialSavings: number;
    recommendedActions: string[];
  }> {
    const position = await this.analyzeDefiTaxPosition(address, chains);
    
    const totalPotentialSavings = position.optimizationOpportunities
      .filter(o => o.type !== 'wash_sale_risk')
      .reduce((sum, o) => sum + o.potentialSavings, 0);

    const recommendedActions = position.optimizationOpportunities
      .filter(o => o.risk === 'low' && o.potentialSavings > 0)
      .map(o => o.action);

    return {
      address,
      opportunities: position.optimizationOpportunities,
      totalPotentialSavings,
      recommendedActions
    };
  }

  async findTaxLossHarvestingOpportunities(addresses: string[], chains?: string[]): Promise<{
    opportunities: { address: string; token: string; loss: number; savings: number; action: string }[];
    totalPotentialSavings: number;
  }> {
    const opportunities: { address: string; token: string; loss: number; savings: number; action: string }[] = [];
    const defaultTaxRate = 0.35; // Combined short-term tax rate

    for (const address of addresses) {
      const position = await this.analyzeDefiTaxPosition(address, chains);
      
      for (const taxLot of position.taxLots) {
        if (taxLot.unrealizedGain < 0) {
          const loss = Math.abs(taxLot.unrealizedGain);
          const savings = loss * defaultTaxRate;
          
          opportunities.push({
            address,
            token: taxLot.token,
            loss,
            savings,
            action: `Harvest ${loss.toFixed(2)} ${taxLot.token} loss on ${taxLot.chain}`
          });
        }
      }
    }

    return {
      opportunities: opportunities.sort((a, b) => b.savings - a.savings),
      totalPotentialSavings: opportunities.reduce((sum, o) => sum + o.savings, 0)
    };
  }

  async getDefiTransactions(
    address: string,
    chains?: string,
    startDate?: string,
    endDate?: string
  ): Promise<DefiTransaction[]> {
    const position = await this.analyzeDefiTaxPosition(address, chains);
    let transactions = position.transactions;

    if (startDate) {
      const start = new Date(startDate).getTime();
      transactions = transactions.filter(t => t.timestamp >= start);
    }

    if (endDate) {
      const end = new Date(endDate).getTime();
      transactions = transactions.filter(t => t.timestamp <= end);
    }

    return transactions;
  }

  async calculateTaxLiability(
    address: string,
    taxRate?: number,
    taxYear?: number
  ): Promise<TaxLiability> {
    const position = await this.analyzeDefiTaxPosition(address);
    const rate = taxRate || 0.35;
    const year = taxYear || new Date().getFullYear();

    const shortTermGains = position.realizedGainsYTD * 0.6;
    const longTermGains = position.realizedGainsYTD * 0.4;
    const shortTermLosses = position.realizedLossesYTD * 0.7;
    const longTermLosses = position.realizedLossesYTD * 0.3;

    const netGainLoss = (shortTermGains + longTermGains) - (shortTermLosses + longTermLosses);
    
    const shortTermTax = Math.max(0, shortTermGains - shortTermLosses) * rate;
    const longTermTax = Math.max(0, longTermGains - longTermLosses) * 0.2;
    const estimatedTax = shortTermTax + longTermTax;

    return {
      address,
      taxYear: year,
      shortTermGains,
      longTermGains,
      shortTermLosses,
      longTermLosses,
      netGainLoss,
      estimatedTax,
      effectiveTaxRate: netGainLoss > 0 ? (estimatedTax / netGainLoss) * 100 : 0,
      breakdown: [
        { category: 'Short-term Gains', amount: shortTermGains, tax: shortTermTax },
        { category: 'Long-term Gains', amount: longTermGains, tax: longTermTax },
        { category: 'Short-term Losses', amount: -shortTermLosses, tax: 0 },
        { category: 'Long-term Losses', amount: -longTermLosses, tax: 0 }
      ]
    };
  }

  async getDashboardStats(): Promise<DashboardStats> {
    const allPositions = Array.from(this.MOCK_ADDRESSES.values());
    
    const topOpportunities = allPositions
      .flatMap(p => p.optimizationOpportunities)
      .filter(o => o.type !== 'wash_sale_risk' && o.potentialSavings > 0)
      .sort((a, b) => b.potentialSavings - a.potentialSavings)
      .slice(0, 10);

    const chainCount = new Map<string, number>();
    allPositions.forEach(p => {
      p.chainBreakdown.forEach(c => {
        chainCount.set(c.chain, (chainCount.get(c.chain) || 0) + 1);
      });
    });

    const riskDistribution = { low: 0, medium: 0, high: 0 };
    allPositions.forEach(p => {
      if (p.riskAssessment.complexity === 'low') riskDistribution.low++;
      else if (p.riskAssessment.complexity === 'medium') riskDistribution.medium++;
      else riskDistribution.high++;
    });

    return {
      totalAddressesAnalyzed: this.MOCK_ADDRESSES.size,
      totalValueTracked: allPositions.reduce((sum, p) => sum + p.totalValueLocked, 0),
      totalTaxSavingsIdentified: topOpportunities.reduce((sum, o) => sum + o.potentialSavings, 0),
      totalHarvestingOpportunities: allPositions.reduce((sum, p) => 
        sum + p.taxLots.filter(t => t.unrealizedGain < 0).length, 0),
      averageTaxRate: 32.5,
      topOpportunities,
      chainDistribution: Array.from(chainCount.entries()).map(([chain, count]) => ({ chain, count })),
      riskDistribution
    };
  }
}
