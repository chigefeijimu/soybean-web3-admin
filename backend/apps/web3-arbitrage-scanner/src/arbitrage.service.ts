import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

interface PriceData {
  exchange: string;
  pair: string;
  price: number;
  liquidity: number;
  timestamp: number;
}

interface ArbitrageOpportunity {
  id: string;
  token: string;
  buyExchange: string;
  sellExchange: string;
  buyPrice: number;
  sellPrice: number;
  priceDiff: number;
  priceDiffPercent: number;
  estimatedProfit: number;
  volume: number;
  risk: 'low' | 'medium' | 'high';
  timestamp: number;
}

@Injectable()
export class ArbitrageService {
  private readonly logger = new Logger(ArbitrageService.name);
  private readonly COINGECKO_API = 'https://api.coingecko.com/api/v3';
  private readonly UNISWAP_API = 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3';
  
  // Popular tokens to scan
  private readonly TOKENS = [
    { symbol: 'ETH', address: '0x0000000000000000000000000000000000000000', decimals: 18 },
    { symbol: 'USDC', address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', decimals: 6 },
    { symbol: 'USDT', address: '0xdac17f958d2ee523a2206206994597c13d831ec7', decimals: 6 },
    { symbol: 'WBTC', address: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599', decimals: 8 },
    { symbol: 'DAI', address: '0x6b175474e89094c44da98b954eedeac495271d0f', decimals: 18 },
  ];

  // Simulated DEX prices (in production, fetch from real APIs)
  private readonly DEX_PRICES: Record<string, Record<string, number>> = {
    'Uniswap V3': {
      'ETH': 3245.50,
      'USDC': 1.00,
      'USDT': 1.001,
      'WBTC': 67800.00,
      'DAI': 0.9995,
    },
    'Sushiswap': {
      'ETH': 3242.00,
      'USDC': 1.001,
      'USDT': 1.002,
      'WBTC': 67750.00,
      'DAI': 1.0005,
    },
    'Curve': {
      'ETH': 3240.00,
      'USDC': 1.0005,
      'USDT': 1.0,
      'WBTC': 67700.00,
      'DAI': 1.0,
    },
    'Balancer': {
      'ETH': 3248.00,
      'USDC': 0.999,
      'USDT': 1.001,
      'WBTC': 67850.00,
      'DAI': 0.999,
    },
    'Dexscreener': {
      'ETH': 3246.00,
      'USDC': 1.0,
      'USDT': 1.0,
      'WBTC': 67820.00,
      'DAI': 1.0,
    },
  };

  constructor(private readonly httpService: HttpService) {}

  async scanArbitrageOpportunities(
    minProfitPercent: number = 0.5,
    volumeThreshold: number = 10000,
  ): Promise<ArbitrageOpportunity[]> {
    const opportunities: ArbitrageOpportunity[] = [];
    const exchanges = Object.keys(this.DEX_PRICES);
    const tokens = Object.keys(this.DEX_PRICES[exchanges[0]]);

    for (const token of tokens) {
      // Compare prices across all exchange pairs
      for (let i = 0; i < exchanges.length; i++) {
        for (let j = 0; j < exchanges.length; j++) {
          if (i === j) continue;

          const buyExchange = exchanges[i];
          const sellExchange = exchanges[j];
          const buyPrice = this.DEX_PRICES[buyExchange][token];
          const sellPrice = this.DEX_PRICES[sellExchange][token];

          if (!buyPrice || !sellPrice) continue;

          const priceDiff = sellPrice - buyPrice;
          const priceDiffPercent = (priceDiff / buyPrice) * 100;
          const volume = this.estimateVolume(token, buyExchange);

          if (priceDiffPercent >= minProfitPercent && volume >= volumeThreshold) {
            const estimatedProfit = (priceDiff * volume) / 100;
            const risk = this.assessRisk(priceDiffPercent, volume);

            opportunities.push({
              id: `${token}-${buyExchange}-${sellExchange}-${Date.now()}`,
              token,
              buyExchange,
              sellExchange,
              buyPrice,
              sellPrice,
              priceDiff,
              priceDiffPercent,
              estimatedProfit,
              volume,
              risk,
              timestamp: Date.now(),
            });
          }
        }
      }
    }

    // Sort by profit potential
    return opportunities.sort((a, b) => b.estimatedProfit - a.estimatedProfit);
  }

  private estimateVolume(token: string, exchange: string): number {
    // Simulated volume data
    const baseVolumes: Record<string, number> = {
      'ETH': 50000000,
      'USDC': 100000000,
      'USDT': 80000000,
      'WBTC': 20000000,
      'DAI': 30000000,
    };

    const exchangeMultipliers: Record<string, number> = {
      'Uniswap V3': 1.5,
      'Sushiswap': 1.2,
      'Curve': 1.0,
      'Balancer': 0.8,
      'Dexscreener': 1.1,
    };

    return (baseVolumes[token] || 10000000) * (exchangeMultipliers[exchange] || 1);
  }

  private assessRisk(priceDiffPercent: number, volume: number): 'low' | 'medium' | 'high' {
    if (priceDiffPercent > 5 || volume > 50000000) return 'high';
    if (priceDiffPercent > 2 || volume > 20000000) return 'medium';
    return 'low';
  }

  async getExchangePrices(chainId: number = 1): Promise<PriceData[]> {
    const prices: PriceData[] = [];
    const exchanges = Object.keys(this.DEX_PRICES);
    const tokens = Object.keys(this.DEX_PRICES[exchanges[0]]);

    for (const exchange of exchanges) {
      for (const token of tokens) {
        prices.push({
          exchange,
          pair: `${token}/USD`,
          price: this.DEX_PRICES[exchange][token] || 0,
          liquidity: this.estimateVolume(token, exchange),
          timestamp: Date.now(),
        });
      }
    }

    return prices;
  }

  async getTokenPriceFromDEX(
    tokenAddress: string,
    chainId: number = 1,
  ): Promise<{ price: number; dex: string; liquidity: number }> {
    // Find token symbol from address
    const token = this.TOKENS.find(t => t.address.toLowerCase() === tokenAddress.toLowerCase());
    const symbol = token?.symbol || 'UNKNOWN';

    // Get best price across DEXs
    let bestPrice = 0;
    let bestDex = '';
    let bestLiquidity = 0;

    for (const [dex, prices] of Object.entries(this.DEX_PRICES)) {
      if (prices[symbol] && prices[symbol] > bestPrice) {
        bestPrice = prices[symbol];
        bestDex = dex;
        bestLiquidity = this.estimateVolume(symbol, dex);
      }
    }

    return { price: bestPrice, dex: bestDex, liquidity: bestLiquidity };
  }

  async getHistoricalArbitrageData(
    token: string,
    days: number = 7,
  ): Promise<{ date: string; avgProfit: number; opportunities: number }[]> {
    const data = [];
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;

    for (let i = 0; i < days; i++) {
      const date = new Date(now - i * dayMs);
      // Simulated historical data
      data.push({
        date: date.toISOString().split('T')[0],
        avgProfit: Math.random() * 500 + 100,
        opportunities: Math.floor(Math.random() * 50 + 10),
      });
    }

    return data;
  }

  async getMarketOverview(): Promise<{
    totalOpportunities: number;
    avgProfit: number;
    topTokens: { token: string; opportunities: number }[];
    byRisk: { low: number; medium: number; high: number };
  }> {
    const opportunities = await this.scanArbitrageOpportunities(0.1, 5000);
    
    const tokenCounts: Record<string, number> = {};
    const riskCounts = { low: 0, medium: 0, high: 0 };
    let totalProfit = 0;

    for (const opp of opportunities) {
      tokenCounts[opp.token] = (tokenCounts[opp.token] || 0) + 1;
      riskCounts[opp.risk]++;
      totalProfit += opp.estimatedProfit;
    }

    const topTokens = Object.entries(tokenCounts)
      .map(([token, count]) => ({ token, opportunities: count }))
      .sort((a, b) => b.opportunities - a.opportunities)
      .slice(0, 5);

    return {
      totalOpportunities: opportunities.length,
      avgProfit: opportunities.length > 0 ? totalProfit / opportunities.length : 0,
      topTokens,
      byRisk: riskCounts,
    };
  }
}
