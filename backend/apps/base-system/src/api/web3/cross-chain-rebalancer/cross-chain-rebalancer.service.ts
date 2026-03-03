import { Injectable } from '@nestjs/common';

interface ChainInfo {
  id: string;
  name: string;
  nativeToken: string;
  rpc: string;
}

interface PortfolioPosition {
  chain: string;
  token: string;
  symbol: string;
  balance: number;
  valueUSD: number;
  percentage: number;
}

interface PortfolioAllocation {
  address: string;
  totalValueUSD: number;
  positions: PortfolioPosition[];
  chainDistribution: Record<string, number>;
  tokenDistribution: Record<string, number>;
}

interface RebalanceAnalysis {
  currentAllocation: PortfolioAllocation;
  targetAllocation: {
    chain: string;
    token: string;
    targetPercentage: number;
  }[];
  differences: {
    chain: string;
    token: string;
    currentPercent: number;
    targetPercent: number;
    diff: number;
    action: 'buy' | 'sell' | 'hold';
    amountUSD: number;
  }[];
  estimatedGas: number;
  recommendation: string;
}

interface RebalanceTx {
  chain: string;
  type: 'swap' | 'bridge' | 'transfer';
  fromToken: string;
  toToken: string;
  amount: number;
  estimatedGas: number;
  path?: string[];
}

interface ArbitrageOpportunity {
  sourceChain: string;
  targetChain: string;
  token: string;
  profitUSD: number;
  route: string;
  risk: 'low' | 'medium' | 'high';
}

@Injectable()
export class CrossChainRebalancerService {
  private chains: ChainInfo[] = [
    { id: 'ethereum', name: 'Ethereum', nativeToken: 'ETH', rpc: 'https://eth-mainnet.g.alchemy.com' },
    { id: 'polygon', name: 'Polygon', nativeToken: 'MATIC', rpc: 'https://polygon-rpc.com' },
    { id: 'arbitrum', name: 'Arbitrum', nativeToken: 'ETH', rpc: 'https://arb1.arbitrum.io/rpc' },
    { id: 'optimism', name: 'Optimism', nativeToken: 'ETH', rpc: 'https://mainnet.optimism.io' },
    { id: 'bsc', name: 'BNB Chain', nativeToken: 'BNB', rpc: 'https://bsc-dataseed.binance.org' },
    { id: 'base', name: 'Base', nativeToken: 'ETH', rpc: 'https://mainnet.base.org' },
    { id: 'avalanche', name: 'Avalanche', nativeToken: 'AVAX', rpc: 'https://api.avax.network/ext/bc/C/rpc' },
  ];

  // Mock price data
  private mockPrices: Record<string, number> = {
    ETH: 2450.00,
    MATIC: 0.85,
    BNB: 310.00,
    AVAX: 35.00,
    USDC: 1.00,
    USDT: 1.00,
    DAI: 1.00,
  };

  // Mock portfolio data (in real app, this would query blockchain)
  private mockPortfolios: Map<string, PortfolioPosition[]> = new Map();

  constructor() {
    // Initialize some mock data
    this.initializeMockData();
  }

  private initializeMockData() {
    // Sample portfolio for demo
    const demoPortfolio: PortfolioPosition[] = [
      { chain: 'ethereum', token: 'ETH', symbol: 'ETH', balance: 2.5, valueUSD: 6125, percentage: 45 },
      { chain: 'ethereum', token: 'USDC', symbol: 'USDC', balance: 3000, valueUSD: 3000, percentage: 22 },
      { chain: 'polygon', token: 'MATIC', symbol: 'MATIC', balance: 5000, valueUSD: 4250, percentage: 31 },
      { chain: 'arbitrum', token: 'ETH', symbol: 'ETH', balance: 0.1, valueUSD: 245, percentage: 2 },
    ];
    this.mockPortfolios.set('0x742d35Cc6634C0532925a3b844Bc9e7595f0'.toLowerCase(), demoPortfolio);
  }

  getSupportedChains(): ChainInfo[] {
    return this.chains;
  }

  async getPortfolioAllocation(address: string, chains: string[]): Promise<PortfolioAllocation> {
    const normalizedAddress = address.toLowerCase();
    
    // Get or generate mock portfolio
    let positions = this.mockPortfolios.get(normalizedAddress);
    if (!positions) {
      // Generate random portfolio for demo
      positions = this.generateMockPortfolio(normalizedAddress);
      this.mockPortfolios.set(normalizedAddress, positions);
    }

    const totalValue = positions.reduce((sum, p) => sum + p.valueUSD, 0);
    
    // Calculate chain distribution
    const chainDistribution: Record<string, number> = {};
    positions.forEach(p => {
      chainDistribution[p.chain] = (chainDistribution[p.chain] || 0) + p.valueUSD;
    });
    
    // Convert to percentages
    Object.keys(chainDistribution).forEach(chain => {
      chainDistribution[chain] = (chainDistribution[chain] / totalValue) * 100;
    });

    // Calculate token distribution
    const tokenDistribution: Record<string, number> = {};
    positions.forEach(p => {
      tokenDistribution[p.symbol] = (tokenDistribution[p.symbol] || 0) + p.valueUSD;
    });
    
    Object.keys(tokenDistribution).forEach(token => {
      tokenDistribution[token] = (tokenDistribution[token] / totalValue) * 100;
    });

    return {
      address: normalizedAddress,
      totalValueUSD: totalValue,
      positions,
      chainDistribution,
      tokenDistribution,
    };
  }

  private generateMockPortfolio(address: string): PortfolioPosition[] {
    const chains = ['ethereum', 'polygon', 'arbitrum', 'optimism', 'bsc', 'base', 'avalanche'];
    const tokens = ['ETH', 'USDC', 'USDT', 'MATIC', 'BNB', 'AVAX', 'DAI'];
    
    const positions: PortfolioPosition[] = [];
    let totalValue = 0;
    
    // Generate 3-5 random positions
    const numPositions = 3 + Math.floor(Math.random() * 3);
    
    for (let i = 0; i < numPositions; i++) {
      const chain = chains[Math.floor(Math.random() * chains.length)];
      const token = tokens[Math.floor(Math.random() * tokens.length)];
      const balance = Math.random() * 10;
      const valueUSD = balance * (this.mockPrices[token] || 100);
      
      positions.push({
        chain,
        token,
        symbol: token,
        balance,
        valueUSD,
        percentage: 0, // Will be calculated later
      });
      
      totalValue += valueUSD;
    }

    // Calculate percentages
    positions.forEach(p => {
      p.percentage = (p.valueUSD / totalValue) * 100;
    });

    return positions;
  }

  async analyzeRebalance(
    address: string,
    targetAllocations: { chain: string; token: string; targetPercentage: number }[],
    threshold: number = 5,
  ): Promise<RebalanceAnalysis> {
    const chains = this.chains.map(c => c.id);
    const currentAllocation = await this.getPortfolioAllocation(address, chains);
    
    const differences: RebalanceAnalysis['differences'] = [];
    
    // Calculate differences for each target
    targetAllocations.forEach(target => {
      const currentPosition = currentAllocation.positions.find(
        p => p.chain === target.chain && p.token.toLowerCase() === target.token.toLowerCase(),
      );
      
      const currentPercent = currentPosition?.percentage || 0;
      const diff = target.targetPercentage - currentPercent;
      
      if (Math.abs(diff) >= threshold) {
        const amountUSD = (diff / 100) * currentAllocation.totalValueUSD;
        
        differences.push({
          chain: target.chain,
          token: target.token,
          currentPercent,
          targetPercent: target.targetPercentage,
          diff,
          action: diff > 0 ? 'buy' : 'sell',
          amountUSD,
        });
      }
    });

    const totalDiff = differences.reduce((sum, d) => sum + Math.abs(d.diff), 0);
    const estimatedGas = totalDiff * 0.5; // Rough estimate

    let recommendation = '';
    if (differences.length === 0) {
      recommendation = 'Portfolio is balanced within threshold. No action needed.';
    } else if (differences.length <= 2) {
      recommendation = `Consider rebalancing ${differences.length} positions to meet targets.`;
    } else {
      recommendation = 'Portfolio significantly deviates from targets. Consider gradual rebalancing to minimize gas costs.';
    }

    return {
      currentAllocation,
      targetAllocation: targetAllocations,
      differences,
      estimatedGas,
      recommendation,
    };
  }

  async generateRebalanceTransactions(
    address: string,
    targetAllocations: { chain: string; token: string; targetPercentage: number }[],
  ): Promise<RebalanceTx[]> {
    const analysis = await this.analyzeRebalance(address, targetAllocations, 0);
    const transactions: RebalanceTx[] = [];
    
    // Generate transactions for each difference
    for (const diff of analysis.differences) {
      if (diff.action === 'buy') {
        // Find source of funds (from another chain or token)
        const sourcePosition = analysis.currentAllocation.positions.find(
          p => p.chain !== diff.chain && p.valueUSD > diff.amountUSD * 1.2,
        );
        
        if (sourcePosition) {
          transactions.push({
            chain: sourcePosition.chain,
            type: 'bridge',
            fromToken: sourcePosition.symbol,
            toToken: diff.token,
            amount: diff.amountUSD / (this.mockPrices[sourcePosition.symbol] || 1),
            estimatedGas: 15 + Math.random() * 20,
            path: [sourcePosition.chain, diff.chain],
          });
        }
      } else if (diff.action === 'sell') {
        transactions.push({
          chain: diff.chain,
          type: 'swap',
          fromToken: diff.token,
          toToken: 'USDC',
          amount: diff.amountUSD / (this.mockPrices[diff.token] || 1),
          estimatedGas: 10 + Math.random() * 15,
        });
      }
    }

    return transactions;
  }

  async findArbitrageOpportunities(minProfit: number = 1): Promise<ArbitrageOpportunity[]> {
    const opportunities: ArbitrageOpportunity[] = [];
    
    // Check price differences across chains
    const tokenPrices: Record<string, Record<string, number>> = {
      ETH: { ethereum: 2450, arbitrum: 2448, optimism: 2447, polygon: 2445, base: 2449, bsc: 2443, avalanche: 2440 },
      USDC: { ethereum: 1.001, arbitrum: 1.0, optimism: 0.999, polygon: 1.002, base: 1.0, bsc: 1.001, avalanche: 1.0 },
      MATIC: { ethereum: 0.86, polygon: 0.85, arbitrum: 0.84, optimism: 0.85 },
    };

    // Find arbitrage opportunities
    for (const [token, prices] of Object.entries(tokenPrices)) {
      const chains = Object.keys(prices);
      
      for (let i = 0; i < chains.length; i++) {
        for (let j = i + 1; j < chains.length; j++) {
          const priceDiff = Math.abs(prices[chains[i]] - prices[chains[j]]);
          const profit = priceDiff * 1000; // Assume trading 1000 units
          
          if (profit >= minProfit) {
            const sourceChain = prices[chains[i]] > prices[chains[j]] ? chains[i] : chains[j];
            const targetChain = prices[chains[i]] > prices[chains[j]] ? chains[j] : chains[i];
            
            opportunities.push({
              sourceChain,
              targetChain,
              token,
              profitUSD: profit,
              route: `${sourceChain} → ${targetChain}`,
              risk: profit > 50 ? 'high' : profit > 20 ? 'medium' : 'low',
            });
          }
        }
      }
    }

    // Sort by profit
    return opportunities.sort((a, b) => b.profitUSD - a.profitUSD).slice(0, 10);
  }

  private rebalanceHistory: Map<string, { date: string; changes: number; gas: number }[]> = new Map();

  async getRebalanceHistory(address: string, limit: number = 10): Promise<{ date: string; changes: number; gas: number }[]> {
    const normalizedAddress = address.toLowerCase();
    let history = this.rebalanceHistory.get(normalizedAddress);
    
    if (!history) {
      // Generate mock history
      history = [];
      const now = new Date();
      for (let i = 0; i < limit; i++) {
        const date = new Date(now);
        date.setDate(date.getDate() - i * 3);
        history.push({
          date: date.toISOString(),
          changes: Math.floor(Math.random() * 5) + 1,
          gas: Math.random() * 50 + 10,
        });
      }
      this.rebalanceHistory.set(normalizedAddress, history);
    }

    return history.slice(0, limit);
  }
}
