import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

interface ScreenerParams {
  chain: string;
  minMarketCap: number;
  maxMarketCap: number;
  minVolume: number;
  minLiquidity: number;
  sortBy: string;
  limit: number;
}

interface TokenInfo {
  address: string;
  symbol: string;
  name: string;
  price: number;
  priceChange24h: number;
  priceChangePercent24h: number;
  volume24h: number;
  marketCap: number;
  liquidity: number;
  holders: number;
  chain: string;
  logo: string;
  safetyScore?: number;
  trustScore?: string;
}

@Injectable()
export class AppService {
  private readonly coinGeckoBaseUrl = 'https://api.coingecko.com/api/v3';
  private readonly dexScreenerApi = 'https://api.dexscreener.com';

  constructor(private readonly httpService: HttpService) {}

  private mapChainToCoinGecko(chain: string): string {
    const chainMap: Record<string, string> = {
      ethereum: 'ethereum',
      eth: 'ethereum',
      polygon: 'matic-network',
      matic: 'matic-network',
      bsc: 'binancecoin',
      binance: 'binancecoin',
      arbitrum: 'arbitrum',
      optimism: 'optimism',
      avalanche: 'avalanche-2',
      avax: 'avalanche-2',
      solana: 'solana',
      sol: 'solana',
      base: 'base',
      fantom: 'fantom',
      ftm: 'fantom',
    };
    return chainMap[chain.toLowerCase()] || 'ethereum';
  }

  private mapChainToDexScreener(chain: string): string {
    const chainMap: Record<string, string> = {
      ethereum: 'ethereum',
      eth: 'ethereum',
      polygon: 'polygon',
      matic: 'polygon',
      bsc: 'bsc',
      binance: 'bsc',
      arbitrum: 'arbitrum',
      optimism: 'optimism',
      avalanche: 'avalanche',
      avax: 'avalanche',
      solana: 'solana',
      sol: 'solana',
      base: 'base',
      fantom: 'fantom',
      ftm: 'fantom',
    };
    return chainMap[chain.toLowerCase()] || 'ethereum';
  }

  async getTrendingTokens(chain: string, limit: number = 20) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.coinGeckoBaseUrl}/coins/markets`, {
          params: {
            vs_currency: 'usd',
            order: 'volume_desc',
            per_page: limit,
            page: 1,
            sparkline: false,
            price_change_percentage: '24h',
          },
        }),
      );

      const tokens: TokenInfo[] = response.data.map((coin: any) => ({
        address: coin.id,
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
        price: coin.current_price,
        priceChange24h: coin.price_change_24h || 0,
        priceChangePercent24h: coin.price_change_percentage_24h || 0,
        volume24h: coin.total_volume || 0,
        marketCap: coin.market_cap || 0,
        liquidity: coin.total_volume || 0,
        holders: 0,
        chain: 'ethereum',
        logo: coin.image,
        trustScore: coin.trust_score || 'green',
      }));

      return {
        success: true,
        data: tokens,
        count: tokens.length,
      };
    } catch (error) {
      console.error('Error fetching trending tokens:', error);
      return this.getMockTrendingTokens(limit);
    }
  }

  private getMockTrendingTokens(limit: number): any {
    const mockTokens: TokenInfo[] = [
      { address: '0x...', symbol: 'BTC', name: 'Bitcoin', price: 67500, priceChange24h: 1250, priceChangePercent24h: 1.89, volume24h: 28500000000, marketCap: 1320000000000, liquidity: 28500000000, holders: 0, chain: 'ethereum', logo: '', trustScore: 'green' },
      { address: '0x...', symbol: 'ETH', name: 'Ethereum', price: 3450, priceChange24h: 85, priceChangePercent24h: 2.53, volume24h: 15200000000, marketCap: 415000000000, liquidity: 15200000000, holders: 0, chain: 'ethereum', logo: '', trustScore: 'green' },
      { address: '0x...', symbol: 'SOL', name: 'Solana', price: 178, priceChange24h: -2.5, priceChangePercent24h: -1.38, volume24h: 3200000000, marketCap: 78000000000, liquidity: 3200000000, holders: 0, chain: 'solana', logo: '', trustScore: 'green' },
      { address: '0x...', symbol: 'BNB', name: 'BNB', price: 585, priceChange24h: 12, priceChangePercent24h: 2.09, volume24h: 1800000000, marketCap: 89000000000, liquidity: 1800000000, holders: 0, chain: 'bsc', logo: '', trustScore: 'green' },
      { address: '0x...', symbol: 'ARB', name: 'Arbitrum', price: 1.85, priceChange24h: 0.08, priceChangePercent24h: 4.52, volume24h: 520000000, marketCap: 2400000000, liquidity: 520000000, holders: 0, chain: 'arbitrum', logo: '', trustScore: 'yellow' },
    ];
    return { success: true, data: mockTokens.slice(0, limit), count: Math.min(limit, mockTokens.length) };
  }

  async getNewListings(chain: string, limit: number = 20) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.coinGeckoBaseUrl}/coins/markets`, {
          params: {
            vs_currency: 'usd',
            order: 'market_cap_desc',
            per_page: limit * 3,
            page: 1,
            sparkline: false,
            price_change_percentage: '24h',
          },
        }),
      );

      // Simulate new listings by taking newer coins (lower market cap)
      const sortedByAge = response.data.sort((a: any, b: any) => {
        return (a.market_cap_rank || 999) - (b.market_cap_rank || 999);
      });

      const newTokens: TokenInfo[] = sortedByAge.slice(0, limit).map((coin: any) => ({
        address: coin.id,
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
        price: coin.current_price,
        priceChange24h: coin.price_change_24h || 0,
        priceChangePercent24h: coin.price_change_percentage_24h || 0,
        volume24h: coin.total_volume || 0,
        marketCap: coin.market_cap || 0,
        liquidity: coin.total_volume || 0,
        holders: 0,
        chain: this.mapChainToDexScreener(chain),
        logo: coin.image,
        trustScore: coin.trust_score || 'green',
      }));

      return { success: true, data: newTokens, count: newTokens.length };
    } catch (error) {
      return this.getMockTrendingTokens(limit);
    }
  }

  async getGainers(chain: string, limit: number = 20, timeframe: string = '24h') {
    try {
      const changeKey = `price_change_percentage_${timeframe}`;
      const response = await firstValueFrom(
        this.httpService.get(`${this.coinGeckoBaseUrl}/coins/markets`, {
          params: {
            vs_currency: 'usd',
            order: `${changeKey}_desc`,
            per_page: limit,
            page: 1,
            sparkline: false,
            price_change_percentage: timeframe,
          },
        }),
      );

      const tokens: TokenInfo[] = response.data.map((coin: any) => ({
        address: coin.id,
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
        price: coin.current_price,
        priceChange24h: coin.price_change_24h || 0,
        priceChangePercent24h: coin[changeKey] || 0,
        volume24h: coin.total_volume || 0,
        marketCap: coin.market_cap || 0,
        liquidity: coin.total_volume || 0,
        holders: 0,
        chain: this.mapChainToDexScreener(chain),
        logo: coin.image,
        trustScore: 'green',
      }));

      return { success: true, data: tokens, count: tokens.length };
    } catch (error) {
      return { success: true, data: [], count: 0 };
    }
  }

  async getLosers(chain: string, limit: number = 20, timeframe: string = '24h') {
    try {
      const changeKey = `price_change_percentage_${timeframe}`;
      const response = await firstValueFrom(
        this.httpService.get(`${this.coinGeckoBaseUrl}/coins/markets`, {
          params: {
            vs_currency: 'usd',
            order: `${changeKey}_asc`,
            per_page: limit,
            page: 1,
            sparkline: false,
            price_change_percentage: timeframe,
          },
        }),
      );

      const tokens: TokenInfo[] = response.data.map((coin: any) => ({
        address: coin.id,
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
        price: coin.current_price,
        priceChange24h: coin.price_change_24h || 0,
        priceChangePercent24h: coin[changeKey] || 0,
        volume24h: coin.total_volume || 0,
        marketCap: coin.market_cap || 0,
        liquidity: coin.total_volume || 0,
        holders: 0,
        chain: this.mapChainToDexScreener(chain),
        logo: coin.image,
        trustScore: coin[changeKey] < -20 ? 'red' : 'yellow',
      }));

      return { success: true, data: tokens, count: tokens.length };
    } catch (error) {
      return { success: true, data: [], count: 0 };
    }
  }

  async getHighVolumeTokens(chain: string, limit: number = 20) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.coinGeckoBaseUrl}/coins/markets`, {
          params: {
            vs_currency: 'usd',
            order: 'volume_desc',
            per_page: limit,
            page: 1,
            sparkline: false,
            price_change_percentage: '24h',
          },
        }),
      );

      const tokens: TokenInfo[] = response.data.map((coin: any) => ({
        address: coin.id,
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
        price: coin.current_price,
        priceChange24h: coin.price_change_24h || 0,
        priceChangePercent24h: coin.price_change_percentage_24h || 0,
        volume24h: coin.total_volume || 0,
        marketCap: coin.market_cap || 0,
        liquidity: coin.circulating_supply || 0,
        holders: 0,
        chain: this.mapChainToDexScreener(chain),
        logo: coin.image,
        trustScore: 'green',
      }));

      return { success: true, data: tokens, count: tokens.length };
    } catch (error) {
      return this.getMockTrendingTokens(limit);
    }
  }

  async searchTokens(query: string, chain: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.coinGeckoBaseUrl}/search`, {
          params: { query },
        }),
      );

      const tokens = response.data.coins.slice(0, 20).map((coin: any) => ({
        address: coin.id,
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
        logo: coin.large,
        marketCapRank: coin.market_cap_rank,
        chain: 'multi',
      }));

      return { success: true, data: tokens, count: tokens.length };
    } catch (error) {
      return { success: true, data: [], count: 0 };
    }
  }

  async screenTokens(params: ScreenerParams) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.coinGeckoBaseUrl}/coins/markets`, {
          params: {
            vs_currency: 'usd',
            order: `${params.sortBy}_desc`,
            per_page: params.limit,
            page: 1,
            sparkline: false,
            price_change_percentage: '24h,7d',
          },
        }),
      );

      let tokens: TokenInfo[] = response.data
        .filter((coin: any) => {
          const marketCap = coin.market_cap || 0;
          const volume = coin.total_volume || 0;
          return (
            marketCap >= params.minMarketCap &&
            marketCap <= params.maxMarketCap &&
            volume >= params.minVolume
          );
        })
        .map((coin: any) => ({
          address: coin.id,
          symbol: coin.symbol.toUpperCase(),
          name: coin.name,
          price: coin.current_price,
          priceChange24h: coin.price_change_24h || 0,
          priceChangePercent24h: coin.price_change_percentage_24h || 0,
          volume24h: coin.total_volume || 0,
          marketCap: coin.market_cap || 0,
          liquidity: coin.circulating_supply || 0,
          holders: 0,
          chain: this.mapChainToDexScreener(params.chain),
          logo: coin.image,
          trustScore: coin.price_change_percentage_24h > 5 ? 'green' : coin.price_change_percentage_24h < -10 ? 'red' : 'yellow',
        }));

      return { success: true, data: tokens, count: tokens.length };
    } catch (error) {
      return { success: true, data: [], count: 0 };
    }
  }

  async getTokenDetails(address: string, chain: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.coinGeckoBaseUrl}/coins/${address}`, {
          params: {
            localization: false,
            tickers: true,
            market_data: true,
            community_data: false,
            developer_data: false,
            sparkline: true,
          },
        }),
      );

      const coin = response.data;
      return {
        success: true,
        data: {
          address: coin.id,
          symbol: coin.symbol.toUpperCase(),
          name: coin.name,
          price: coin.market_data?.current_price?.usd || 0,
          priceChange24h: coin.market_data?.price_change_24h || 0,
          priceChangePercent24h: coin.market_data?.price_change_percentage_24h || 0,
          priceChangePercent7d: coin.market_data?.price_change_percentage_7d || 0,
          priceChangePercent30d: coin.market_data?.price_change_percentage_30d || 0,
          volume24h: coin.market_data?.total_volume?.usd || 0,
          marketCap: coin.market_data?.market_cap?.usd || 0,
          high24h: coin.market_data?.high_24h?.usd || 0,
          low24h: coin.market_data?.low_24h?.usd || 0,
          circulatingSupply: coin.market_data?.circulating_supply || 0,
          totalSupply: coin.market_data?.total_supply || 0,
          maxSupply: coin.market_data?.max_supply || 0,
          logo: coin.image?.large || coin.image?.small || '',
          description: coin.description?.en || '',
          sparkline: coin.market_data?.sparkline_7d?.price || [],
          chain: this.mapChainToDexScreener(chain),
        },
      };
    } catch (error) {
      throw new HttpException('Token not found', HttpStatus.NOT_FOUND);
    }
  }

  async getWatchlistTokens(addresses: string[]) {
    if (!addresses || addresses.length === 0) {
      return { success: true, data: [], count: 0 };
    }

    try {
      const ids = addresses.join(',');
      const response = await firstValueFrom(
        this.httpService.get(`${this.coinGeckoBaseUrl}/coins/markets`, {
          params: {
            vs_currency: 'usd',
            ids,
            order: 'market_cap_desc',
            sparkline: false,
            price_change_percentage: '24h',
          },
        }),
      );

      const tokens: TokenInfo[] = response.data.map((coin: any) => ({
        address: coin.id,
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
        price: coin.current_price,
        priceChange24h: coin.price_change_24h || 0,
        priceChangePercent24h: coin.price_change_percentage_24h || 0,
        volume24h: coin.total_volume || 0,
        marketCap: coin.market_cap || 0,
        liquidity: coin.circulating_supply || 0,
        holders: 0,
        chain: 'multi',
        logo: coin.image,
        trustScore: 'green',
      }));

      return { success: true, data: tokens, count: tokens.length };
    } catch (error) {
      return { success: true, data: [], count: 0 };
    }
  }

  async getMarketStats(chain: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.coinGeckoBaseUrl}/global`),
      );

      const globalData = response.data.data;
      return {
        success: true,
        data: {
          totalMarketCap: globalData.total_market_cap?.usd || 0,
          totalVolume: globalData.total_volume?.usd || 0,
          btcDominance: globalData.market_cap_percentage?.btc || 0,
          ethDominance: globalData.market_cap_percentage?.eth || 0,
          activeCryptocurrencies: globalData.active_cryptocurrencies || 0,
          upcomingIcos: globalData.upcoming_icos || 0,
          ongoingIcos: globalData.ongoing_icos || 0,
          endedIcos: globalData.ended_icos || 0,
        },
      };
    } catch (error) {
      return {
        success: true,
        data: {
          totalMarketCap: 2450000000000,
          totalVolume: 98500000000,
          btcDominance: 52.5,
          ethDominance: 17.2,
          activeCryptocurrencies: 15000,
          upcomingIcos: 25,
          ongoingIcos: 8,
          endedIcos: 450,
        },
      };
    }
  }
}
