import { Injectable } from '@nestjs/common';

interface OptionsData {
  asset: string;
  symbol: string;
  totalOi: number;
  callOi: number;
  putOi: number;
  putCallRatio: number;
  volume24h: number;
  volumeChange: number;
  iv: number;
  ivChange: number;
  nextExpiry: string;
  maxPain: number;
}

interface IVData {
  strike: number;
  callIv: number;
  putIv: number;
  delta: number;
}

@Injectable()
export class OptionsTrackerService {
  // Simulated options data for major crypto assets
  private getBaseOptionsData(): OptionsData[] {
    return [
      {
        asset: 'BTC',
        symbol: 'BTC',
        totalOi: 12500000000, // $12.5B
        callOi: 7200000000,
        putOi: 5300000000,
        putCallRatio: 0.74,
        volume24h: 850000000,
        volumeChange: 12.5,
        iv: 58.2,
        ivChange: -2.3,
        nextExpiry: '2026-03-07',
        maxPain: 62000,
      },
      {
        asset: 'ETH',
        symbol: 'ETH',
        totalOi: 5800000000, // $5.8B
        callOi: 3400000000,
        putOi: 2400000000,
        putCallRatio: 0.71,
        volume24h: 420000000,
        volumeChange: 8.2,
        iv: 62.5,
        ivChange: 1.8,
        nextExpiry: '2026-03-07',
        maxPain: 2200,
      },
      {
        asset: 'SOL',
        symbol: 'SOL',
        totalOi: 850000000, // $850M
        callOi: 520000000,
        putOi: 330000000,
        putCallRatio: 0.63,
        volume24h: 125000000,
        volumeChange: 25.3,
        iv: 78.4,
        ivChange: -5.2,
        nextExpiry: '2026-03-14',
        maxPain: 125,
      },
      {
        asset: 'ARB',
        symbol: 'ARB',
        totalOi: 125000000, // $125M
        callOi: 72000000,
        putOi: 53000000,
        putCallRatio: 0.74,
        volume24h: 28000000,
        volumeChange: 15.8,
        iv: 85.2,
        ivChange: 3.1,
        nextExpiry: '2026-03-21',
        maxPain: 1.85,
      },
      {
        asset: 'OP',
        symbol: 'OP',
        totalOi: 95000000, // $95M
        callOi: 58000000,
        putOi: 37000000,
        putCallRatio: 0.64,
        volume24h: 18500000,
        volumeChange: -8.5,
        iv: 82.1,
        ivChange: -1.2,
        nextExpiry: '2026-03-21',
        maxPain: 2.15,
      },
    ];
  }

  async getOptionsOverview() {
    const options = this.getBaseOptionsData();
    
    // Calculate totals
    const totalOi = options.reduce((sum, opt) => sum + opt.totalOi, 0);
    const totalVolume = options.reduce((sum, opt) => sum + opt.volume24h, 0);
    const avgIv = options.reduce((sum, opt) => sum + opt.iv, 0) / options.length;
    const avgPutCallRatio = options.reduce((sum, opt) => sum + opt.putCallRatio, 0) / options.length;

    return {
      timestamp: new Date().toISOString(),
      totalOpenInterest: totalOi,
      totalVolume24h: totalVolume,
      averageIv: Math.round(avgIv * 10) / 10,
      averagePutCallRatio: Math.round(avgPutCallRatio * 100) / 100,
      assets: options.map(opt => ({
        ...opt,
        totalOiFormatted: this.formatCurrency(opt.totalOi),
        volumeFormatted: this.formatCurrency(opt.volume24h),
      })),
      marketSentiment: this.getMarketSentiment(avgPutCallRatio),
    };
  }

  async getOpenInterest(asset: string, timeframe: string) {
    const opt = this.getBaseOptionsData().find(o => o.asset === asset);
    if (!opt) return { error: 'Asset not found' };

    // Generate historical OI data
    const now = Date.now();
    const hours = timeframe === '24h' ? 24 : timeframe === '7d' ? 168 : 720;
    const interval = hours <= 24 ? 1 : hours <= 168 ? 4 : 24;
    
    const history = [];
    for (let i = hours; i >= 0; i -= interval) {
      const timestamp = new Date(now - i * 3600000);
      const variance = 0.1 * Math.random() - 0.05;
      history.push({
        timestamp: timestamp.toISOString(),
        callOi: Math.round(opt.callOi * (1 + variance)),
        putOi: Math.round(opt.putOi * (1 + variance)),
        totalOi: Math.round(opt.totalOi * (1 + variance)),
      });
    }

    return {
      asset,
      timeframe,
      current: {
        callOi: opt.callOi,
        putOi: opt.putOi,
        totalOi: opt.totalOi,
      },
      history,
    };
  }

  async getPutCallRatio(asset: string, expiry: string) {
    const opt = this.getBaseOptionsData().find(o => o.asset === asset);
    if (!opt) return { error: 'Asset not found' };

    // Generate time series data
    const history = [];
    for (let i = 30; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      history.push({
        date: date.toISOString().split('T')[0],
        ratio: Math.round((opt.putCallRatio + (Math.random() * 0.2 - 0.1)) * 100) / 100,
        callVolume: Math.round(opt.callOi * (0.3 + Math.random() * 0.1)),
        putVolume: Math.round(opt.putOi * (0.3 + Math.random() * 0.1)),
      });
    }

    return {
      asset,
      expiry: expiry || opt.nextExpiry,
      currentRatio: opt.putCallRatio,
      sentiment: opt.putCallRatio < 0.6 ? 'bullish' : opt.putCallRatio > 0.8 ? 'bearish' : 'neutral',
      history,
    };
  }

  async getImpliedVolatility(asset: string, strike: string) {
    const opt = this.getBaseOptionsData().find(o => o.asset === asset);
    if (!opt) return { error: 'Asset not found' };

    // Generate IV smile data
    const strikes = this.generateStrikes(opt, strike);
    
    return {
      asset,
      currentIv: opt.iv,
      ivChange: opt.ivChange,
      ivRank: this.calculateIvRank(opt.iv),
      ivPercentile: this.calculateIvPercentile(opt.iv),
      strikes,
    };
  }

  async getExpirations(asset: string) {
    const opt = this.getBaseOptionsData().find(o => o.asset === asset);
    if (!opt) return { error: 'Asset not found' };

    return {
      asset,
      expiations: [
        { date: '2026-03-07', days: 5, oi: opt.totalOi * 0.45 },
        { date: '2026-03-14', days: 12, oi: opt.totalOi * 0.25 },
        { date: '2026-03-21', days: 19, oi: opt.totalOi * 0.15 },
        { date: '2026-03-28', days: 26, oi: opt.totalOi * 0.10 },
        { date: '2026-04-04', days: 33, oi: opt.totalOi * 0.05 },
      ],
    };
  }

  async getOptionsVolume(asset: string, period: string) {
    const opt = this.getBaseOptionsData().find(o => o.asset === asset);
    if (!opt) return { error: 'Asset not found' };

    const days = period === '24h' ? 1 : period === '7d' ? 7 : 30;
    const history = [];
    
    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const variance = 0.3 * Math.random() - 0.15;
      history.push({
        date: date.toISOString().split('T')[0],
        callVolume: Math.round(opt.callOi * (0.2 + variance)),
        putVolume: Math.round(opt.putOi * (0.2 + variance)),
        totalVolume: Math.round(opt.volume24h * (1 + variance)),
      });
    }

    return {
      asset,
      period,
      totalVolume: history.reduce((sum, h) => sum + h.totalVolume, 0),
      callVolume: history.reduce((sum, h) => sum + h.callVolume, 0),
      putVolume: history.reduce((sum, h) => sum + h.putVolume, 0),
      history,
    };
  }

  private generateStrikes(opt: OptionsData, targetStrike: string): IVData[] {
    const basePrice = opt.maxPain;
    const strikes = [];
    const step = basePrice > 1000 ? 500 : basePrice > 100 ? 10 : 0.1;
    
    for (let i = -5; i <= 5; i++) {
      const strike = basePrice + (i * step);
      const distFromAtm = Math.abs(strike - basePrice) / basePrice;
      strikes.push({
        strike: Math.round(strike * 100) / 100,
        callIv: Math.round((opt.iv - distFromAtm * 10 + Math.random() * 5) * 10) / 10,
        putIv: Math.round((opt.iv - distFromAtm * 8 + Math.random() * 5) * 10) / 10,
        delta: Math.round((0.5 - distFromAtm * 0.3 + Math.random() * 0.1) * 100) / 100,
      });
    }
    
    return strikes;
  }

  private calculateIvRank(iv: number): number {
    // Simulated IV rank (0-100)
    return Math.min(100, Math.max(0, Math.round(50 + (iv - 60) * 2)));
  }

  private calculateIvPercentile(iv: number): number {
    return Math.min(100, Math.max(0, Math.round(45 + (iv - 55) * 1.5)));
  }

  private getMarketSentiment(putCallRatio: number): string {
    if (putCallRatio < 0.5) return 'very_bullish';
    if (putCallRatio < 0.7) return 'bullish';
    if (putCallRatio < 0.9) return 'neutral';
    if (putCallRatio < 1.1) return 'bearish';
    return 'very_bearish';
  }

  private formatCurrency(value: number): string {
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
    return `$${value.toFixed(2)}`;
  }
}
