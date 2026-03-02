import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

interface PricePoint {
  timestamp: number;
  price: number;
  volume: number;
  marketCap?: number;
}

interface TechnicalIndicator {
  timestamp: number;
  value: number;
}

interface TokenInfo {
  id: string;
  symbol: string;
  name: string;
  currentPrice: number;
  priceChange24h: number;
  priceChangePercent24h: number;
  marketCap: number;
  volume24h: number;
  high24h: number;
  low24h: number;
}

@Injectable()
export class TokenHistoryService {
  private readonly coingeckoBaseUrl = 'https://api.coingecko.com/api/v3';
  private readonly supportedChains = ['ethereum', 'bsc', 'polygon', 'arbitrum', 'optimism', 'avalanche', 'base', 'solana'];

  constructor(private readonly httpService: HttpService) {}

  /**
   * Get historical price data for a token
   */
  async getPriceHistory(
    tokenId: string,
    days: number = 30,
    currency: string = 'usd',
  ): Promise<PricePoint[]> {
    try {
      const url = `${this.coingeckoBaseUrl}/coins/${tokenId}/market_chart`;
      const response = await firstValueFrom(
        this.httpService.get(url, {
          params: {
            vs_currency: currency,
            days: days,
          },
        }),
      );

      const prices = response.data.prices || [];
      return prices.map(([timestamp, price]: [number, number]) => ({
        timestamp,
        price,
        volume: response.data.total_volumes?.find(
          (v: [number, number]) => v[0] === timestamp,
        )?.[1] || 0,
        marketCap: response.data.market_caps?.find(
          (v: [number, number]) => v[0] === timestamp,
        )?.[1] || 0,
      }));
    } catch (error) {
      throw new HttpException(
        `Failed to fetch price history for ${tokenId}: ${error.message}`,
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  /**
   * Get multiple tokens price history in batch
   */
  async getBatchPriceHistory(
    tokenIds: string[],
    days: number = 7,
    currency: string = 'usd',
  ): Promise<Record<string, PricePoint[]>> {
    const results: Record<string, PricePoint[]> = {};
    
    for (const tokenId of tokenIds.slice(0, 10)) {
      try {
        results[tokenId] = await this.getPriceHistory(tokenId, days, currency);
      } catch {
        results[tokenId] = [];
      }
    }
    
    return results;
  }

  /**
   * Calculate technical indicators from price history
   */
  calculateSMA(prices: number[], period: number): TechnicalIndicator[] {
    const sma: TechnicalIndicator[] = [];
    for (let i = period - 1; i < prices.length; i++) {
      const sum = prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      sma.push({
        timestamp: i,
        value: sum / period,
      });
    }
    return sma;
  }

  calculateEMA(prices: number[], period: number): TechnicalIndicator[] {
    const ema: TechnicalIndicator[] = [];
    const multiplier = 2 / (period + 1);
    let previousEma = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;
    
    ema.push({ timestamp: period - 1, value: previousEma });
    
    for (let i = period; i < prices.length; i++) {
      const currentEma = (prices[i] - previousEma) * multiplier + previousEma;
      ema.push({ timestamp: i, value: currentEma });
      previousEma = currentEma;
    }
    
    return ema;
  }

  calculateRSI(prices: number[], period: number = 14): TechnicalIndicator[] {
    const rsi: TechnicalIndicator[] = [];
    const changes: number[] = [];
    
    for (let i = 1; i < prices.length; i++) {
      changes.push(prices[i] - prices[i - 1]);
    }
    
    for (let i = period; i < changes.length; i++) {
      const periodChanges = changes.slice(i - period, i);
      const gains = periodChanges.filter(c => c > 0);
      const losses = periodChanges.filter(c => c < 0).map(c => Math.abs(c));
      
      const avgGain = gains.length > 0 ? gains.reduce((a, b) => a + b, 0) / period : 0;
      const avgLoss = losses.length > 0 ? losses.reduce((a, b) => a + b, 0) / period : 0;
      
      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      const rsiValue = 100 - (100 / (1 + rs));
      
      rsi.push({ timestamp: i + 1, value: rsiValue });
    }
    
    return rsi;
  }

  calculateMACD(
    prices: number[],
    fastPeriod: number = 12,
    slowPeriod: number = 26,
    signalPeriod: number = 9,
  ): { macd: TechnicalIndicator[]; signal: TechnicalIndicator[]; histogram: TechnicalIndicator[] } {
    const fastEMA = this.calculateEMA(prices, fastPeriod);
    const slowEMA = this.calculateEMA(prices, slowPeriod);
    
    const macdLine: TechnicalIndicator[] = [];
    const signalLine: TechnicalIndicator[] = [];
    const histogram: TechnicalIndicator[] = [];
    
    const startIdx = slowPeriod - 1;
    for (let i = startIdx; i < prices.length; i++) {
      const fastValue = fastEMA.find(e => e.timestamp === i)?.value || 0;
      const slowValue = slowEMA.find(e => e.timestamp === i)?.value || 0;
      const macdValue = fastValue - slowValue;
      macdLine.push({ timestamp: i, value: macdValue });
    }
    
    // Calculate signal line (EMA of MACD)
    const macdValues = macdLine.map(m => m.value);
    if (macdValues.length >= signalPeriod) {
      const signalEMA = this.calculateEMA(macdValues, signalPeriod);
      for (let i = 0; i < macdLine.length; i++) {
        const signalValue = signalEMA.find(s => s.timestamp === i)?.value || 0;
        signalLine.push({ timestamp: macdLine[i].timestamp, value: signalValue });
        histogram.push({
          timestamp: macdLine[i].timestamp,
          value: macdLine[i].value - signalValue,
        });
      }
    }
    
    return { macd: macdLine, signal: signalLine, histogram };
  }

  calculateBollingerBands(
    prices: number[],
    period: number = 20,
    stdDev: number = 2,
  ): { upper: TechnicalIndicator[]; middle: TechnicalIndicator[]; lower: TechnicalIndicator[] } {
    const upper: TechnicalIndicator[] = [];
    const middle: TechnicalIndicator[] = [];
    const lower: TechnicalIndicator[] = [];
    
    for (let i = period - 1; i < prices.length; i++) {
      const slice = prices.slice(i - period + 1, i + 1);
      const sma = slice.reduce((a, b) => a + b, 0) / period;
      
      const variance = slice.reduce((sum, price) => sum + Math.pow(price - sma, 2), 0) / period;
      const standardDeviation = Math.sqrt(variance);
      
      middle.push({ timestamp: i, value: sma });
      upper.push({ timestamp: i, value: sma + stdDev * standardDeviation });
      lower.push({ timestamp: i, value: sma - stdDev * standardDeviation });
    }
    
    return { upper, middle, lower };
  }

  /**
   * Get token info and current price
   */
  async getTokenInfo(tokenId: string, currency: string = 'usd'): Promise<TokenInfo> {
    try {
      const url = `${this.coingeckoBaseUrl}/coins/${tokenId}`;
      const response = await firstValueFrom(
        this.httpService.get(url, {
          params: {
            localization: false,
            tickers: false,
            market_data: true,
            community_data: false,
            developer_data: false,
            sparkline: false,
          },
        }),
      );

      const data = response.data;
      const marketData = data.market_data || {};
      
      return {
        id: data.id,
        symbol: data.symbol,
        name: data.name,
        currentPrice: marketData.current_price?.[currency] || 0,
        priceChange24h: marketData.price_change_24h || 0,
        priceChangePercent24h: marketData.price_change_percentage_24h || 0,
        marketCap: marketData.market_cap?.[currency] || 0,
        volume24h: marketData.total_volume?.[currency] || 0,
        high24h: marketData.high_24h?.[currency] || 0,
        low24h: marketData.low_24h?.[currency] || 0,
      };
    } catch (error) {
      throw new HttpException(
        `Failed to fetch token info for ${tokenId}: ${error.message}`,
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  /**
   * Get historical OHLC data
   */
  async getOHLCData(
    tokenId: string,
    days: number = 30,
    currency: string = 'usd',
  ): Promise<{ timestamp: number; open: number; high: number; low: number; close: number }[]> {
    try {
      const url = `${this.coingeckoBaseUrl}/coins/${tokenId}/ohlc`;
      const response = await firstValueFrom(
        this.httpService.get(url, {
          params: {
            vs_currency: currency,
            days: days,
          },
        }),
      );

      return (response.data || []).map(([timestamp, open, high, low, close]: number[]) => ({
        timestamp,
        open,
        high,
        low,
        close,
      }));
    } catch (error) {
      throw new HttpException(
        `Failed to fetch OHLC data for ${tokenId}: ${error.message}`,
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  /**
   * Get market data for multiple tokens
   */
  async getMarketData(
    tokenIds: string[],
    currency: string = 'usd',
    order: string = 'market_cap_desc',
    perPage: number = 100,
    page: number = 1,
  ): Promise<TokenInfo[]> {
    try {
      const url = `${this.coingeckoBaseUrl}/coins/markets`;
      const response = await firstValueFrom(
        this.httpService.get(url, {
          params: {
            vs_currency: currency,
            ids: tokenIds.join(','),
            order,
            per_page: perPage,
            page,
            sparkline: false,
          },
        }),
      );

      return (response.data || []).map((coin: any) => ({
        id: coin.id,
        symbol: coin.symbol,
        name: coin.name,
        currentPrice: coin.current_price || 0,
        priceChange24h: coin.price_change_24h || 0,
        priceChangePercent24h: coin.price_change_percentage_24h || 0,
        marketCap: coin.market_cap || 0,
        volume24h: coin.total_volume || 0,
        high24h: coin.high_24h || 0,
        low24h: coin.low_24h || 0,
      }));
    } catch (error) {
      throw new HttpException(
        `Failed to fetch market data: ${error.message}`,
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  /**
   * Get supported chains list
   */
  getSupportedChains(): string[] {
    return this.supportedChains;
  }

  /**
   * Search tokens by query
   */
  async searchTokens(query: string): Promise<{ id: string; name: string; symbol: string; thumb: string }[]> {
    try {
      const url = `${this.coingeckoBaseUrl}/search`;
      const response = await firstValueFrom(
        this.httpService.get(url, {
          params: { query },
        }),
      );

      return (response.data.coins || []).slice(0, 20).map((coin: any) => ({
        id: coin.id,
        name: coin.name,
        symbol: coin.symbol,
        thumb: coin.thumb,
      }));
    } catch (error) {
      throw new HttpException(
        `Failed to search tokens: ${error.message}`,
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  /**
   * Get global market data
   */
  async getGlobalData(): Promise<{
    totalMarketCap: number;
    totalVolume: number;
    btcDominance: number;
    ethDominance: number;
    activeCryptocurrencies: number;
  }> {
    try {
      const url = `${this.coingeckoBaseUrl}/global`;
      const response = await firstValueFrom(this.httpService.get(url));

      const data = response.data.data || {};
      return {
        totalMarketCap: data.total_market_cap?.usd || 0,
        totalVolume: data.total_volume?.usd || 0,
        btcDominance: data.market_cap_percentage?.btc || 0,
        ethDominance: data.market_cap_percentage?.eth || 0,
        activeCryptocurrencies: data.active_cryptocurrencies || 0,
      };
    } catch (error) {
      throw new HttpException(
        `Failed to fetch global data: ${error.message}`,
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  /**
   * Calculate volatility metrics
   */
  calculateVolatility(prices: number[]): {
    dailyVolatility: number;
    annualVolatility: number;
    maxDrawdown: number;
  } {
    if (prices.length < 2) {
      return { dailyVolatility: 0, annualVolatility: 0, maxDrawdown: 0 };
    }

    // Calculate daily returns
    const returns: number[] = [];
    for (let i = 1; i < prices.length; i++) {
      returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
    }

    // Calculate standard deviation of returns
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
    const dailyVolatility = Math.sqrt(variance);

    // Annualized volatility (assuming 365 trading days)
    const annualVolatility = dailyVolatility * Math.sqrt(365);

    // Calculate max drawdown
    let maxDrawdown = 0;
    let peak = prices[0];
    for (const price of prices) {
      if (price > peak) peak = price;
      const drawdown = (peak - price) / peak;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    }

    return {
      dailyVolatility: dailyVolatility * 100,
      annualVolatility: annualVolatility * 100,
      maxDrawdown: maxDrawdown * 100,
    };
  }
}
