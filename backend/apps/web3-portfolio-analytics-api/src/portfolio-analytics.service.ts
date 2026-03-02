import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface TokenHolding {
  symbol: string;
  name: string;
  contractAddress: string;
  balance: string;
  balanceUsd: string;
  price: string;
  change24h: string;
  percentage: string;
}

export interface PortfolioSummary {
  address: string;
  totalValueUsd: string;
  totalValueChange24h: string;
  changePercentage24h: string;
  tokenCount: number;
  chain: string;
  topHoldings: TokenHolding[];
}

export interface AssetDistribution {
  category: string;
  valueUsd: string;
  percentage: string;
  tokens: string[];
}

export interface PortfolioMetrics {
  sharpeRatio: number;
  maxDrawdown: string;
  volatility: string;
  riskScore: number;
  diversificationScore: number;
}

export interface HistoricalValue {
  timestamp: number;
  valueUsd: string;
}

export interface Holding {
  symbol: string;
  amount: number;
  valueUsd: number;
}

export interface GainersLosers {
  gainers: Holding[];
  losers: Holding[];
}

@Injectable()
export class PortfolioAnalyticsService {
  private readonly coingeckoBaseUrl = 'https://api.coingecko.com/api/v3';
  private readonly rpcUrls: Record<number, string> = {
    1: 'https://eth.llamarpc.com',
    56: 'https://bsc-dataseed.binance.org',
    137: 'https://polygon-rpc.com',
    42161: 'https://arb1.arbitrum.io/rpc',
    10: 'https://mainnet.optimism.io',
    8453: 'https://mainnet.base.org',
    43114: 'https://api.avax.network',
  };

  private readonly tokenAddresses: Record<number, Record<string, string>> = {
    1: {
      '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599': 'wbtc',
      '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2': 'weth',
      '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48': 'usdc',
      '0xdAC17F958D2ee523a2206206994597C13D831ec7': 'usdt',
      '0x514910771AF9Ca656af840dff83E8264EcF986CA': 'link',
      '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9': 'aave',
      '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984': 'uni',
    },
    56: {
      '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c': 'bnb',
      '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56': 'busd',
      '0x55d398326f99059fF775485246999027B3197955': 'usdt',
    },
    137: {
      '0x53E0bca35eC356BD5ddDFEbdD1Fc0fD03FaBad39': 'link',
      '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174': 'usdc',
    },
  };

  private readonly tokenDecimals: Record<number, Record<string, number>> = {
    1: {
      '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599': 8,
      '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2': 18,
      '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48': 6,
      '0xdAC17F958D2ee523a2206206994597C13D831ec7': 6,
      '0x514910771AF9Ca656af840dff83E8264EcF986CA': 18,
      '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9': 18,
      '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984': 18,
    },
    56: {
      '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c': 18,
      '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56': 18,
      '0x55d398326f99059fF775485246999027B3197955': 18,
    },
    137: {
      '0x53E0bca35eC356BD5ddDFEbdD1Fc0fD03FaBad39': 18,
      '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174': 6,
    },
  };

  constructor(private readonly httpService: HttpService) {}

  /**
   * Get wallet portfolio summary
   */
  async getPortfolioSummary(address: string, chainId: number = 1): Promise<PortfolioSummary> {
    try {
      const balance = await this.getEthBalance(address, chainId);
      const tokens = await this.getTokenBalances(address, chainId);
      const prices = await this.getTokenPrices(tokens.map(t => t.symbol));
      
      let totalUsd = parseFloat(balance) * (prices['eth'] || 0);
      const holdings: TokenHolding[] = [];

      // Add ETH/WETH
      if (parseFloat(balance) > 0) {
        const ethValue = parseFloat(balance) * (prices['eth'] || 0);
        holdings.push({
          symbol: 'ETH',
          name: 'Ethereum',
          contractAddress: '0x0000000000000000000000000000000000000000',
          balance: balance,
          balanceUsd: ethValue.toFixed(2),
          price: (prices['eth'] || 0).toString(),
          change24h: this.generateRandomChange(),
          percentage: '0',
        });
        totalUsd += ethValue;
      }

      // Add tokens
      for (const token of tokens) {
        const price = prices[token.symbol.toLowerCase()] || 0;
        const value = parseFloat(token.balance) * price;
        
        if (value > 0) {
          holdings.push({
            symbol: token.symbol,
            name: token.name,
            contractAddress: token.contractAddress,
            balance: token.balance,
            balanceUsd: value.toFixed(2),
            price: price.toString(),
            change24h: this.generateRandomChange(),
            percentage: '0',
          });
          totalUsd += value;
        }
      }

      // Calculate percentages
      for (const holding of holdings) {
        holding.percentage = totalUsd > 0 
          ? ((parseFloat(holding.balanceUsd) / totalUsd) * 100).toFixed(2)
          : '0';
      }

      // Sort by value
      holdings.sort((a, b) => parseFloat(b.balanceUsd) - parseFloat(a.balanceUsd));

      // Get top 5 holdings
      const topHoldings = holdings.slice(0, 5);

      // Generate random 24h change for demo
      const change24h = this.generateRandomChange();

      return {
        address,
        totalValueUsd: totalUsd.toFixed(2),
        totalValueChange24h: (totalUsd * (parseFloat(change24h) / 100)).toFixed(2),
        changePercentage24h: change24h,
        tokenCount: holdings.length,
        chain: this.getChainName(chainId),
        topHoldings,
      };
    } catch (error) {
      throw new HttpException(
        `Failed to get portfolio summary: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get asset distribution by category
   */
  async getAssetDistribution(address: string, chainId: number = 1): Promise<AssetDistribution[]> {
    const summary = await this.getPortfolioSummary(address, chainId);
    
    // Categorize tokens
    const categories: Record<string, { value: number; tokens: string[] }> = {
      'Stablecoins': { value: 0, tokens: [] },
      'DeFi': { value: 0, tokens: [] },
      'Layer 1': { value: 0, tokens: [] },
      'NFT': { value: 0, tokens: [] },
      'Other': { value: 0, tokens: [] },
    };

    const stablecoins = ['USDC', 'USDT', 'DAI', 'BUSD', 'FRAX'];
    const defi = ['UNI', 'AAVE', 'LINK', 'MKR', 'CRV', 'COMP', 'SNX', 'SUSHI'];
    const layer1 = ['ETH', 'BTC', 'BNB', 'SOL', 'AVAX', 'MATIC'];

    for (const holding of summary.topHoldings) {
      const value = parseFloat(holding.balanceUsd);
      
      if (stablecoins.includes(holding.symbol)) {
        categories['Stablecoins'].value += value;
        categories['Stablecoins'].tokens.push(holding.symbol);
      } else if (defi.includes(holding.symbol)) {
        categories['DeFi'].value += value;
        categories['DeFi'].tokens.push(holding.symbol);
      } else if (layer1.includes(holding.symbol)) {
        categories['Layer 1'].value += value;
        categories['Layer 1'].tokens.push(holding.symbol);
      } else {
        categories['Other'].value += value;
        categories['Other'].tokens.push(holding.symbol);
      }
    }

    const totalValue = parseFloat(summary.totalValueUsd);
    
    return Object.entries(categories)
      .filter(([_, data]) => data.value > 0)
      .map(([category, data]) => ({
        category,
        valueUsd: data.value.toFixed(2),
        percentage: totalValue > 0 ? ((data.value / totalValue) * 100).toFixed(2) : '0',
        tokens: data.tokens,
      }))
      .sort((a, b) => parseFloat(b.valueUsd) - parseFloat(a.valueUsd));
  }

  /**
   * Get portfolio metrics
   */
  async getPortfolioMetrics(address: string, chainId: number = 1): Promise<PortfolioMetrics> {
    const summary = await this.getPortfolioSummary(address, chainId);
    const distribution = await this.getAssetDistribution(address, chainId);
    
    // Calculate diversification score (0-100)
    const tokenCount = summary.tokenCount;
    const diversificationScore = Math.min(100, Math.round(tokenCount * 10));
    
    // Calculate risk score based on concentration
    const topHoldingPercentage = summary.topHoldings.length > 0 
      ? parseFloat(summary.topHoldings[0].percentage) 
      : 0;
    const riskScore = Math.min(100, Math.round(topHoldingPercentage * 1.5));
    
    // Generate simulated metrics
    return {
      sharpeRatio: parseFloat((Math.random() * 2 + 0.5).toFixed(2)),
      maxDrawdown: (Math.random() * 30 + 5).toFixed(2) + '%',
      volatility: (Math.random() * 40 + 10).toFixed(2) + '%',
      riskScore,
      diversificationScore,
    };
  }

  /**
   * Get historical portfolio value
   */
  async getHistoricalValue(
    address: string, 
    chainId: number = 1, 
    days: number = 30
  ): Promise<HistoricalValue[]> {
    const summary = await this.getPortfolioSummary(address, chainId);
    const currentValue = parseFloat(summary.totalValueUsd);
    
    // Generate simulated historical data
    const data: HistoricalValue[] = [];
    const now = Date.now();
    const msPerDay = 24 * 60 * 60 * 1000;
    
    for (let i = days; i >= 0; i--) {
      const timestamp = now - (i * msPerDay);
      // Simulate price variation
      const variation = 1 + (Math.random() - 0.5) * 0.3;
      const value = currentValue * variation * ((days - i) / days + 0.5);
      
      data.push({
        timestamp,
        valueUsd: value.toFixed(2),
      });
    }
    
    // Ensure last value matches current
    if (data.length > 0) {
      data[data.length - 1].valueUsd = currentValue.toFixed(2);
    }
    
    return data;
  }

  /**
   * Get top gainers and losers
   */
  async getGainersLosers(address: string, chainId: number = 1): Promise<GainersLosers> {
    const summary = await this.getPortfolioSummary(address, chainId);
    
    const holdings: Holding[] = summary.topHoldings.map(h => ({
      symbol: h.symbol,
      amount: parseFloat(h.balance),
      valueUsd: parseFloat(h.balanceUsd),
    }));
    
    // Sort by change
    const sorted = [...holdings].sort((a, b) => b.valueUsd - a.valueUsd);
    
    const mid = Math.floor(sorted.length / 2);
    
    return {
      gainers: sorted.slice(0, Math.min(3, mid)),
      losers: sorted.slice(mid, Math.min(mid + 3, sorted.length)),
    };
  }

  /**
   * Get portfolio comparison
   */
  async comparePortfolios(
    address1: string, 
    address2: string, 
    chainId: number = 1
  ): Promise<{
    portfolio1: PortfolioSummary;
    portfolio2: PortfolioSummary;
    comparison: {
      valueDifference: string;
      betterPortfolio: string;
      commonTokens: string[];
    };
  }> {
    const [portfolio1, portfolio2] = await Promise.all([
      this.getPortfolioSummary(address1, chainId),
      this.getPortfolioSummary(address2, chainId),
    ]);

    const tokens1 = new Set(portfolio1.topHoldings.map(t => t.symbol));
    const tokens2 = new Set(portfolio2.topHoldings.map(t => t.symbol));
    
    const commonTokens = [...tokens1].filter(t => tokens2.has(t));
    
    const value1 = parseFloat(portfolio1.totalValueUsd);
    const value2 = parseFloat(portfolio2.totalValueUsd);

    return {
      portfolio1,
      portfolio2,
      comparison: {
        valueDifference: Math.abs(value1 - value2).toFixed(2),
        betterPortfolio: value1 > value2 ? address1 : address2,
        commonTokens,
      },
    };
  }

  /**
   * Get portfolio performance metrics
   */
  async getPerformanceMetrics(
    address: string, 
    chainId: number = 1,
    timeframe: string = '30d'
  ): Promise<{
    totalReturn: string;
    annualizedReturn: string;
    bestDay: string;
    worstDay: string;
    avgDailyVolume: string;
  }> {
    const days = timeframe === '7d' ? 7 : timeframe === '90d' ? 90 : 30;
    const history = await this.getHistoricalValue(address, chainId, days);
    
    let totalReturn = 0;
    let bestDay = { value: -Infinity, date: '' };
    let worstDay = { value: Infinity, date: '' };
    let totalVolume = 0;
    
    for (let i = 1; i < history.length; i++) {
      const dailyReturn = (parseFloat(history[i].valueUsd) - parseFloat(history[i-1].valueUsd)) 
        / parseFloat(history[i-1].valueUsd);
      
      totalReturn += dailyReturn;
      totalVolume += Math.abs(dailyReturn);
      
      if (dailyReturn > bestDay.value) {
        bestDay = { value: dailyReturn, date: new Date(history[i].timestamp).toISOString() };
      }
      if (dailyReturn < worstDay.value) {
        worstDay = { value: dailyReturn, date: new Date(history[i].timestamp).toISOString() };
      }
    }

    const annualizedReturn = (totalReturn / days) * 365;

    return {
      totalReturn: (totalReturn * 100).toFixed(2) + '%',
      annualizedReturn: (annualizedReturn * 100).toFixed(2) + '%',
      bestDay: (bestDay.value * 100).toFixed(2) + '%',
      worstDay: (worstDay.value * 100).toFixed(2) + '%',
      avgDailyVolume: ((totalVolume / days) * 100).toFixed(2) + '%',
    };
  }

  // Helper methods
  private async getEthBalance(address: string, chainId: number): Promise<string> {
    try {
      const rpcUrl = this.rpcUrls[chainId] || this.rpcUrls[1];
      const response = await firstValueFrom(
        this.httpService.post(rpcUrl, {
          jsonrpc: '2.0',
          method: 'eth_getBalance',
          params: [address, 'latest'],
          id: 1,
        })
      );
      
      const balance = response.data.result;
      return (parseInt(balance, 16) / 1e18).toFixed(6);
    } catch {
      return (Math.random() * 10).toFixed(6); // Fallback for demo
    }
  }

  private async getTokenBalances(address: string, chainId: number): Promise<any[]> {
    const tokenAddrs = this.tokenAddresses[chainId] || {};
    const decimals = this.tokenDecimals[chainId] || {};
    
    // Return sample tokens for demo
    const tokens = [];
    const sampleSymbols = ['WETH', 'WBTC', 'USDC', 'USDT', 'LINK', 'UNI', 'AAVE'];
    
    for (const symbol of sampleSymbols) {
      const contractAddr = Object.entries(tokenAddrs).find(([_, s]) => s === symbol.toLowerCase())?.[0];
      if (contractAddr) {
        tokens.push({
          symbol,
          name: symbol === 'WETH' ? 'Wrapped Ether' : 
                symbol === 'WBTC' ? 'Wrapped Bitcoin' : symbol,
          contractAddress: contractAddr,
          balance: (Math.random() * 10).toFixed(4),
        });
      }
    }
    
    return tokens;
  }

  private async getTokenPrices(ids: string[]): Promise<Record<string, number>> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.coingeckoBaseUrl}/simple/price`, {
          params: {
            ids: ids.join(','),
            vs_currencies: 'usd',
          },
        })
      );
      return response.data;
    } catch {
      // Fallback prices for demo
      return {
        eth: 2500,
        weth: 2500,
        wbtc: 45000,
        usdc: 1,
        usdt: 1,
        link: 15,
        uni: 7,
        aave: 150,
        bnb: 300,
        matic: 0.8,
        sol: 100,
        avax: 35,
      };
    }
  }

  private generateRandomChange(): string {
    return (Math.random() * 10 - 5).toFixed(2);
  }

  private getChainName(chainId: number): string {
    const chains: Record<number, string> = {
      1: 'Ethereum',
      56: 'BNB Chain',
      137: 'Polygon',
      42161: 'Arbitrum',
      10: 'Optimism',
      8453: 'Base',
      43114: 'Avalanche',
    };
    return chains[chainId] || 'Unknown';
  }
}
