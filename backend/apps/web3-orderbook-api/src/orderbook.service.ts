import { Injectable } from '@nestjs/common';
import axios from 'axios';

export interface OrderbookEntry {
  price: string;
  amount: string;
  total: string;
}

export interface OrderbookData {
  bids: OrderbookEntry[];
  asks: OrderbookEntry[];
  midPrice: string;
  spread: string;
  spreadPercent: string;
  timestamp: number;
}

export interface MarketDepthData {
  bids: { price: string; amount: string; cumulative: string }[];
  asks: { price: string; amount: string; cumulative: string }[];
  totalBidDepth: string;
  totalAskDepth: string;
  imbalance: string;
  midPrice: string;
}

export interface OrderbookHistoryData {
  time: string;
  midPrice: string;
  bidDepth: string;
  askDepth: string;
  spread: string;
}

interface TokenPair {
  baseToken: string;
  quoteToken: string;
  dex: string;
  chain: string;
}

@Injectable()
export class OrderbookService {
  // Mock DEX endpoints (in production, these would be real API calls)
  private readonly dexEndpoints: Record<string, string> = {
    uniswap: 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3',
    sushiswap: 'https://api.thegraph.com/subgraphs/name/sushi-v3/v3-',
  };

  // Token addresses on different chains (simplified)
  private readonly tokenAddresses: Record<string, Record<string, string>> = {
    ethereum: {
      'WETH': '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
      'ETH': '0x0000000000000000000000000000000000000000',
      'USDC': '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      'USDT': '0xdac17f958d2ee523a2206206994597c13d831ec7',
      'WBTC': '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
    },
    arbitrum: {
      'WETH': '0x82af49447d8a07e3bd95bd0d56f35241523fbab1',
      'ETH': '0x0000000000000000000000000000000000000000',
      'USDC': '0xaf88d065e77c8cc2239327c5edb3a43126898413',
      'USDT': '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9',
      'WBTC': '0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f',
    },
    optimism: {
      'WETH': '0x4200000000000000000000000000000000000006',
      'ETH': '0x0000000000000000000000000000000000000000',
      'USDC': '0x0b2c639c533813f4aa9d7837c72762694e56dce1',
      'USDT': '0x94b008aa00579c1307b0ef2c499ad98a8ce58ed4',
      'WBTC': '0x68f180fcce6836688e9084f035309e29bf0a2095',
    },
  };

  async getOrderbook(token: string, quote: string, chain: string = 'ethereum', limit: number = 20): Promise<OrderbookData> {
    const chainId = this.getChainId(chain);
    
    // Generate realistic orderbook data based on current market conditions
    const basePrice = await this.getBasePrice(token, quote, chain);
    const volatility = this.getVolatility(token);
    
    const bids: OrderbookEntry[] = [];
    const asks: OrderbookEntry[] = [];
    
    let currentBidPrice = parseFloat(basePrice) * (1 - 0.001);
    let currentAskPrice = parseFloat(basePrice) * (1 + 0.001);
    
    // Generate bid orders (below mid price)
    for (let i = 0; i < limit; i++) {
      const spread = (Math.random() * 0.0005 + 0.0001) * parseFloat(basePrice);
      currentBidPrice -= spread;
      
      const amount = (Math.random() * 10 + 0.1).toFixed(4);
      const total = (parseFloat(amount) * currentBidPrice).toFixed(2);
      
      bids.push({
        price: currentBidPrice.toFixed(2),
        amount,
        total,
      });
    }
    
    // Generate ask orders (above mid price)
    for (let i = 0; i < limit; i++) {
      const spread = (Math.random() * 0.0005 + 0.0001) * parseFloat(basePrice);
      currentAskPrice += spread;
      
      const amount = (Math.random() * 10 + 0.1).toFixed(4);
      const total = (parseFloat(amount) * currentAskPrice).toFixed(2);
      
      asks.push({
        price: currentAskPrice.toFixed(2),
        amount,
        total,
      });
    }
    
    const midPrice = ((parseFloat(bids[0].price) + parseFloat(asks[0].price)) / 2).toFixed(2);
    const spread = (parseFloat(asks[0].price) - parseFloat(bids[0].price)).toFixed(4);
    const spreadPercent = ((parseFloat(spread) / parseFloat(midPrice)) * 100).toFixed(4);
    
    return {
      bids,
      asks,
      midPrice,
      spread,
      spreadPercent,
      timestamp: Date.now(),
    };
  }

  async getMarketDepth(token: string, quote: string, chain: string = 'ethereum', depthPercent: number = 5): Promise<MarketDepthData> {
    const basePrice = await this.getBasePrice(token, quote, chain);
    
    const midPrice = parseFloat(basePrice);
    const depthRange = midPrice * (depthPercent / 100);
    
    const bids: { price: string; amount: string; cumulative: string }[] = [];
    const asks: { price: string; amount: string; cumulative: string }[] = [];
    
    // Generate bids within depth range
    let bidCumulative = 0;
    let bidPrice = midPrice * (1 - 0.001);
    const bidStep = depthRange / 20;
    
    for (let i = 0; i < 20; i++) {
      bidPrice -= bidStep * (1 - Math.random() * 0.3);
      const amount = (Math.random() * 50 + 5).toFixed(4);
      bidCumulative += parseFloat(amount);
      
      bids.push({
        price: bidPrice.toFixed(2),
        amount,
        cumulative: bidCumulative.toFixed(4),
      });
    }
    
    // Generate asks within depth range
    let askCumulative = 0;
    let askPrice = midPrice * (1 + 0.001);
    const askStep = depthRange / 20;
    
    for (let i = 0; i < 20; i++) {
      askPrice += askStep * (1 - Math.random() * 0.3);
      const amount = (Math.random() * 50 + 5).toFixed(4);
      askCumulative += parseFloat(amount);
      
      asks.push({
        price: askPrice.toFixed(2),
        amount,
        cumulative: askCumulative.toFixed(4),
      });
    }
    
    const totalBidDepth = bidCumulative.toFixed(4);
    const totalAskDepth = askCumulative.toFixed(4);
    const imbalance = ((bidCumulative - askCumulative) / (bidCumulative + askCumulative) * 100).toFixed(2);
    
    return {
      bids,
      asks,
      totalBidDepth,
      totalAskDepth,
      imbalance,
      midPrice: midPrice.toFixed(2),
    };
  }

  async getOrderbookHistory(token: string, quote: string, chain: string = 'ethereum', timeframe: string = '1h'): Promise<OrderbookHistoryData[]> {
    const dataPoints = timeframe === '15m' ? 15 : timeframe === '1h' ? 60 : timeframe === '4h' ? 48 : 24;
    const basePrice = await this.getBasePrice(token, quote, chain);
    const midPrice = parseFloat(basePrice);
    
    const history: OrderbookHistoryData[] = [];
    const now = Date.now();
    const interval = timeframe === '15m' ? 15 * 60 * 1000 : timeframe === '1h' ? 60 * 60 * 1000 : timeframe === '4h' ? 4 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
    
    for (let i = dataPoints; i >= 0; i--) {
      const time = new Date(now - i * interval).toISOString();
      const priceVariation = (Math.random() - 0.5) * midPrice * 0.02;
      const price = (midPrice + priceVariation).toFixed(2);
      
      const bidDepth = (Math.random() * 500 + 200).toFixed(2);
      const askDepth = (Math.random() * 500 + 200).toFixed(2);
      const spread = (parseFloat(askDepth) > 0 ? (parseFloat(bidDepth) / parseFloat(askDepth) * 0.1) : 0.05).toFixed(4);
      
      history.push({
        time,
        midPrice: price,
        bidDepth,
        askDepth,
        spread,
      });
    }
    
    return history;
  }

  async getSupportedPairs(): Promise<{ token: string; quote: string; chain: string; dex: string }[]> {
    return [
      { token: 'ETH', quote: 'USDC', chain: 'ethereum', dex: 'Uniswap V3' },
      { token: 'ETH', quote: 'USDT', chain: 'ethereum', dex: 'Uniswap V3' },
      { token: 'WBTC', quote: 'USDC', chain: 'ethereum', dex: 'Uniswap V3' },
      { token: 'WETH', quote: 'USDC', chain: 'arbitrum', dex: 'Uniswap V3' },
      { token: 'WETH', quote: 'USDC', chain: 'optimism', dex: 'Uniswap V3' },
      { token: 'WETH', quote: 'USDC', chain: 'polygon', dex: 'QuickSwap' },
      { token: 'WETH', quote: 'USDC', chain: 'bsc', dex: 'PancakeSwap' },
      { token: 'WETH', quote: 'USDC', chain: 'base', dex: 'BaseSwap' },
      { token: 'WETH', quote: 'USDC', chain: 'avalanche', dex: 'Trader Joe' },
    ];
  }

  private async getBasePrice(token: string, quote: string, chain: string): Promise<string> {
    // Simulated prices - in production, fetch from price APIs
    const prices: Record<string, number> = {
      'ETH-USDC': 2450.00,
      'ETH-USDT': 2448.00,
      'WBTC-USDC': 43500.00,
      'WETH-USDC': 2450.00,
      'ETH-USDC:arbitrum': 2449.00,
      'ETH-USDC:optimism': 2451.00,
      'ETH-USDC:polygon': 2448.50,
      'ETH-USDC:bsc': 2447.00,
      'ETH-USDC:base': 2450.50,
      'ETH-USDC:avalanche': 2449.50,
    };
    
    const key = `${token}-${quote}:${chain}`;
    return (prices[key] || prices[`${token}-${quote}`] || 2500).toFixed(2);
  }

  private getVolatility(token: string): number {
    const volatility: Record<string, number> = {
      'ETH': 0.02,
      'WBTC': 0.015,
      'WETH': 0.02,
    };
    return volatility[token] || 0.02;
  }

  private getChainId(chain: string): number {
    const chainIds: Record<string, number> = {
      'ethereum': 1,
      'arbitrum': 42161,
      'optimism': 10,
      'polygon': 137,
      'bsc': 56,
      'base': 8453,
      'avalanche': 43114,
    };
    return chainIds[chain] || 1;
  }
}
