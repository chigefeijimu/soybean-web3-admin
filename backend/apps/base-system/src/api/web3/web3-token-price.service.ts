import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';

export interface PricePoint {
  timestamp: number;
  price: number;
  volume: number;
}

export interface TokenPriceHistory {
  symbol: string;
  name: string;
  prices: PricePoint[];
  priceChange24h: number;
  priceChangePercent24h: number;
  high24h: number;
  low24h: number;
  marketCap: number;
  volume24h: number;
}

@Injectable()
export class TokenPriceService {
  private readonly coingeckoBaseUrl = 'https://api.coingecko.com/api/v3';

  /**
   * Get historical price data for a token
   */
  async getTokenPriceHistory(
    coinId: string,
    days: number = 7
  ): Promise<TokenPriceHistory> {
    try {
      const url = `${this.coingeckoBaseUrl}/coins/${coinId}/market_chart`;
      const params = {
        vs_currency: 'usd',
        days: days,
        interval: days <= 1 ? 'hourly' : 'daily'
      };

      const response = await axios.get(url, { params });
      const data = response.data;

      const prices = data.prices.map((p: [number, number]) => ({
        timestamp: p[0],
        price: p[1],
        volume: 0
      }));

      // Add volume data
      if (data.total_volumes) {
        data.total_volumes.forEach((v: [number, number], i: number) => {
          if (prices[i]) {
            prices[i].volume = v[1];
          }
        });
      }

      // Calculate 24h changes
      const latestPrice = prices[prices.length - 1]?.price || 0;
      const price24hAgo = prices[prices.length - 2]?.price || prices[0]?.price || 0;
      const priceChange = latestPrice - price24hAgo;
      const priceChangePercent = price24hAgo > 0 ? (priceChange / price24hAgo) * 100 : 0;

      // Get current market data
      const marketData = await this.getCoinMarketData(coinId);

      return {
        symbol: coinId.toUpperCase(),
        name: coinId,
        prices,
        priceChange24h: priceChange,
        priceChangePercent24h: priceChangePercent,
        high24h: marketData?.high_24h || latestPrice,
        low24h: marketData?.low_24h || latestPrice,
        marketCap: marketData?.market_cap || 0,
        volume24h: marketData?.total_volume || 0
      };
    } catch (error: any) {
      console.error('Error fetching token price history:', error.message);
      throw new HttpException(
        `Failed to fetch price history: ${error.message}`,
        HttpStatus.BAD_GATEWAY
      );
    }
  }

  /**
   * Get current market data for a coin
   */
  async getCoinMarketData(coinId: string): Promise<any> {
    try {
      const url = `${this.coingeckoBaseUrl}/coins/${coinId}`;
      const response = await axios.get(url, {
        params: { localization: false, tickers: false, community_data: false, developer_data: false }
      });
      return response.data.market_data;
    } catch (error) {
      console.error('Error fetching market data:', error);
      return null;
    }
  }

  /**
   * Search for coins by query
   */
  async searchCoins(query: string): Promise<any[]> {
    try {
      const url = `${this.coingeckoBaseUrl}/search`;
      const response = await axios.get(url, { params: { query } });
      return response.data.coins?.slice(0, 10) || [];
    } catch (error) {
      console.error('Error searching coins:', error);
      return [];
    }
  }

  /**
   * Get top coins by market cap
   */
  async getTopCoins(limit: number = 50): Promise<any[]> {
    try {
      const url = `${this.coingeckoBaseUrl}/coins/markets`;
      const response = await axios.get(url, {
        params: {
          vs_currency: 'usd',
          order: 'market_cap_desc',
          per_page: limit,
          page: 1,
          sparkline: false
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching top coins:', error);
      return [];
    }
  }

  /**
   * Get multiple coins price data
   */
  async getMultiplePrices(coinIds: string[]): Promise<any> {
    try {
      const url = `${this.coingeckoBaseUrl}/simple/price`;
      const response = await axios.get(url, {
        params: {
          ids: coinIds.join(','),
          vs_currencies: 'usd',
          include_24hr_change: true,
          include_market_cap: true
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching multiple prices:', error);
      return {};
    }
  }

  /**
   * Get trending coins
   */
  async getTrendingCoins(): Promise<any[]> {
    try {
      const url = `${this.coingeckoBaseUrl}/search/trending`;
      const response = await axios.get(url);
      return response.data.coins || [];
    } catch (error) {
      console.error('Error fetching trending:', error);
      return [];
    }
  }
}
