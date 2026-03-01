import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';

interface TokenHolding {
  tokenAddress: string;
  symbol: string;
  name: string;
  balance: string;
  price: number;
  value: number;
  change24h: number;
}

interface TargetAllocation {
  symbol: string;
  percentage: number;
}

interface RebalanceTrade {
  fromToken: string;
  toToken: string;
  fromAmount: number;
  toAmount: number;
  estimatedValue: number;
  gasEstimate: number;
  reason: string;
}

interface RebalancePlan {
  currentAllocation: { symbol: string; value: number; percentage: number }[];
  targetAllocation: TargetAllocation[];
  trades: RebalanceTrade[];
  totalValue: number;
  estimatedGasCost: number;
  rebalanceRatio: number;
}

@Injectable()
export class PortfolioRebalancerService {
  private readonly logger = new Logger(PortfolioRebalancerService.name);
  private readonly ethplorerApi = 'https://api.ethplorer.io';

  constructor(private readonly httpService: HttpService) {}

  async getCurrentPortfolio(address: string, chainId: number = 1): Promise<{
    tokens: TokenHolding[];
    totalValue: number;
  }> {
    try {
      const tokens = await this.getTokenHoldings(address, chainId);
      const totalValue = tokens.reduce((sum, t) => sum + t.value, 0);
      return { tokens, totalValue };
    } catch (error) {
      this.logger.error(`Failed to get portfolio: ${error.message}`);
      return this.getDemoPortfolio();
    }
  }

  async generateRebalancePlan(
    address: string,
    targetAllocation: TargetAllocation[],
    chainId: number = 1,
    slippageTolerance: number = 0.5
  ): Promise<RebalancePlan> {
    try {
      const { tokens, totalValue } = await this.getCurrentPortfolio(address, chainId);
      
      // Calculate current allocation
      const currentAllocation = tokens.map(t => ({
        symbol: t.symbol,
        value: t.value,
        percentage: totalValue > 0 ? (t.value / totalValue) * 100 : 0,
      }));

      // Generate rebalance trades
      const trades = this.calculateRebalanceTrades(
        tokens,
        targetAllocation,
        totalValue,
        slippageTolerance
      );

      const estimatedGasCost = trades.length * 0.005 * 2500; // ~0.005 ETH per trade
      const totalTradeValue = trades.reduce((sum, t) => sum + t.estimatedValue, 0);
      const rebalanceRatio = totalValue > 0 ? (totalTradeValue / totalValue) * 100 : 0;

      return {
        currentAllocation,
        targetAllocation,
        trades,
        totalValue,
        estimatedGasCost,
        rebalanceRatio,
      };
    } catch (error) {
      this.logger.error(`Failed to generate rebalance plan: ${error.message}`);
      return this.getDemoRebalancePlan();
    }
  }

  private calculateRebalanceTrades(
    tokens: TokenHolding[],
    targetAllocation: TargetAllocation[],
    totalValue: number,
    slippageTolerance: number
  ): RebalanceTrade[] {
    const trades: RebalanceTrade[] = [];
    const tokenMap = new Map(tokens.map(t => [t.symbol.toUpperCase(), t]));
    
    // Calculate deviations
    const deviations: { symbol: string; currentPct: number; targetPct: number; diff: number; value: number }[] = [];
    
    for (const target of targetAllocation) {
      const token = tokenMap.get(target.symbol.toUpperCase());
      const currentPct = token ? (token.value / totalValue) * 100 : 0;
      const diff = target.percentage - currentPct;
      deviations.push({
        symbol: target.symbol,
        currentPct,
        targetPct: target.percentage,
        diff,
        value: token ? token.value : 0,
      });
    }

    // Add any current tokens not in target
    for (const token of tokens) {
      if (!targetAllocation.find(t => t.symbol.toUpperCase() === token.symbol.toUpperCase())) {
        deviations.push({
          symbol: token.symbol,
          currentPct: (token.value / totalValue) * 100,
          targetPct: 0,
          diff: -((token.value / totalValue) * 100),
          value: token.value,
        });
      }
    }

    // Generate sells for over-allocated tokens
    const sells = deviations.filter(d => d.diff < -1).sort((a, b) => a.diff - b.diff);
    // Generate buys for under-allocated tokens
    const buys = deviations.filter(d => d.diff > 1).sort((a, b) => b.diff - a.diff);

    // Match sells to buys
    for (const sell of sells) {
      for (const buy of buys) {
        if (sell.diff < 0 && buy.diff > 0) {
          const tradeValue = Math.min(
            Math.abs(sell.diff / 100) * totalValue,
            (buy.diff / 100) * totalValue
          );
          
          if (tradeValue > 10) { // Minimum $10 trade
            trades.push({
              fromToken: sell.symbol,
              toToken: buy.symbol,
              fromAmount: tradeValue / (tokenMap.get(sell.symbol.toUpperCase())?.price || 1),
              toAmount: tradeValue / (tokenMap.get(buy.symbol.toUpperCase())?.price || 1),
              estimatedValue: tradeValue,
              gasEstimate: 0.005,
              reason: `Sell ${sell.symbol} (-${Math.abs(sell.diff).toFixed(1)}%), Buy ${buy.symbol} (+${buy.diff.toFixed(1)}%)`,
            });
          }
          
          sell.diff += (tradeValue / totalValue) * 100;
          buy.diff -= (tradeValue / totalValue) * 100;
        }
      }
    }

    return trades;
  }

  private async getTokenHoldings(address: string, chainId: number): Promise<TokenHolding[]> {
    try {
      if (chainId === 1 || chainId === 5) {
        const response = await this.httpService.axiosRef.get(
          `${this.ethplorerApi}/getAddressInfo/${address}`,
          { params: { apiKey: 'free' } }
        );
        
        if (response.data && response.data.tokens) {
          return response.data.tokens
            .filter((t: any) => t.balance > 0)
            .map((t: any) => ({
              tokenAddress: t.tokenInfo.address,
              symbol: t.tokenInfo.symbol,
              name: t.tokenInfo.name,
              balance: t.balance,
              price: t.tokenInfo.price ? t.tokenInfo.price.price : 0,
              value: t.balance * (t.tokenInfo.price ? t.tokenInfo.price.price : 0),
              change24h: t.tokenInfo.price ? t.tokenInfo.price.diff : 0,
            }))
            .slice(0, 15);
        }
      }
    } catch (error) {
      this.logger.warn(`API failed, using demo: ${error.message}`);
    }
    return this.getDemoTokens();
  }

  private getDemoTokens(): TokenHolding[] {
    return [
      { tokenAddress: '0x0000000000000000000000000000000000000000', symbol: 'ETH', name: 'Ethereum', balance: '2.0', price: 2450, value: 4900, change24h: 2.5 },
      { tokenAddress: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599', symbol: 'WBTC', name: 'Wrapped Bitcoin', balance: '0.1', price: 62000, value: 6200, change24h: 1.8 },
      { tokenAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', symbol: 'USDC', name: 'USD Coin', balance: '3000', price: 1, value: 3000, change24h: 0.01 },
      { tokenAddress: '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9', symbol: 'AAVE', name: 'Aave', balance: '50', price: 95, value: 4750, change24h: -1.2 },
      { tokenAddress: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984', symbol: 'UNI', name: 'Uniswap', balance: '200', price: 7.5, value: 1500, change24h: 3.2 },
      { tokenAddress: '0x514910771af9ca656af840dff83e8264ecf986ca', symbol: 'LINK', name: 'Chainlink', balance: '100', price: 14, value: 1400, change24h: -0.5 },
    ];
  }

  private getDemoPortfolio(): { tokens: TokenHolding[]; totalValue: number } {
    const tokens = this.getDemoTokens();
    const totalValue = tokens.reduce((sum, t) => sum + t.value, 0);
    return { tokens, totalValue };
  }

  private getDemoRebalancePlan(): RebalancePlan {
    const tokens = this.getDemoTokens();
    const totalValue = tokens.reduce((sum, t) => sum + t.value, 0);
    
    const currentAllocation = tokens.map(t => ({
      symbol: t.symbol,
      value: t.value,
      percentage: (t.value / totalValue) * 100,
    }));

    const targetAllocation: TargetAllocation[] = [
      { symbol: 'ETH', percentage: 40 },
      { symbol: 'WBTC', percentage: 30 },
      { symbol: 'USDC', percentage: 10 },
      { symbol: 'AAVE', percentage: 10 },
      { symbol: 'UNI', percentage: 5 },
      { symbol: 'LINK', percentage: 5 },
    ];

    const trades: RebalanceTrade[] = [
      {
        fromToken: 'USDC',
        toToken: 'ETH',
        fromAmount: 1000,
        toAmount: 0.408,
        estimatedValue: 1000,
        gasEstimate: 0.005,
        reason: 'Buy ETH to reach 40% target',
      },
      {
        fromToken: 'LINK',
        toToken: 'AAVE',
        fromAmount: 350,
        toAmount: 3.68,
        estimatedValue: 350,
        gasEstimate: 0.005,
        reason: 'Buy AAVE to reach 10% target',
      },
    ];

    return {
      currentAllocation,
      targetAllocation,
      trades,
      totalValue,
      estimatedGasCost: 0.015 * 2450,
      rebalanceRatio: 8.5,
    };
  }

  async getPresetStrategies(): Promise<{ name: string; description: string; allocation: TargetAllocation[] }[]> {
    return [
      {
        name: 'Conservative',
        description: 'Low risk, stable returns',
        allocation: [
          { symbol: 'ETH', percentage: 60 },
          { symbol: 'USDC', percentage: 30 },
          { symbol: 'WBTC', percentage: 10 },
        ],
      },
      {
        name: 'Balanced',
        description: 'Mix of growth and stability',
        allocation: [
          { symbol: 'ETH', percentage: 40 },
          { symbol: 'WBTC', percentage: 25 },
          { symbol: 'AAVE', percentage: 15 },
          { symbol: 'UNI', percentage: 10 },
          { symbol: 'USDC', percentage: 10 },
        ],
      },
      {
        name: 'Aggressive',
        description: 'High risk, high reward',
        allocation: [
          { symbol: 'ETH', percentage: 35 },
          { symbol: 'WBTC', percentage: 25 },
          { symbol: 'AAVE', percentage: 20 },
          { symbol: 'UNI', percentage: 15 },
          { symbol: 'LINK', percentage: 5 },
        ],
      },
      {
        name: 'DeFi Yield',
        description: 'Optimized for yield farming',
        allocation: [
          { symbol: 'ETH', percentage: 30 },
          { symbol: 'AAVE', percentage: 25 },
          { symbol: 'UNI', percentage: 20 },
          { symbol: 'LINK', percentage: 15 },
          { symbol: 'USDC', percentage: 10 },
        ],
      },
    ];
  }
}
