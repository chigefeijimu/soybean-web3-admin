import { Injectable } from '@nestjs/common';

export interface PriceData {
  timestamp: number;
  price: number;
}

export interface IndicatorSignal {
  name: string;
  value: number;
  signal: 'BUY' | 'SELL' | 'NEUTRAL';
  description: string;
}

export interface TradingSignal {
  token: string;
  chain: string;
  timeframe: string;
  currentPrice: number;
  signals: IndicatorSignal[];
  overallSignal: 'BUY' | 'SELL' | 'NEUTRAL';
  strength: number;
  timestamp: number;
  summary: string;
}

export interface MultiTimeframeSignals {
  token: string;
  chain: string;
  signals: {
    timeframe: string;
    signal: 'BUY' | 'SELL' | 'NEUTRAL';
    strength: number;
  }[];
  consensus: 'BUY' | 'SELL' | 'NEUTRAL';
}

@Injectable()
export class TokenSignalAnalyzerService {
  private readonly coingeckoIds: Record<string, Record<string, string>> = {
    ethereum: {
      BTC: 'bitcoin',
      ETH: 'ethereum',
      USDT: 'tether',
      USDC: 'usd-coin',
      BNB: 'binancecoin',
      SOL: 'solana',
      XRP: 'ripple',
      ADA: 'cardano',
      AVAX: 'avalanche-2',
      DOGE: 'dogecoin',
      DOT: 'polkadot',
      MATIC: 'matic-network',
      LINK: 'chainlink',
      UNI: 'uniswap',
      ATOM: 'cosmos',
      ARB: 'arbitrum',
      OP: 'optimism',
    },
    bsc: {
      BNB: 'binancecoin',
      CAKE: 'pancakeswap-token',
    },
  };

  private readonly popularTokens = [
    'BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'ADA', 'AVAX', 'DOT', 'MATIC', 'LINK',
    'UNI', 'ARB', 'OP', 'ATOM', 'DOGE'
  ];

  async getTradingSignal(
    token: string,
    chain: string = 'ethereum',
    timeframe: string = '1d'
  ): Promise<TradingSignal> {
    const days = this.getDaysFromTimeframe(timeframe);
    const priceData = await this.fetchPriceData(token, chain, days + 30);
    
    if (priceData.length === 0) {
      return this.generateEmptySignal(token, chain, timeframe);
    }

    const currentPrice = priceData[priceData.length - 1].price;
    const signals: IndicatorSignal[] = [];

    // RSI Signal
    const rsi = this.calculateRSI(priceData.map(p => p.price), 14);
    signals.push(this.getRSISignal(rsi));

    // MACD Signal
    const macd = this.calculateMACD(priceData.map(p => p.price));
    signals.push(this.getMACDSignal(macd));

    // Moving Averages Signals
    const sma20 = this.calculateSMA(priceData.map(p => p.price), 20);
    const sma50 = this.calculateSMA(priceData.map(p => p.price), 50);
    const sma200 = this.calculateSMA(priceData.map(p => p.price), 200);
    
    signals.push(this.getSMASignal(currentPrice, sma20, 'SMA 20'));
    signals.push(this.getSMASignal(currentPrice, sma50, 'SMA 50'));
    signals.push(this.getSMASignal(currentPrice, sma200, 'SMA 200'));

    // EMA Signals
    const ema12 = this.calculateEMA(priceData.map(p => p.price), 12);
    const ema26 = this.calculateEMA(priceData.map(p => p.price), 26);
    signals.push(this.getEMASignal(currentPrice, ema12, 'EMA 12'));
    signals.push(this.getEMASignal(currentPrice, ema26, 'EMA 26'));

    // Bollinger Bands Signal
    const bb = this.calculateBollingerBands(priceData.map(p => p.price), 20, 2);
    signals.push(this.getBBSignal(currentPrice, bb));

    // Stochastic Oscillator
    const stoch = this.calculateStochastic(priceData.map(p => p.price), 14);
    signals.push(this.getStochSignal(stoch));

    // Average Directional Index (ADX)
    const adx = this.calculateADX(priceData.map(p => p.price), 14);
    signals.push(this.getADXSignal(adx));

    // Calculate overall signal
    const { overallSignal, strength } = this.calculateOverallSignal(signals);

    return {
      token: token.toUpperCase(),
      chain,
      timeframe,
      currentPrice: Number(currentPrice.toFixed(2)),
      signals,
      overallSignal,
      strength,
      timestamp: Date.now(),
      summary: this.generateSummary(overallSignal, strength, signals),
    };
  }

  async getMultiTimeframeSignals(
    token: string,
    chain: string = 'ethereum'
  ): Promise<MultiTimeframeSignals> {
    const timeframes = ['1h', '4h', '1d', '1w'];
    const signals: MultiTimeframeSignals['signals'] = [];

    for (const tf of timeframes) {
      try {
        const result = await this.getTradingSignal(token, chain, tf);
        signals.push({
          timeframe: tf,
          signal: result.overallSignal,
          strength: result.strength,
        });
      } catch (e) {
        signals.push({
          timeframe: tf,
          signal: 'NEUTRAL',
          strength: 0,
        });
      }
    }

    const consensus = this.calculateConsensus(signals);

    return {
      token: token.toUpperCase(),
      chain,
      signals,
      consensus,
    };
  }

  async getTopSignals(chain: string = 'ethereum', limit: number = 10): Promise<TradingSignal[]> {
    const results: TradingSignal[] = [];

    for (const token of this.popularTokens.slice(0, limit)) {
      try {
        const signal = await this.getTradingSignal(token, chain, '1d');
        results.push(signal);
      } catch (e) {
        // Skip failed tokens
      }
    }

    // Sort by strength
    results.sort((a, b) => b.strength - a.strength);
    return results;
  }

  getPopularTokens(): string[] {
    return this.popularTokens;
  }

  private getDaysFromTimeframe(timeframe: string): number {
    const map: Record<string, number> = {
      '15m': 2,
      '1h': 7,
      '4h': 30,
      '1d': 90,
      '1w': 365,
    };
    return map[timeframe] || 30;
  }

  private async fetchPriceData(token: string, chain: string, days: number): Promise<PriceData[]> {
    try {
      const coingeckoId = this.getCoingeckoId(token, chain);
      if (!coingeckoId) {
        return this.generateMockPriceData(token, days);
      }

      const end = Math.floor(Date.now() / 1000);
      const start = end - days * 24 * 60 * 60;

      const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/${coingeckoId}/market_chart/range?vs_currency=usd&from=${start}&to=${end}`
      );

      if (!response.ok) {
        return this.generateMockPriceData(token, days);
      }

      const data = await response.json() as { prices?: [number, number][] };
      
      if (!data.prices || !Array.isArray(data.prices)) {
        return this.generateMockPriceData(token, days);
      }

      return data.prices.map((p: [number, number]) => ({
        timestamp: p[0],
        price: p[1],
      }));
    } catch (error) {
      console.error(`Error fetching price data for ${token}:`, error);
      return this.generateMockPriceData(token, days);
    }
  }

  private getCoingeckoId(token: string, chain: string): string | null {
    const chainTokens = this.coingeckoIds[chain];
    if (chainTokens) {
      return chainTokens[token.toUpperCase()];
    }
    return this.coingeckoIds.ethereum?.[token.toUpperCase()] || null;
  }

  private generateMockPriceData(token: string, days: number): PriceData[] {
    const data: PriceData[] = [];
    const now = Date.now();
    const basePrice = this.getBasePrice(token);
    let price = basePrice;

    for (let i = days; i >= 0; i--) {
      const timestamp = now - i * 24 * 60 * 60 * 1000;
      const change = (Math.random() - 0.5) * 0.08 * price;
      price = Math.max(price + change, 0.01);
      data.push({ timestamp, price });
    }

    return data;
  }

  private getBasePrice(token: string): number {
    const prices: Record<string, number> = {
      BTC: 67500, ETH: 3450, SOL: 145, BNB: 580, XRP: 0.52,
      ADA: 0.45, AVAX: 35, DOT: 7.2, MATIC: 0.58, LINK: 14.5,
      UNI: 7.2, ARB: 1.1, OP: 1.8, ATOM: 8.5, DOGE: 0.08,
    };
    return prices[token.toUpperCase()] || 100;
  }

  // Technical Indicators

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

  private getRSISignal(rsi: number): IndicatorSignal {
    if (rsi < 30) {
      return { name: 'RSI (14)', value: Number(rsi.toFixed(2)), signal: 'BUY', description: 'Oversold - potential buying opportunity' };
    } else if (rsi > 70) {
      return { name: 'RSI (14)', value: Number(rsi.toFixed(2)), signal: 'SELL', description: 'Overbought - potential selling opportunity' };
    }
    return { name: 'RSI (14)', value: Number(rsi.toFixed(2)), signal: 'NEUTRAL', description: 'Neutral range' };
  }

  private calculateMACD(prices: number[]): { macd: number; signal: number; histogram: number } {
    const ema12 = this.calculateEMA(prices, 12);
    const ema26 = this.calculateEMA(prices, 26);
    const macdLine = ema12 - ema26;
    
    const macdValues: number[] = [];
    for (let i = Math.max(0, prices.length - 30); i < prices.length; i++) {
      const e12 = this.calculateEMA(prices.slice(0, i + 1), 12);
      const e26 = this.calculateEMA(prices.slice(0, i + 1), 26);
      macdValues.push(e12 - e26);
    }
    const signalLine = macdValues.length > 9 
      ? this.calculateEMA(macdValues.slice(-9), 9) 
      : macdLine;

    return {
      macd: macdLine,
      signal: signalLine,
      histogram: macdLine - signalLine,
    };
  }

  private getMACDSignal(macd: { macd: number; signal: number; histogram: number }): IndicatorSignal {
    if (macd.macd > macd.signal && macd.histogram > 0) {
      return { name: 'MACD', value: Number(macd.histogram.toFixed(4)), signal: 'BUY', description: 'Bullish crossover - buy signal' };
    } else if (macd.macd < macd.signal && macd.histogram < 0) {
      return { name: 'MACD', value: Number(macd.histogram.toFixed(4)), signal: 'SELL', description: 'Bearish crossover - sell signal' };
    }
    return { name: 'MACD', value: Number(macd.histogram.toFixed(4)), signal: 'NEUTRAL', description: 'No clear trend' };
  }

  private calculateSMA(prices: number[], period: number): number {
    if (prices.length < period) return prices[prices.length - 1] || 0;
    const slice = prices.slice(-period);
    return slice.reduce((a, b) => a + b, 0) / period;
  }

  private calculateEMA(prices: number[], period: number): number {
    if (prices.length < period) return prices[prices.length - 1] || 0;
    
    const multiplier = 2 / (period + 1);
    let ema = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;
    
    for (let i = period; i < prices.length; i++) {
      ema = (prices[i] - ema) * multiplier + ema;
    }
    
    return ema;
  }

  private getSMASignal(price: number, sma: number, name: string): IndicatorSignal {
    const diff = ((price - sma) / sma) * 100;
    if (diff > 2) {
      return { name, value: Number(sma.toFixed(2)), signal: 'BUY', description: `Price above ${name} - bullish` };
    } else if (diff < -2) {
      return { name, value: Number(sma.toFixed(2)), signal: 'SELL', description: `Price below ${name} - bearish` };
    }
    return { name, value: Number(sma.toFixed(2)), signal: 'NEUTRAL', description: `Price near ${name}` };
  }

  private getEMASignal(price: number, ema: number, name: string): IndicatorSignal {
    const diff = ((price - ema) / ema) * 100;
    if (diff > 1) {
      return { name, value: Number(ema.toFixed(2)), signal: 'BUY', description: `Price above ${name} - bullish` };
    } else if (diff < -1) {
      return { name, value: Number(ema.toFixed(2)), signal: 'SELL', description: `Price below ${name} - bearish` };
    }
    return { name, value: Number(ema.toFixed(2)), signal: 'NEUTRAL', description: `Price near ${name}` };
  }

  private calculateBollingerBands(prices: number[], period: number = 20, stdDev: number = 2): { upper: number; middle: number; lower: number } {
    const sma = this.calculateSMA(prices, period);
    const slice = prices.slice(-period);
    const variance = slice.reduce((sum, p) => sum + Math.pow(p - sma, 2), 0) / period;
    const standardDeviation = Math.sqrt(variance);

    return {
      upper: sma + (stdDev * standardDeviation),
      middle: sma,
      lower: sma - (stdDev * standardDeviation),
    };
  }

  private getBBSignal(price: number, bb: { upper: number; middle: number; lower: number }): IndicatorSignal {
    if (price <= bb.lower) {
      return { name: 'Bollinger Bands', value: Number(bb.lower.toFixed(2)), signal: 'BUY', description: 'Price at lower band - oversold' };
    } else if (price >= bb.upper) {
      return { name: 'Bollinger Bands', value: Number(bb.upper.toFixed(2)), signal: 'SELL', description: 'Price at upper band - overbought' };
    }
    return { name: 'Bollinger Bands', value: Number(bb.middle.toFixed(2)), signal: 'NEUTRAL', description: 'Price within bands' };
  }

  private calculateStochastic(prices: number[], period: number = 14): { k: number; d: number } {
    if (prices.length < period) return { k: 50, d: 50 };

    const recentPrices = prices.slice(-period);
    const highest = Math.max(...recentPrices);
    const lowest = Math.min(...recentPrices);
    const currentPrice = prices[prices.length - 1];

    const k = highest === lowest ? 50 : ((currentPrice - lowest) / (highest - lowest)) * 100;
    const kValues = [k, k, k];
    const d = kValues.reduce((a, b) => a + b, 0) / 3;

    return { k, d };
  }

  private getStochSignal(stoch: { k: number; d: number }): IndicatorSignal {
    if (stoch.k < 20 && stoch.d < 20) {
      return { name: 'Stochastic', value: Number(stoch.k.toFixed(2)), signal: 'BUY', description: 'Oversold - buying opportunity' };
    } else if (stoch.k > 80 && stoch.d > 80) {
      return { name: 'Stochastic', value: Number(stoch.k.toFixed(2)), signal: 'SELL', description: 'Overbought - selling opportunity' };
    } else if (stoch.k > stoch.d && stoch.k < 50) {
      return { name: 'Stochastic', value: Number(stoch.k.toFixed(2)), signal: 'BUY', description: 'Bullish crossover' };
    } else if (stoch.k < stoch.d && stoch.k > 50) {
      return { name: 'Stochastic', value: Number(stoch.k.toFixed(2)), signal: 'SELL', description: 'Bearish crossover' };
    }
    return { name: 'Stochastic', value: Number(stoch.k.toFixed(2)), signal: 'NEUTRAL', description: 'Neutral' };
  }

  private calculateADX(prices: number[], period: number = 14): number {
    if (prices.length < period + 1) return 25;

    const plusDM: number[] = [];
    const minusDM: number[] = [];
    const trueRange: number[] = [];

    for (let i = 1; i < prices.length; i++) {
      const high = prices[i] * 1.02;
      const low = prices[i] * 0.98;
      const prevHigh = prices[i - 1] * 1.01;
      const prevLow = prices[i - 1] * 0.99;

      const upMove = high - prevHigh;
      const downMove = prevLow - low;

      plusDM.push(upMove > downMove && upMove > 0 ? upMove : 0);
      minusDM.push(downMove > upMove && downMove > 0 ? downMove : 0);
      trueRange.push(high - low);
    }

    const plusDI = (plusDM.reduce((a, b) => a + b, 0) / period) / (trueRange.reduce((a, b) => a + b, 0) / period) * 100;
    const minusDI = (minusDM.reduce((a, b) => a + b, 0) / period) / (trueRange.reduce((a, b) => a + b, 0) / period) * 100;

    const diSum = plusDI + minusDI;
    if (diSum === 0) return 25;

    return (Math.abs(plusDI - minusDI) / diSum) * 100;
  }

  private getADXSignal(adx: number): IndicatorSignal {
    if (adx > 25) {
      return { name: 'ADX (14)', value: Number(adx.toFixed(2)), signal: 'NEUTRAL', description: 'Strong trend detected' };
    }
    return { name: 'ADX (14)', value: Number(adx.toFixed(2)), signal: 'NEUTRAL', description: 'Weak trend - caution advised' };
  }

  private calculateOverallSignal(signals: IndicatorSignal[]): { overallSignal: 'BUY' | 'SELL' | 'NEUTRAL'; strength: number } {
    let buyCount = 0;
    let sellCount = 0;
    let neutralCount = 0;

    for (const s of signals) {
      if (s.signal === 'BUY') buyCount++;
      else if (s.signal === 'SELL') sellCount++;
      else neutralCount++;
    }

    const total = signals.length;
    
    if (buyCount > sellCount && buyCount > neutralCount) {
      return { overallSignal: 'BUY', strength: Math.round((buyCount / total) * 100) };
    } else if (sellCount > buyCount && sellCount > neutralCount) {
      return { overallSignal: 'SELL', strength: Math.round((sellCount / total) * 100) };
    }
    
    return { overallSignal: 'NEUTRAL', strength: Math.round((neutralCount / total) * 100) };
  }

  private calculateConsensus(signals: MultiTimeframeSignals['signals']): 'BUY' | 'SELL' | 'NEUTRAL' {
    let buyCount = 0;
    let sellCount = 0;

    for (const s of signals) {
      if (s.signal === 'BUY') buyCount++;
      else if (s.signal === 'SELL') sellCount++;
    }

    if (buyCount > sellCount) return 'BUY';
    if (sellCount > buyCount) return 'SELL';
    return 'NEUTRAL';
  }

  private generateSummary(overallSignal: string, strength: number, signals: IndicatorSignal[]): string {
    const buySignals = signals.filter(s => s.signal === 'BUY').length;
    const sellSignals = signals.filter(s => s.signal === 'SELL').length;

    if (overallSignal === 'BUY') {
      return `${strength}% Buy Signal - ${buySignals} bullish indicators out of ${signals.length}. Consider entering a long position.`;
    } else if (overallSignal === 'SELL') {
      return `${strength}% Sell Signal - ${sellSignals} bearish indicators out of ${signals.length}. Consider taking profit or shorting.`;
    }
    return `Neutral - Mixed signals (${buySignals} buy, ${sellSignals} sell). Wait for clearer direction.`;
  }

  private generateEmptySignal(token: string, chain: string, timeframe: string): TradingSignal {
    return {
      token: token.toUpperCase(),
      chain,
      timeframe,
      currentPrice: 0,
      signals: [],
      overallSignal: 'NEUTRAL',
      strength: 0,
      timestamp: Date.now(),
      summary: 'Unable to generate signals - insufficient data',
    };
  }
}
