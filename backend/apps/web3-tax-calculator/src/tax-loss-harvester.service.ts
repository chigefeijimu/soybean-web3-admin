import { Injectable } from '@nestjs/common';

export interface PortfolioPosition {
  tokenAddress: string;
  tokenSymbol: string;
  tokenName: string;
  chainId: number;
  quantity: number;
  currentPrice: number;
  currentValue: number;
  purchasePrice: number;
  totalCost: number;
  pnl: number;
  pnlPercent: number;
  isLoss: boolean;
  purchaseDate?: string;
}

export interface HarvestingOpportunity {
  tokenAddress: string;
  tokenSymbol: string;
  quantity: number;
  currentValue: number;
  realizedLoss: number;
  taxSavings: number;
  recommendation: string;
}

export interface TaxSummary {
  totalPortfolioValue: number;
  totalCostBasis: number;
  totalUnrealizedPnL: number;
  totalUnrealizedGains: number;
  totalUnrealizedLosses: number;
  harvestingOpportunities: number;
  potentialTaxSavings: number;
  lossPositions: number;
  gainPositions: number;
}

interface TokenPriceCache {
  price: number;
  change24h: number;
  priceHistory: number[];
  timestamp: number;
}

@Injectable()
export class TaxLossHarvesterService {
  private priceCache: Map<string, TokenPriceCache> = new Map();
  private portfolioCache: Map<string, PortfolioPosition[]> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly TAX_RATE = 0.25; // 25% assumed tax rate

  // Common token addresses for major chains
  private readonly COMMON_TOKENS: Record<number, { [symbol: string]: string }> = {
    1: {
      ETH: '0x0000000000000000000000000000000000000000',
      WETH: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
      USDC: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      USDT: '0xdac17f958d2ee523a2206206994597c13d831ec7',
      DAI: '0x6b175474e89094c44da98b954eedeac495271d0f',
      WBTC: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
      LINK: '0x514910771af9ca656af840dff83e8264ecf986ca',
      UNI: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
      AAVE: '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9',
      MATIC: '0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0',
      SOL: '0xd31de5c1fc2f3c6b6a02e4e9b0b7d9c5e5c7b5e',
    },
    137: {
      MATIC: '0x0000000000000000000000000000000000000000',
      USDC: '0x2791bca1f2de4661ed88a30c99a7a9449aa84174',
      USDT: '0xc2132d05d31c914a87c6611c10748aeb04b58e8f',
      DAI: '0x8f3cf7ad23cd3cadbd9735aff958023239c6a063',
      WMATIC: '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270',
    },
    42161: {
      ETH: '0x0000000000000000000000000000000000000000',
      WETH: '0x82af49447d8a07e3bd95bd0d56f35241523fbab1',
      USDC: '0xaf88d065e77c8cc2239327c5edb3a43126898413',
      USDT: '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9',
      DAI: '0xda10009cbd5d07dd0cecc66161fc93d7c9000da1',
      ARB: '0x912ce59144191c1204e64559fe8253a0e49e6548',
    },
  };

  async getPortfolioPositions(address: string, chainId: number): Promise<{ positions: PortfolioPosition[]; summary: TaxSummary }> {
    const cacheKey = `${address}-${chainId}`;
    
    // Try to get from cache
    const cached = this.portfolioCache.get(cacheKey);
    if (cached && cached.length > 0) {
      return {
        positions: cached,
        summary: this.calculateSummary(cached)
      };
    }

    // Fetch token prices and positions
    const positions = await this.fetchPortfolioPositions(address, chainId);
    this.portfolioCache.set(cacheKey, positions);

    return {
      positions,
      summary: this.calculateSummary(positions)
    };
  }

  private async fetchPortfolioPositions(address: string, chainId: number): Promise<PortfolioPosition[]> {
    // In a real implementation, we would:
    // 1. Fetch all token balances for the address
    // 2. Get current prices for each token
    // 3. Get purchase history (from user data or blockchain)
    
    // For demo, we'll generate sample positions
    const positions: PortfolioPosition[] = [];
    const chainTokens = this.COMMON_TOKENS[chainId] || {};
    
    // Simulate some holdings
    const sampleHoldings = [
      { symbol: 'ETH', quantity: 2.5, costBasis: 1800 },
      { symbol: 'USDC', quantity: 5000, costBasis: 1.0 },
      { symbol: 'LINK', quantity: 100, costBasis: 12 },
      { symbol: 'UNI', quantity: 50, costBasis: 8 },
      { symbol: 'AAVE', quantity: 10, costBasis: 250 },
    ];

    for (const holding of sampleHoldings) {
      const tokenAddress = chainTokens[holding.symbol] || '';
      const priceData = await this.getTokenPrice(chainId, tokenAddress || holding.symbol);
      
      const currentValue = holding.quantity * priceData.price;
      const totalCost = holding.quantity * holding.costBasis;
      const pnl = currentValue - totalCost;
      const pnlPercent = (pnl / totalCost) * 100;

      positions.push({
        tokenAddress,
        tokenSymbol: holding.symbol,
        tokenName: this.getTokenName(holding.symbol),
        chainId,
        quantity: holding.quantity,
        currentPrice: priceData.price,
        currentValue,
        purchasePrice: holding.costBasis,
        totalCost,
        pnl,
        pnlPercent,
        isLoss: pnl < 0,
      });
    }

    return positions;
  }

  private async getTokenPrice(chainId: number, tokenIdentifier: string): Promise<TokenPriceCache> {
    const cacheKey = `${chainId}-${tokenIdentifier.toLowerCase()}`;
    const cached = this.priceCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached;
    }

    // Fetch from CoinGecko API (free tier)
    try {
      // Map chainId to CoinGecko platform
      const platform = this.getCoinGeckoPlatform(chainId);
      const tokenId = this.getCoinGeckoTokenId(tokenIdentifier, platform);
      
      if (!tokenId) {
        // Return mock price for unknown tokens
        return this.getMockPrice(tokenIdentifier);
      }

      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${tokenId}&vs_currencies=usd&include_24hr_change=true`
      );
      
      if (!response.ok) {
        return this.getMockPrice(tokenIdentifier);
      }

      const data = await response.json();
      const priceData = data[tokenId];
      
      const result: TokenPriceCache = {
        price: priceData?.usd || 0,
        change24h: priceData?.usd_24h_change || 0,
        priceHistory: this.generateMockHistory(priceData?.usd || 100),
        timestamp: Date.now()
      };

      this.priceCache.set(cacheKey, result);
      return result;
    } catch (error) {
      console.error('Error fetching token price:', error);
      return this.getMockPrice(tokenIdentifier);
    }
  }

  private getMockPrice(tokenIdentifier: string): TokenPriceCache {
    const mockPrices: Record<string, number> = {
      ETH: 2450,
      WETH: 2450,
      USDC: 1,
      USDT: 1,
      DAI: 1,
      WBTC: 65000,
      LINK: 14,
      UNI: 7,
      AAVE: 280,
      MATIC: 0.85,
      SOL: 120,
      ARB: 1.8,
      WMATIC: 0.85,
    };

    const price = mockPrices[tokenIdentifier.toUpperCase()] || Math.random() * 100;
    return {
      price,
      change24h: (Math.random() - 0.5) * 10,
      priceHistory: this.generateMockHistory(price),
      timestamp: Date.now()
    };
  }

  private generateMockHistory(currentPrice: number): number[] {
    const history: number[] = [];
    let price = currentPrice * 0.9;
    for (let i = 0; i < 7; i++) {
      price += (Math.random() - 0.4) * (currentPrice * 0.05);
      history.push(price);
    }
    history.push(currentPrice);
    return history;
  }

  private getCoinGeckoPlatform(chainId: number): string {
    const platforms: Record<number, string> = {
      1: 'ethereum',
      5: 'ethereum',
      137: 'polygon-pos',
      42161: 'arbitrum-one',
      10: 'optimistic-ethereum',
      56: 'binance-smart-chain',
      8453: 'base',
    };
    return platforms[chainId] || 'ethereum';
  }

  private getCoinGeckoTokenId(tokenIdentifier: string, platform: string): string | null {
    const tokenMapping: Record<string, string> = {
      ETH: 'ethereum',
      WETH: 'weth',
      USDC: 'usd-coin',
      USDT: 'tether',
      DAI: 'dai',
      WBTC: 'wrapped-bitcoin',
      LINK: 'chainlink',
      UNI: 'uniswap',
      AAVE: 'aave',
      MATIC: 'matic-network',
      SOL: 'solana',
      ARB: 'arbitrum',
      WMATIC: 'matic-network',
    };

    const symbol = tokenIdentifier.toUpperCase();
    return tokenMapping[symbol] || null;
  }

  private getTokenName(symbol: string): string {
    const names: Record<string, string> = {
      ETH: 'Ethereum',
      WETH: 'Wrapped Ethereum',
      USDC: 'USD Coin',
      USDT: 'Tether',
      DAI: 'Dai',
      WBTC: 'Wrapped Bitcoin',
      LINK: 'Chainlink',
      UNI: 'Uniswap',
      AAVE: 'Aave',
      MATIC: 'Polygon',
      SOL: 'Solana',
      ARB: 'Arbitrum',
    };
    return names[symbol] || symbol;
  }

  async getHarvestingOpportunities(address: string, chainId: number): Promise<{ opportunities: HarvestingOpportunity[]; totalPotentialSavings: number }> {
    const { positions } = await this.getPortfolioPositions(address, chainId);
    
    const opportunities: HarvestingOpportunity[] = [];
    let totalPotentialSavings = 0;

    for (const position of positions) {
      if (position.isLoss && position.pnl < -10) { // Only show losses > $10
        const realizedLoss = Math.abs(position.pnl);
        const taxSavings = realizedLoss * this.TAX_RATE;
        totalPotentialSavings += taxSavings;

        opportunities.push({
          tokenAddress: position.tokenAddress,
          tokenSymbol: position.tokenSymbol,
          quantity: position.quantity,
          currentValue: position.currentValue,
          realizedLoss,
          taxSavings,
          recommendation: this.generateRecommendation(position),
        });
      }
    }

    // Sort by tax savings (highest first)
    opportunities.sort((a, b) => b.taxSavings - a.taxSavings);

    return { opportunities, totalPotentialSavings };
  }

  private generateRecommendation(position: PortfolioPosition): string {
    const lossPercent = Math.abs(position.pnlPercent);
    
    if (lossPercent > 50) {
      return `⚠️ Heavy loss (${lossPercent.toFixed(1)}%). Consider harvesting this loss to offset gains.`;
    } else if (lossPercent > 20) {
      return `Moderate loss (${lossPercent.toFixed(1)}%). Potential tax savings: $${(Math.abs(position.pnl) * this.TAX_RATE).toFixed(2)}`;
    } else if (lossPercent > 10) {
      return `Small loss (${lossPercent.toFixed(1)}%). Wait for recovery or harvest if you believe in the token.`;
    } else {
      return `Minimal loss (${lossPercent.toFixed(1)}%). Consider holding for potential recovery.`;
    }
  }

  async addPosition(
    tokenAddress: string,
    tokenSymbol: string,
    tokenName: string,
    chainId: number,
    purchasePrice: number,
    quantity: number,
    purchaseDate?: string,
  ): Promise<PortfolioPosition> {
    const priceData = await this.getTokenPrice(chainId, tokenAddress || tokenSymbol);
    
    const position: PortfolioPosition = {
      tokenAddress,
      tokenSymbol,
      tokenName,
      chainId,
      quantity,
      currentPrice: priceData.price,
      currentValue: quantity * priceData.price,
      purchasePrice,
      totalCost: quantity * purchasePrice,
      pnl: (quantity * priceData.price) - (quantity * purchasePrice),
      pnlPercent: (((quantity * priceData.price) - (quantity * purchasePrice)) / (quantity * purchasePrice)) * 100,
      isLoss: (quantity * priceData.price) < (quantity * purchasePrice),
      purchaseDate,
    };

    // Add to cache
    const cacheKey = `manual-${tokenAddress.toLowerCase()}`;
    const positions = this.portfolioCache.get(cacheKey) || [];
    positions.push(position);
    this.portfolioCache.set(cacheKey, positions);

    return position;
  }

  async getMultipleTokenPrices(chainId: number, tokens: string[]): Promise<Record<string, { price: number; change24h: number }>> {
    const result: Record<string, { price: number; change24h: number }> = {};

    for (const token of tokens) {
      const priceData = await this.getTokenPrice(chainId, token);
      result[token.toLowerCase()] = {
        price: priceData.price,
        change24h: priceData.change24h,
      };
    }

    return result;
  }

  private calculateSummary(positions: PortfolioPosition[]): TaxSummary {
    const totalPortfolioValue = positions.reduce((sum, p) => sum + p.currentValue, 0);
    const totalCostBasis = positions.reduce((sum, p) => sum + p.totalCost, 0);
    const totalUnrealizedPnL = positions.reduce((sum, p) => sum + p.pnl, 0);
    
    const totalUnrealizedGains = positions
      .filter(p => p.pnl > 0)
      .reduce((sum, p) => sum + p.pnl, 0);
    
    const totalUnrealizedLosses = positions
      .filter(p => p.pnl < 0)
      .reduce((sum, p) => sum + p.pnl, 0);
    
    const lossPositions = positions.filter(p => p.isLoss).length;
    const gainPositions = positions.filter(p => !p.isLoss).length;
    
    const harvestingOpportunities = lossPositions;
    const potentialTaxSavings = Math.abs(totalUnrealizedLosses) * this.TAX_RATE;

    return {
      totalPortfolioValue,
      totalCostBasis,
      totalUnrealizedPnL,
      totalUnrealizedGains,
      totalUnrealizedLosses,
      harvestingOpportunities,
      potentialTaxSavings,
      lossPositions,
      gainPositions,
    };
  }
}
