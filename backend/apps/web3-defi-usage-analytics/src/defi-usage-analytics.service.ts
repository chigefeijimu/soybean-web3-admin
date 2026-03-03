import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class DefiUsageAnalyticsService {
  private readonly logger = new Logger(DefiUsageAnalyticsService.name);

  // Chain RPC mappings
  private readonly CHAIN_RPC: Record<string, string> = {
    '1': 'https://eth.llamarpc.com',
    '137': 'https://polygon-rpc.com',
    '42161': 'https://arb1.arbitrum.io/rpc',
    '10': 'https://mainnet.optimism.io',
    '56': 'https://bsc-dataseed.binance.org',
    '8453': 'https://mainnet.base.org',
    '43114': 'https://api.avax.network/ext/bc/C/rpc',
  };

  private readonly CHAIN_EXPLORER: Record<string, string> = {
    '1': 'https://api.etherscan.io/api',
    '137': 'https://api.polygonscan.com/api',
    '42161': 'https://api.arbiscan.io/api',
    '10': 'https://api-optimistic.etherscan.io/api',
    '56': 'https://api.bscscan.com/api',
    '8453': 'https://api.basescan.org/api',
    '43114': 'api.snowtrace.io/api',
  };

  private readonly CHAIN_NAME: Record<string, string> = {
    '1': 'Ethereum',
    '137': 'Polygon',
    '42161': 'Arbitrum',
    '10': 'Optimism',
    '56': 'BSC',
    '8453': 'Base',
    '43114': 'Avalanche',
  };

  // Known DeFi protocols by chain
  private readonly DEFI_PROTOCOLS: Record<string, Record<string, string>> = {
    '1': {
      '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D': 'Uniswap V2',
      '0xE592427A0AEce92De3Edee1F18E0157C05861564': 'Uniswap V3',
      '0x875773784Af8135eA0ef43b5a374AaD105e5d188': 'SushiSwap',
      '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48': 'USDC',
      '0xdAC17F958D2ee523a2206206994597C13D831ec7': 'USDT',
      '0x6B175474E89094C44Da98b954EedeAC495271d0F': 'DAI',
      '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9': 'AAVE',
      '0x514910771AF9Ca656af840dff83E8264EcF986CA': 'LINK',
      '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984': 'Uniswap',
      '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599': 'WBTC',
      '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2': 'WETH',
      '0x5f98805A4eA8d46EA536E2B3F77B2d72c9C8B56E': 'Lido',
      '0xBE0eB53F46CD790Cd13851d5EFf43D12404d33E8': 'Curve',
      '0xd533a949740bb3306d119CC777fa900bA034cd52': 'CRV',
    },
    '137': {
      '0xa5C2fB894d6Ab82d8eD29CdC6e4afA6E76aA998': 'QuickSwap',
      '0x53E0bca35eC356BD5ddDFEbdD1Fc0fD03FaBad39': 'Polygon',
      '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063': 'Polygon',
    },
    '42161': {
      '0x1f98431c8aD98523631AE26859A8DB8443b6322C': 'Uniswap',
      '0x912CE59144191C1204E64559FE8253a0e49E6548': 'ARB',
    },
  };

  // Known DeFi protocol keywords
  private readonly PROTOCOL_KEYWORDS: Record<string, string[]> = {
    'Uniswap': ['uniswap', 'swap'],
    'SushiSwap': ['sushi', 'swap'],
    'Aave': ['aave', 'lend', 'borrow', 'supply'],
    'Compound': ['compound', 'lend', 'borrow'],
    'Curve': ['curve', 'swap'],
    'Yearn': ['yearn', 'vault', 'yield'],
    'Lido': ['lido', 'stETH', 'stake'],
    'MakerDAO': ['maker', 'dai', 'cdp'],
    'Balancer': ['balancer', 'bpt'],
    'GMX': ['gmx', 'glp'],
    'QuickSwap': ['quickswap', 'swap'],
    'PancakeSwap': ['pancakeswap', 'swap'],
  };

  async analyzeProtocolUsage(address: string, chainIds: string[] = ['1', '137', '42161', '10', '56', '8453', '43114']) {
    try {
      const allTransactions: any[] = [];
      
      // Fetch transactions from all chains
      for (const chainId of chainIds) {
        try {
          const txs = await this.getTransactions(address, chainId);
          if (txs && txs.length > 0) {
            allTransactions.push(...txs.map(tx => ({ ...tx, chainId })));
          }
        } catch (error) {
          this.logger.warn(`Failed to fetch transactions for chain ${chainId}: ${error.message}`);
        }
      }

      if (allTransactions.length === 0) {
        return this.getEmptyUsageAnalysis(address);
      }

      return this.analyzeUsagePatterns(address, allTransactions);
    } catch (error) {
      this.logger.error(`Error analyzing protocol usage: ${error.message}`);
      return { error: error.message };
    }
  }

  private async getTransactions(address: string, chainId: string): Promise<any[]> {
    const explorerApi = this.CHAIN_EXPLORER[chainId];
    if (!explorerApi) return [];

    try {
      // Use public API with rate limiting
      const url = `${explorerApi}?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=1000&sort=desc`;
      const response = await axios.get(url, { timeout: 10000 });
      
      if (response.data.status === '1' && response.data.result) {
        return response.data.result.slice(0, 200); // Limit to recent 200 transactions
      }
      return [];
    } catch (error) {
      return [];
    }
  }

  private analyzeUsagePatterns(address: string, transactions: any[]) {
    // Protocol detection and classification
    const protocolUsage: Record<string, any> = {};
    const chainUsage: Record<string, any> = {};
    const timeDistribution: Record<number, number> = {};
    const dayDistribution: Record<number, number> = {};
    const monthlyTrends: Record<string, number> = {};
    
    let totalGasSpent = 0;
    let totalVolume = 0;

    for (const tx of transactions) {
      const chainId = tx.chainId;
      const chainName = this.CHAIN_NAME[chainId] || `Chain ${chainId}`;
      const gasUsed = parseInt(tx.gasUsed || '0');
      const gasPrice = parseInt(tx.gasPrice || '0');
      const value = parseFloat(tx.value || '0');
      const timestamp = parseInt(tx.timeStamp) * 1000;
      const date = new Date(timestamp);
      
      // Track chain usage
      if (!chainUsage[chainId]) {
        chainUsage[chainId] = {
          chainName,
          txCount: 0,
          gasSpent: 0,
          volume: 0,
        };
      }
      chainUsage[chainId].txCount++;
      chainUsage[chainId].gasSpent += (gasUsed * gasPrice) / 1e18;
      chainUsage[chainId].volume += value / 1e18;
      
      totalGasSpent += (gasUsed * gasPrice) / 1e18;
      totalVolume += value / 1e18;

      // Time distribution (hour of day)
      const hour = date.getHours();
      timeDistribution[hour] = (timeDistribution[hour] || 0) + 1;

      // Day distribution (day of week)
      const day = date.getDay();
      dayDistribution[day] = (dayDistribution[day] || 0) + 1;

      // Monthly trends
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyTrends[monthKey] = (monthlyTrends[monthKey] || 0) + 1;

      // Protocol detection based on contract interactions
      const to = tx.to?.toLowerCase() || '';
      const input = tx.input || '';
      
      for (const [protocolName, keywords] of Object.entries(this.PROTOCOL_KEYWORDS)) {
        const isProtocol = keywords.some(kw => 
          input.includes(kw) || to.includes(kw.substring(0, 8).toLowerCase())
        );
        
        if (isProtocol) {
          if (!protocolUsage[protocolName]) {
            protocolUsage[protocolName] = {
              name: protocolName,
              txCount: 0,
              gasSpent: 0,
              volume: 0,
              firstUse: timestamp,
              lastUse: 0,
            };
          }
          protocolUsage[protocolName].txCount++;
          protocolUsage[protocolName].gasSpent += (gasUsed * gasPrice) / 1e18;
          protocolUsage[protocolName].volume += value / 1e18;
          protocolUsage[protocolName].lastUse = Math.max(protocolUsage[protocolName].lastUse, timestamp);
        }
      }
    }

    // Calculate statistics
    const totalTransactions = transactions.length;
    const uniqueDays = new Set(transactions.map(tx => {
      const d = new Date(parseInt(tx.timeStamp) * 1000);
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    })).size;

    const avgTransactionsPerDay = uniqueDays > 0 ? totalTransactions / uniqueDays : 0;
    
    // Most active time
    const mostActiveHour = Object.entries(timeDistribution)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || '0';
    
    const mostActiveDay = Object.entries(dayDistribution)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || '0';

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    // Top protocols
    const topProtocols = Object.values(protocolUsage)
      .sort((a: any, b: any) => b.txCount - a.txCount)
      .slice(0, 10);

    // Top chains
    const topChains = Object.values(chainUsage)
      .sort((a: any, b: any) => b.txCount - a.txCount);

    // Calculate engagement score
    const engagementScore = this.calculateEngagementScore(totalTransactions, uniqueDays, topProtocols.length);

    // Generate recommendations
    const recommendations = this.generateRecommendations(protocolUsage, chainUsage, totalGasSpent);

    return {
      address,
      summary: {
        totalTransactions,
        totalGasSpent: totalGasSpent.toFixed(4),
        totalVolume: totalVolume.toFixed(4),
        uniqueDays,
        avgTransactionsPerDay: avgTransactionsPerDay.toFixed(2),
        uniqueProtocols: Object.keys(protocolUsage).length,
        engagementScore,
      },
      protocolUsage: topProtocols,
      chainUsage: topChains,
      timeDistribution: {
        byHour: timeDistribution,
        byDay: dayDistribution,
        mostActiveHour: parseInt(mostActiveHour),
        mostActiveDay: dayNames[parseInt(mostActiveDay)],
      },
      monthlyTrends,
      recommendations,
      insights: this.generateInsights(protocolUsage, chainUsage, totalTransactions, totalGasSpent),
    };
  }

  private calculateEngagementScore(totalTx: number, uniqueDays: number, protocolCount: number): number {
    let score = 0;
    
    // Transaction count factor (0-30)
    score += Math.min(30, totalTx / 10);
    
    // Consistency factor (0-30)
    const consistency = uniqueDays > 0 ? totalTx / uniqueDays : 0;
    score += Math.min(30, consistency);
    
    // Diversity factor (0-40)
    score += Math.min(40, protocolCount * 8);
    
    return Math.round(score);
  }

  private generateRecommendations(protocolUsage: Record<string, any>, chainUsage: Record<string, any>, totalGas: number): string[] {
    const recommendations: string[] = [];

    // Check for single chain dependency
    const chains = Object.values(chainUsage);
    if (chains.length === 1) {
      recommendations.push('Consider diversifying across multiple chains to reduce risk and find better yields.');
    }

    // Check for high gas spending
    if (totalGas > 5) {
      recommendations.push('Your gas spending is high. Consider using layer 2 networks for cost-effective transactions.');
    }

    // Check for protocol diversity
    if (Object.keys(protocolUsage).length < 3) {
      recommendations.push('Try exploring more DeFi protocols to find better yield opportunities.');
    }

    // Check for lending usage
    const hasLending = Object.keys(protocolUsage).some(p => 
      p.toLowerCase().includes('aave') || p.toLowerCase().includes('compound')
    );
    if (!hasLending && Object.keys(protocolUsage).length > 0) {
      recommendations.push('Consider adding lending protocols to your strategy for passive income.');
    }

    // Check for staking
    const hasStaking = Object.keys(protocolUsage).some(p => 
      p.toLowerCase().includes('lido') || p.toLowerCase().includes('rocket')
    );
    if (!hasStaking) {
      recommendations.push('Consider ETH staking to earn yield on your idle assets.');
    }

    if (recommendations.length === 0) {
      recommendations.push('Great diversification! Keep monitoring your portfolio performance.');
    }

    return recommendations;
  }

  private generateInsights(protocolUsage: Record<string, any>, chainUsage: Record<string, any>, totalTx: number, totalGas: number): any[] {
    const insights: any[] = [];

    // Most used protocol
    const topProtocol = Object.values(protocolUsage).sort((a: any, b: any) => b.txCount - a.txCount)[0];
    if (topProtocol) {
      insights.push({
        type: 'protocol',
        title: 'Most Used Protocol',
        description: `You interact most with ${topProtocol.name} (${topProtocol.txCount} transactions)`,
        icon: '📊',
      });
    }

    // Primary chain
    const topChain = Object.values(chainUsage).sort((a: any, b: any) => b.txCount - a.txCount)[0];
    if (topChain) {
      insights.push({
        type: 'chain',
        title: 'Primary Chain',
        description: `Most of your activity is on ${topChain.chainName}`,
        icon: '⛓️',
      });
    }

    // Activity level
    if (totalTx > 100) {
      insights.push({
        type: 'activity',
        title: 'Power User',
        description: 'You are a highly active DeFi user with significant transaction history',
        icon: '🔥',
      });
    } else if (totalTx > 20) {
      insights.push({
        type: 'activity',
        title: 'Regular User',
        description: 'You maintain consistent DeFi activity',
        icon: '👍',
      });
    }

    return insights;
  }

  private getEmptyUsageAnalysis(address: string) {
    return {
      address,
      summary: {
        totalTransactions: 0,
        totalGasSpent: '0',
        totalVolume: '0',
        uniqueDays: 0,
        avgTransactionsPerDay: '0',
        uniqueProtocols: 0,
        engagementScore: 0,
      },
      protocolUsage: [],
      chainUsage: [],
      timeDistribution: {
        byHour: {},
        byDay: {},
        mostActiveHour: 0,
        mostActiveDay: 'N/A',
      },
      monthlyTrends: {},
      recommendations: [
        'Start exploring DeFi protocols to track your usage patterns.',
        'Connect your wallet to begin analyzing your DeFi activity.',
      ],
      insights: [],
    };
  }

  // Compare two addresses
  async compareUsage(address1: string, address2: string, chainIds: string[] = ['1', '137', '42161', '10', '56', '8453', '43114']) {
    const analysis1 = await this.analyzeProtocolUsage(address1, chainIds);
    const analysis2 = await this.analyzeProtocolUsage(address2, chainIds);

    if ('error' in analysis1 || 'error' in analysis2) {
      return { error: 'Failed to analyze one or both addresses' };
    }

    const data1 = analysis1 as any;
    const data2 = analysis2 as any;

    return {
      address1,
      address2,
      comparison: {
        totalTransactions: {
          [address1]: data1.summary.totalTransactions,
          [address2]: data2.summary.totalTransactions,
          winner: data1.summary.totalTransactions > data2.summary.totalTransactions ? address1 : address2,
        },
        totalGasSpent: {
          [address1]: data1.summary.totalGasSpent,
          [address2]: data2.summary.totalGasSpent,
          winner: parseFloat(data1.summary.totalGasSpent) > parseFloat(data2.summary.totalGasSpent) ? address1 : address2,
        },
        engagementScore: {
          [address1]: data1.summary.engagementScore,
          [address2]: data2.summary.engagementScore,
          winner: data1.summary.engagementScore > data2.summary.engagementScore ? address1 : address2,
        },
        protocolDiversity: {
          [address1]: data1.summary.uniqueProtocols,
          [address2]: data2.summary.uniqueProtocols,
          winner: data1.summary.uniqueProtocols > data2.summary.uniqueProtocols ? address1 : address2,
        },
      },
    };
  }

  // Get usage leaderboard
  async getUsageLeaderboard(chainId: string = '1', limit: number = 10) {
    // This would typically query a database of tracked wallets
    // For demo, return mock data
    return {
      leaderboard: [
        { rank: 1, address: '0x...1', txCount: 1500, engagementScore: 98, primaryProtocol: 'Uniswap' },
        { rank: 2, address: '0x...2', txCount: 1200, engagementScore: 92, primaryProtocol: 'Aave' },
        { rank: 3, address: '0x...3', txCount: 980, engagementScore: 88, primaryProtocol: 'Curve' },
      ],
      chainId,
    };
  }
}
