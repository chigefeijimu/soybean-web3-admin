import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

interface MomentumParams {
  chain?: string;
  timeRange?: string; // 24h, 7d, 30d, 90d
  momentumType?: string; // strong, weak, neutral
  sortBy?: string; // rsi, macd, volume, priceChange
  limit?: number;
}

interface TokenMomentum {
  symbol: string;
  name: string;
  address: string;
  chain: string;
  price: number;
  priceChange24h: number;
  priceChangePercent24h: number;
  volume24h: number;
  marketCap: number;
  // Momentum Indicators
  rsi: number;
  rsiSignal: string; // oversold, overbought, neutral
  macd: string; // bullish, bearish, neutral
  macdHistogram: number;
  ema20: number;
  ema50: number;
  ema200: number;
  sma20: number;
  sma50: number;
  // Technical Signals
  signal: string; // strong_buy, buy, neutral, sell, strong_sell
  strength: number; // 0-100
  momentumScore: number; // 0-100
  // Trend Analysis
  trend: string; // uptrend, downtrend, sideways
  volatility: string; // low, medium, high
  // Additional
  logo: string;
  lastUpdated: string;
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

  // Calculate RSI from price data
  private calculateRSI(prices: number[], period: number = 14): number {
    if (prices.length < period + 1) return 50;
    
    let gains = 0;
    let losses = 0;
    
    for (let i = prices.length - period; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      if (change > 0) gains += change;
      else losses -= change;
    }
    
    const avgGain = gains / period;
    const avgLoss = losses / period;
    
    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  // Calculate EMA
  private calculateEMA(prices: number[], period: number): number {
    if (prices.length < period) return prices[prices.length - 1];
    
    const multiplier = 2 / (period + 1);
    let ema = prices.slice(0, period).reduce((a, b) => a + b) / period;
    
    for (let i = period; i < prices.length; i++) {
      ema = (prices[i] - ema) * multiplier + ema;
    }
    return ema;
  }

  // Calculate SMA
  private calculateSMA(prices: number[], period: number): number {
    if (prices.length < period) {
      return prices.reduce((a, b) => a + b, 0) / prices.length;
    }
    return prices.slice(-period).reduce((a, b) => a + b, 0) / period;
  }

  // Calculate MACD
  private calculateMACD(prices: number[]): { signal: string; histogram: number } {
    if (prices.length < 26) {
      return { signal: 'neutral', histogram: 0 };
    }
    
    const ema12 = this.calculateEMA(prices, 12);
    const ema26 = this.calculateEMA(prices, 26);
    const macdLine = ema12 - ema26;
    
    // Simplified signal calculation
    const signalLine = macdLine * 0.9;
    const histogram = macdLine - signalLine;
    
    let signal = 'neutral';
    if (macdLine > signalLine && histogram > 0) signal = 'bullish';
    else if (macdLine < signalLine && histogram < 0) signal = 'bearish';
    
    return { signal, histogram };
  }

  // Generate technical signals
  private generateSignal(rsi: number, macd: string, ema20: number, ema50: number, price: number): { signal: string; strength: number } {
    let score = 50;
    
    // RSI signals
    if (rsi < 30) score += 20; // Oversold - potential buy
    else if (rsi > 70) score -= 20; // Overbought - potential sell
    else if (rsi < 40) score += 10;
    else if (rsi > 60) score -= 10;
    
    // MACD signals
    if (macd === 'bullish') score += 15;
    else if (macd === 'bearish') score -= 15;
    
    // EMA trend
    if (ema20 > ema50) score += 10; // Uptrend
    else score -= 10; // Downtrend
    
    // Price vs EMA
    if (price > ema20) score += 5;
    else score -= 5;
    
    score = Math.max(0, Math.min(100, score));
    
    let signal: string;
    if (score >= 80) signal = 'strong_buy';
    else if (score >= 60) signal = 'buy';
    else if (score >= 40) signal = 'neutral';
    else if (score >= 20) signal = 'sell';
    else signal = 'strong_sell';
    
    return { signal, strength: score };
  }

  // Calculate momentum score
  private calculateMomentumScore(priceChange: number, rsi: number, volume: number): number {
    let score = 50;
    
    // Price momentum
    if (priceChange > 20) score += 20;
    else if (priceChange > 10) score += 15;
    else if (priceChange > 5) score += 10;
    else if (priceChange > 0) score += 5;
    else if (priceChange > -5) score -= 5;
    else if (priceChange > -10) score -= 10;
    else if (priceChange > -20) score -= 15;
    else score -= 20;
    
    // RSI momentum
    if (rsi >= 40 && rsi <= 60) score += 10; // Healthy momentum zone
    else if (rsi >= 50 && rsi <= 70) score += 5;
    
    // Volume momentum (simplified)
    if (volume > 1000000000) score += 10;
    else if (volume > 100000000) score += 5;
    
    return Math.max(0, Math.min(100, score));
  }

  // Determine trend
  private determineTrend(ema20: number, ema50: number, ema200: number, sma20: number, sma50: number): string {
    const emaDiff = ((ema20 - ema50) / ema50) * 100;
    const smaDiff = ((sma20 - sma50) / sma50) * 100;
    
    if (emaDiff > 2 && smaDiff > 1) return 'uptrend';
    if (emaDiff < -2 && smaDiff < -1) return 'downtrend';
    return 'sideways';
  }

  // Determine volatility
  private determineVolatility(prices: number[]): string {
    if (prices.length < 2) return 'medium';
    
    const returns: number[] = [];
    for (let i = 1; i < prices.length; i++) {
      returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
    }
    
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
    const cv = (stdDev / avgPrice) * 100; // Coefficient of variation
    
    if (cv < 2) return 'low';
    if (cv < 5) return 'medium';
    return 'high';
  }

  async getTokenMomentum(params: MomentumParams): Promise<TokenMomentum[]> {
    try {
      const { 
        chain = 'ethereum', 
        timeRange = '7d', 
        momentumType = 'all',
        sortBy = 'momentumScore',
        limit = 50 
      } = params;

      // Get top tokens by market cap
      const response = await firstValueFrom(
        this.httpService.get(`${this.coinGeckoBaseUrl}/coins/markets`, {
          params: {
            vs_currency: 'usd',
            order: 'market_cap_desc',
            per_page: limit,
            page: 1,
            sparkline: true,
            price_change_percentage: '24h,7d,30d',
          },
        }),
      );

      const tokens: TokenMomentum[] = [];
      
      for (const coin of response.data) {
        try {
          // Get historical data for technical analysis
          const days = timeRange === '24h' ? 1 : timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
          const historyResponse = await firstValueFrom(
            this.httpService.get(`${this.coinGeckoBaseUrl}/coins/${coin.id}/market_chart`, {
              params: {
                vs_currency: 'usd',
                days: days,
              },
            }),
          );
          
          const prices = historyResponse.data.prices.map((p: any) => p[1]);
          if (prices.length < 10) continue;
          
          // Calculate indicators
          const rsi = this.calculateRSI(prices);
          const { signal: macd, histogram: macdHistogram } = this.calculateMACD(prices);
          const ema20 = this.calculateEMA(prices, 20);
          const ema50 = this.calculateEMA(prices, 50);
          const ema200 = this.calculateEMA(prices, 200);
          const sma20 = this.calculateSMA(prices, 20);
          const sma50 = this.calculateSMA(prices, 50);
          
          const currentPrice = prices[prices.length - 1];
          const priceChange24h = coin.price_change_24h || 0;
          const priceChangePercent24h = coin.price_change_percentage_24h || 0;
          
          const { signal, strength } = this.generateSignal(rsi, macd, ema20, ema50, currentPrice);
          const momentumScore = this.calculateMomentumScore(priceChangePercent24h, rsi, coin.total_volume || 0);
          const trend = this.determineTrend(ema20, ema50, ema200, sma20, sma50);
          const volatility = this.determineVolatility(prices);
          
          // Determine RSI signal
          let rsiSignal = 'neutral';
          if (rsi < 30) rsiSignal = 'oversold';
          else if (rsi > 70) rsiSignal = 'overbought';
          
          // Filter by momentum type
          if (momentumType === 'strong' && momentumScore < 60) continue;
          if (momentumType === 'weak' && momentumScore > 40) continue;
          if (momentumType === 'bullish' && signal !== 'strong_buy' && signal !== 'buy') continue;
          if (momentumType === 'bearish' && signal !== 'strong_sell' && signal !== 'sell') continue;
          
          tokens.push({
            symbol: coin.symbol.toUpperCase(),
            name: coin.name,
            address: coin.id,
            chain: chain,
            price: currentPrice,
            priceChange24h,
            priceChangePercent24h,
            volume24h: coin.total_volume || 0,
            marketCap: coin.market_cap || 0,
            rsi: Math.round(rsi * 100) / 100,
            rsiSignal,
            macd,
            macdHistogram: Math.round(macdHistogram * 100) / 100,
            ema20: Math.round(ema20 * 100) / 100,
            ema50: Math.round(ema50 * 100) / 100,
            ema200: Math.round(ema200 * 100) / 100,
            sma20: Math.round(sma20 * 100) / 100,
            sma50: Math.round(sma50 * 100) / 100,
            signal,
            strength: Math.round(strength),
            momentumScore: Math.round(momentumScore),
            trend,
            volatility,
            logo: coin.image,
            lastUpdated: new Date().toISOString(),
          });
        } catch (e) {
          console.error(`Error processing token ${coin.symbol}:`, e);
          continue;
        }
      }
      
      // Sort by requested field
      tokens.sort((a, b) => {
        switch (sortBy) {
          case 'rsi': return b.rsi - a.rsi;
          case 'macd': return b.macdHistogram - a.macdHistogram;
          case 'volume': return b.volume24h - a.volume24h;
          case 'priceChange': return b.priceChangePercent24h - a.priceChangePercent24h;
          case 'momentumScore':
          default: return b.momentumScore - a.momentumScore;
        }
      });
      
      return tokens.slice(0, limit);
    } catch (error) {
      console.error('Error fetching token momentum:', error);
      throw new HttpException(
        'Failed to fetch token momentum data',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getTokenMomentumByAddress(address: string, chain: string = 'ethereum'): Promise<TokenMomentum | null> {
    try {
      // Get token by address using CoinGecko
      const response = await firstValueFrom(
        this.httpService.get(`${this.coinGeckoBaseUrl}/coins/${address}`, {
          params: {
            localization: false,
            tickers: false,
            market_data: true,
            community_data: false,
            developer_data: false,
            sparkline: true,
          },
        }),
      );

      const coin = response.data;
      const marketData = coin.market_data;
      
      // Get 30-day historical data for technical analysis
      const historyResponse = await firstValueFrom(
        this.httpService.get(`${this.coinGeckoBaseUrl}/coins/${address}/market_chart`, {
          params: {
            vs_currency: 'usd',
            days: 30,
          },
        }),
      );
      
      const prices = historyResponse.data.prices.map((p: any) => p[1]);
      if (prices.length < 10) {
        throw new HttpException(
          'Insufficient price data for analysis',
          HttpStatus.BAD_REQUEST,
        );
      }
      
      // Calculate indicators
      const rsi = this.calculateRSI(prices);
      const { signal: macd, histogram: macdHistogram } = this.calculateMACD(prices);
      const ema20 = this.calculateEMA(prices, 20);
      const ema50 = this.calculateEMA(prices, 50);
      const ema200 = this.calculateEMA(prices, 200);
      const sma20 = this.calculateSMA(prices, 20);
      const sma50 = this.calculateSMA(prices, 50);
      
      const currentPrice = prices[prices.length - 1];
      const priceChange24h = marketData.price_change_24h;
      const priceChangePercent24h = marketData.price_change_percentage_24h;
      
      const { signal, strength } = this.generateSignal(rsi, macd, ema20, ema50, currentPrice);
      const momentumScore = this.calculateMomentumScore(priceChangePercent24h, rsi, marketData.total_volume || 0);
      const trend = this.determineTrend(ema20, ema50, ema200, sma20, sma50);
      const volatility = this.determineVolatility(prices);
      
      let rsiSignal = 'neutral';
      if (rsi < 30) rsiSignal = 'oversold';
      else if (rsi > 70) rsiSignal = 'overbought';
      
      return {
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
        address: address,
        chain: chain,
        price: currentPrice,
        priceChange24h,
        priceChangePercent24h,
        volume24h: marketData.total_volume || 0,
        marketCap: marketData.market_cap || 0,
        rsi: Math.round(rsi * 100) / 100,
        rsiSignal,
        macd,
        macdHistogram: Math.round(macdHistogram * 100) / 100,
        ema20: Math.round(ema20 * 100) / 100,
        ema50: Math.round(ema50 * 100) / 100,
        ema200: Math.round(ema200 * 100) / 100,
        sma20: Math.round(sma20 * 100) / 100,
        sma50: Math.round(sma50 * 100) / 100,
        signal,
        strength: Math.round(strength),
        momentumScore: Math.round(momentumScore),
        trend,
        volatility,
        logo: coin.image?.large || coin.image?.small || '',
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error fetching token momentum by address:', error);
      return null;
    }
  }

  async getMomentumSignals(timeRange: string = '7d'): Promise<{
    strongBuy: TokenMomentum[];
    buy: TokenMomentum[];
    neutral: TokenMomentum[];
    sell: TokenMomentum[];
    strongSell: TokenMomentum[];
  }> {
    const tokens = await this.getTokenMomentum({
      timeRange,
      limit: 100,
    });
    
    return {
      strongBuy: tokens.filter(t => t.signal === 'strong_buy'),
      buy: tokens.filter(t => t.signal === 'buy'),
      neutral: tokens.filter(t => t.signal === 'neutral'),
      sell: tokens.filter(t => t.signal === 'sell'),
      strongSell: tokens.filter(t => t.signal === 'strong_sell'),
    };
  }

  async getTopMomentumTokens(params: {
    chain?: string;
    timeRange?: string;
    signal?: string;
    limit?: number;
  }): Promise<TokenMomentum[]> {
    const tokens = await this.getTokenMomentum({
      chain: params.chain,
      timeRange: params.timeRange || '7d',
      limit: params.limit || 20,
    });
    
    if (params.signal) {
      return tokens.filter(t => t.signal === params.signal);
    }
    
    return tokens.slice(0, params.limit || 20);
  }
}
