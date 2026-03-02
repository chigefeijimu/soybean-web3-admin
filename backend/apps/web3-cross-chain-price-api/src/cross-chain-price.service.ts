import { Injectable } from '@nestjs/common';
import axios from 'axios';

export interface TokenPrice {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  change7d: number;
  volume24h: number;
  marketCap: number;
  chain: string;
  lastUpdated: string;
}

export interface CrossChainPrice {
  symbol: string;
  name: string;
  prices: {
    chain: string;
    price: number;
    change24h: number;
    volume24h: number;
  }[];
  averagePrice: number;
  priceDiff: number;
  priceDiffPercent: number;
  bestPrice: {
    chain: string;
    price: number;
  };
  worstPrice: {
    chain: string;
    price: number;
  };
}

export interface PriceAlert {
  id: string;
  symbol: string;
  targetPrice: number;
  condition: 'above' | 'below';
  createdAt: string;
}

@Injectable()
export class CrossChainPriceService {
  private readonly supportedChains = [
    'Ethereum',
    'Polygon',
    'Arbitrum',
    'Optimism',
    'BSC',
    'Base',
    'Avalanche',
    'Solana',
  ];

  private readonly supportedTokens = [
    { symbol: 'ETH', name: 'Ethereum', addresses: {} },
    { symbol: 'BTC', name: 'Bitcoin', addresses: {} },
    { symbol: 'USDC', name: 'USD Coin', addresses: {} },
    { symbol: 'USDT', name: 'Tether', addresses: {} },
    { symbol: 'WBTC', name: 'Wrapped Bitcoin', addresses: {} },
    { symbol: 'BNB', name: 'BNB', addresses: {} },
    { symbol: 'MATIC', name: 'Polygon', addresses: {} },
    { symbol: 'AVAX', name: 'Avalanche', addresses: {} },
    { symbol: 'LINK', name: 'Chainlink', addresses: {} },
    { symbol: 'UNI', name: 'Uniswap', addresses: {} },
    { symbol: 'AAVE', name: 'Aave', addresses: {} },
    { symbol: 'MKR', name: 'Maker', addresses: {} },
    { symbol: 'CRV', name: 'Curve DAO', addresses: {} },
    { symbol: 'SOL', name: 'Solana', addresses: {} },
    { symbol: 'ARB', name: 'Arbitrum', addresses: {} },
    { symbol: 'OP', name: 'Optimism', addresses: {} },
  ];

  private priceCache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 60000; // 1 minute

  async getPricesByChain(chain: string): Promise<TokenPrice[]> {
    const cacheKey = `chain-${chain}`;
    const cached = this.priceCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }

    // Simulate cross-chain price data with realistic variations
    const prices = this.supportedTokens.map(token => {
      const basePrice = this.getBasePrice(token.symbol);
      const chainVariation = this.getChainVariation(chain);
      const price = basePrice * (1 + chainVariation);
      const change24h = (Math.random() - 0.5) * 10;
      const change7d = (Math.random() - 0.3) * 20;
      const volume24h = basePrice * (Math.random() * 1000000000 + 100000000);
      const marketCap = basePrice * (Math.random() * 10000000000 + 1000000000);

      return {
        symbol: token.symbol,
        name: token.name,
        price: parseFloat(price.toFixed(token.symbol === 'ETH' || token.symbol === 'BTC' ? 2 : 6)),
        change24h: parseFloat(change24h.toFixed(2)),
        change7d: parseFloat(change7d.toFixed(2)),
        volume24h: parseFloat(volume24h.toFixed(0)),
        marketCap: parseFloat(marketCap.toFixed(0)),
        chain,
        lastUpdated: new Date().toISOString(),
      };
    });

    this.priceCache.set(cacheKey, { data: prices, timestamp: Date.now() });
    return prices;
  }

  async getCrossChainPrice(symbol: string): Promise<CrossChainPrice> {
    const token = this.supportedTokens.find(t => t.symbol.toUpperCase() === symbol.toUpperCase());
    if (!token) {
      throw new Error(`Token ${symbol} not supported`);
    }

    const basePrice = this.getBasePrice(symbol);
    const prices = this.supportedChains.map(chain => {
      const chainVariation = this.getChainVariation(chain);
      const price = basePrice * (1 + chainVariation);
      const change24h = (Math.random() - 0.5) * 10;
      const volume24h = basePrice * (Math.random() * 1000000000 + 100000000);

      return {
        chain,
        price: parseFloat(price.toFixed(token.symbol === 'ETH' || token.symbol === 'BTC' ? 2 : 6)),
        change24h: parseFloat(change24h.toFixed(2)),
        volume24h: parseFloat(volume24h.toFixed(0)),
      };
    });

    const priceValues = prices.map(p => p.price);
    const averagePrice = priceValues.reduce((a, b) => a + b, 0) / priceValues.length;
    const maxPrice = Math.max(...priceValues);
    const minPrice = Math.min(...priceValues);
    const priceDiff = maxPrice - minPrice;
    const priceDiffPercent = (priceDiff / averagePrice) * 100;

    const bestPrice = prices.find(p => p.price === minPrice);
    const worstPrice = prices.find(p => p.price === maxPrice);

    return {
      symbol: token.symbol,
      name: token.name,
      prices,
      averagePrice: parseFloat(averagePrice.toFixed(2)),
      priceDiff: parseFloat(priceDiff.toFixed(2)),
      priceDiffPercent: parseFloat(priceDiffPercent.toFixed(2)),
      bestPrice: {
        chain: bestPrice?.chain || '',
        price: bestPrice?.price || 0,
      },
      worstPrice: {
        chain: worstPrice?.chain || '',
        price: worstPrice?.price || 0,
      },
    };
  }

  async getAllCrossChainPrices(): Promise<CrossChainPrice[]> {
    const results = await Promise.all(
      this.supportedTokens.map(token => this.getCrossChainPrice(token.symbol).catch(() => null))
    );
    return results.filter(Boolean);
  }

  async getPriceComparison(symbol: string): Promise<{
    symbol: string;
    lowestPrice: { chain: string; price: number };
    highestPrice: { chain: string; price: number };
    potentialProfit: number;
    arbitrageOpportunity: boolean;
  }> {
    const crossChainPrice = await this.getCrossChainPrice(symbol);
    
    const lowestPrice = crossChainPrice.bestPrice;
    const highestPrice = crossChainPrice.worstPrice;
    const potentialProfit = highestPrice.price - lowestPrice.price;
    const arbitrageOpportunity = potentialProfit / lowestPrice.price > 0.02; // 2% threshold

    return {
      symbol: crossChainPrice.symbol,
      lowestPrice,
      highestPrice,
      potentialProfit: parseFloat(potentialProfit.toFixed(2)),
      arbitrageOpportunity,
    };
  }

  async getMarketOverview(): Promise<{
    totalMarketCap: number;
    totalVolume24h: number;
    btcDominance: number;
    ethDominance: number;
    trending: { symbol: string; change24h: number }[];
    gainers: { symbol: string; change24h: number }[];
    losers: { symbol: string; change24h: number }[];
  }> {
    const prices = await this.getPricesByChain('Ethereum');
    
    const totalMarketCap = prices.reduce((sum, p) => sum + p.marketCap, 0);
    const totalVolume24h = prices.reduce((sum, p) => sum + p.volume24h, 0);
    
    const btc = prices.find(p => p.symbol === 'BTC');
    const eth = prices.find(p => p.symbol === 'ETH');
    
    const btcDominance = btc ? (btc.marketCap / totalMarketCap) * 100 : 0;
    const ethDominance = eth ? (eth.marketCap / totalMarketCap) * 100 : 0;

    const sorted = [...prices].sort((a, b) => b.change24h - a.change24h);
    const trending = sorted.slice(0, 5).map(p => ({ symbol: p.symbol, change24h: p.change24h }));
    const gainers = sorted.filter(p => p.change24h > 0).slice(0, 5).map(p => ({ symbol: p.symbol, change24h: p.change24h }));
    const losers = sorted.filter(p => p.change24h < 0).slice(0, 5).map(p => ({ symbol: p.symbol, change24h: p.change24h }));

    return {
      totalMarketCap: parseFloat(totalMarketCap.toFixed(0)),
      totalVolume24h: parseFloat(totalVolume24h.toFixed(0)),
      btcDominance: parseFloat(btcDominance.toFixed(2)),
      ethDominance: parseFloat(ethDominance.toFixed(2)),
      trending,
      gainers,
      losers,
    };
  }

  async getSupportedChains(): Promise<string[]> {
    return this.supportedChains;
  }

  async getSupportedTokens(): Promise<{ symbol: string; name: string }[]> {
    return this.supportedTokens.map(t => ({ symbol: t.symbol, name: t.name }));
  }

  private getBasePrice(symbol: string): number {
    const basePrices: Record<string, number> = {
      ETH: 2450.00,
      BTC: 62500.00,
      USDC: 1.00,
      USDT: 1.00,
      WBTC: 62800.00,
      BNB: 580.00,
      MATIC: 0.85,
      AVAX: 35.00,
      LINK: 18.50,
      UNI: 7.20,
      AAVE: 95.00,
      MKR: 1800.00,
      CRV: 0.55,
      SOL: 145.00,
      ARB: 1.15,
      OP: 2.10,
    };
    return basePrices[symbol] || 1.0;
  }

  private getChainVariation(chain: string): number {
    const variations: Record<string, number> = {
      Ethereum: 0,
      Polygon: -0.01 + Math.random() * 0.02,
      Arbitrum: -0.015 + Math.random() * 0.025,
      Optimism: -0.01 + Math.random() * 0.02,
      BSC: -0.02 + Math.random() * 0.03,
      Base: -0.01 + Math.random() * 0.02,
      Avalanche: -0.015 + Math.random() * 0.025,
      Solana: -0.02 + Math.random() * 0.03,
    };
    return variations[chain] || 0;
  }
}
