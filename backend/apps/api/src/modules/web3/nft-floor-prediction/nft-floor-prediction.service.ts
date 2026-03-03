import { Injectable } from '@nestjs/common';

export enum Chain {
  ETHEREUM = 'ethereum',
  POLYGON = 'polygon',
  ARBITRUM = 'arbitrum',
  OPTIMISM = 'optimism',
  BASE = 'base',
  SOLANA = 'solana',
}

export enum SignalType {
  STRONG_BUY = 'strong_buy',
  BUY = 'buy',
  HOLD = 'hold',
  SELL = 'sell',
  STRONG_SELL = 'strong_sell',
}

export enum TimeFrame {
  HOUR_1 = '1h',
  HOUR_4 = '4h',
  HOUR_24 = '24h',
  DAY_7 = '7d',
}

export interface FloorPricePrediction {
  currentFloor: number;
  predictedFloor: number;
  predictedChange: number;
  predictedChangePercent: number;
  confidence: number;
  signal: SignalType;
  targetPrices: {
    bullish: number;
    bearish: number;
    neutral: number;
  };
  trend: 'bullish' | 'bearish' | 'neutral';
  indicators: {
    rsi: number;
    macd: string;
    ema20: number;
    ema50: number;
    volumeTrend: string;
  };
  factors: string[];
}

@Injectable()
export class NftFloorPredictionService {
  private predictionCache: Map<string, { data: FloorPricePrediction; timestamp: number }> = new Map();

  private popularCollections: Record<string, { name: string; address: string }[]> = {
    [Chain.ETHEREUM]: [
      { name: 'Bored Ape Yacht Club', address: '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D' },
      { name: 'CryptoPunks', address: '0xb47e3cd837dDF8e4c57F05d70Ab865de6e193BBB' },
      { name: 'Azuki', address: '0xED5AF388653567Af2F388E6224dC7C4b3241C544' },
      { name: 'Pudgy Penguins', address: '0xBd3531dA5CF5857e7CfAA92426877b022e612cf8' },
      { name: 'CloneX', address: '0x49cF6f5d44E70224e2E23fDcdd2C053F30aDA28B' },
      { name: 'World of Women', address: '0xe785E82329a0E3A861f2cB2E5a67e20c7eA46A8b' },
      { name: 'Moonbirds', address: '0x235A5715D5CcC29c0E1B7E45a52E7b6D0f9e1a8C' },
      { name: 'DeGods', address: '0x8aE72D45d7cA83D46050B1d40E3C76De40f6aC34' },
    ],
    [Chain.POLYGON]: [
      { name: 'Killer Ghosts', address: '0x7b5a1fe7b1e8d2a1c3d4f5a6b7c8d9e0f1a2b3c' },
      { name: 'PolyBots', address: '0x8b6a2f3e4a5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e' },
    ],
    [Chain.ARBITRUM]: [
      { name: 'GMX', address: '0x4e5e5a7e9c3b1d2f3a4b5c6d7e8f9a0b1c2d3e4' },
    ],
    [Chain.BASE]: [
      { name: 'Doodle', address: '0x9e4c6e6e8f5a3d2b1c0e9f8a7b6c5d4e3f2a1b0' },
    ],
    [Chain.SOLANA]: [
      { name: 'Degenerate Ape Academy', address: 'DAPEabcdef1234567890' },
      { name: 'Solana Monkey Business', address: 'SMBabcdef1234567890' },
    ],
  };

  async predictFloorPrice(address: string, chain: Chain, timeFrame: TimeFrame = TimeFrame.DAY_7): Promise<FloorPricePrediction> {
    const cacheKey = `${chain}:${address}:${timeFrame}`;
    
    const cached = this.predictionCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < 15 * 60 * 1000) {
      return cached.data;
    }

    // Simulate floor price
    const currentFloor = Math.random() * 10 + 0.5;
    const prediction = this.generatePrediction(currentFloor, timeFrame);

    this.predictionCache.set(cacheKey, { data: prediction, timestamp: Date.now() });
    return prediction;
  }

  private generatePrediction(currentFloor: number, timeFrame: TimeFrame): FloorPricePrediction {
    const timeMultipliers: Record<TimeFrame, number> = {
      [TimeFrame.HOUR_1]: 0.01,
      [TimeFrame.HOUR_4]: 0.03,
      [TimeFrame.HOUR_24]: 0.05,
      [TimeFrame.DAY_7]: 0.1,
    };
    const multiplier = timeMultipliers[timeFrame];

    const baseChange = (Math.random() - 0.4) * multiplier;
    const predictedChangePercent = baseChange * 100;
    const predictedChange = currentFloor * baseChange;
    const predictedFloor = currentFloor + predictedChange;

    const volatility = Math.abs(predictedChangePercent) / 10;
    const confidence = Math.max(50, Math.min(95, 100 - volatility * 20));

    let signal: SignalType;
    if (predictedChangePercent > 10) signal = SignalType.STRONG_BUY;
    else if (predictedChangePercent > 3) signal = SignalType.BUY;
    else if (predictedChangePercent < -10) signal = SignalType.STRONG_SELL;
    else if (predictedChangePercent < -3) signal = SignalType.SELL;
    else signal = SignalType.HOLD;

    const bullishTarget = predictedFloor * 1.15;
    const bearishTarget = predictedFloor * 0.85;
    const neutralTarget = predictedFloor;

    let trend: 'bullish' | 'bearish' | 'neutral';
    if (predictedChangePercent > 5) trend = 'bullish';
    else if (predictedChangePercent < -5) trend = 'bearish';
    else trend = 'neutral';

    const rsi = 50 + (Math.random() - 0.5) * 40;
    const ema20 = currentFloor * (1 + (Math.random() - 0.5) * 0.1);
    const ema50 = currentFloor * (1 + (Math.random() - 0.5) * 0.15);
    const macd = predictedChangePercent > 0 ? 'bullish' : 'bearish';
    const volumeTrend = ['increasing', 'stable', 'decreasing'][Math.floor(Math.random() * 3)];

    const factors = this.generateFactors(predictedChangePercent, trend);

    return {
      currentFloor: parseFloat(currentFloor.toFixed(4)),
      predictedFloor: parseFloat(predictedFloor.toFixed(4)),
      predictedChange: parseFloat(predictedChange.toFixed(4)),
      predictedChangePercent: parseFloat(predictedChangePercent.toFixed(2)),
      confidence: parseFloat(confidence.toFixed(1)),
      signal,
      targetPrices: {
        bullish: parseFloat(bullishTarget.toFixed(4)),
        bearish: parseFloat(bearishTarget.toFixed(4)),
        neutral: parseFloat(neutralTarget.toFixed(4)),
      },
      trend,
      indicators: {
        rsi: parseFloat(rsi.toFixed(1)),
        macd,
        ema20: parseFloat(ema20.toFixed(4)),
        ema50: parseFloat(ema50.toFixed(4)),
        volumeTrend,
      },
      factors,
    };
  }

  private generateFactors(changePercent: number, trend: string): string[] {
    const factors = [];
    
    if (changePercent > 5) {
      factors.push('Strong buying pressure detected');
      factors.push('Social sentiment turning bullish');
      factors.push('Whale accumulation observed');
    } else if (changePercent < -5) {
      factors.push('Increased selling pressure');
      factors.push('Negative social sentiment');
      factors.push('Profit taking by early holders');
    } else {
      factors.push('Market in consolidation phase');
      factors.push('Stable trading volume');
    }

    const additionalFactors = [
      'Royalty fee change speculation',
      'Upcoming roadmap announcements',
      'Celebrity endorsement rumors',
      'Floor burning events',
      'Collection unlock events',
      'Market-wide trend influence',
      'Exchange listing speculation',
    ];
    
    factors.push(additionalFactors[Math.floor(Math.random() * additionalFactors.length)]);
    return factors.slice(0, 4);
  }

  async getCollectionPredictions(address: string, chain: Chain) {
    const [pred1h, pred4h, pred24h, pred7d] = await Promise.all([
      this.predictFloorPrice(address, chain, TimeFrame.HOUR_1),
      this.predictFloorPrice(address, chain, TimeFrame.HOUR_4),
      this.predictFloorPrice(address, chain, TimeFrame.HOUR_24),
      this.predictFloorPrice(address, chain, TimeFrame.DAY_7),
    ]);

    return {
      collection: { address, chain },
      predictions: {
        '1h': pred1h,
        '4h': pred4h,
        '24h': pred24h,
        '7d': pred7d,
      },
    };
  }

  async getTrendingCollections(chain: Chain, limit: number = 10) {
    const collections = this.popularCollections[chain] || [];
    
    const trending = await Promise.all(
      collections.slice(0, limit).map(async (col) => {
        const prediction = await this.predictFloorPrice(col.address, chain, TimeFrame.DAY_7);
        
        return {
          name: col.name,
          address: col.address,
          floorPrice: prediction.currentFloor,
          change24h: prediction.predictedChangePercent,
          prediction,
        };
      })
    );

    return { chain, collections: trending };
  }

  async getSignals(chain?: Chain, signalType?: SignalType) {
    const signals: any[] = [];
    const chains = chain ? [chain] : Object.values(Chain);
    
    for (const c of chains) {
      const collections = this.popularCollections[c] || [];
      for (const col of collections) {
        const prediction = await this.predictFloorPrice(col.address, c, TimeFrame.DAY_7);
        
        if (!signalType || prediction.signal === signalType) {
          signals.push({
            collection: { name: col.name, address: col.address, chain: c },
            prediction,
            generatedAt: Date.now(),
          });
        }
      }
    }

    const summary = {
      strongBuy: signals.filter(s => s.prediction.signal === SignalType.STRONG_BUY).length,
      buy: signals.filter(s => s.prediction.signal === SignalType.BUY).length,
      hold: signals.filter(s => s.prediction.signal === SignalType.HOLD).length,
      sell: signals.filter(s => s.prediction.signal === SignalType.SELL).length,
      strongSell: signals.filter(s => s.prediction.signal === SignalType.STRONG_SELL).length,
    };

    return { signals, summary };
  }

  async getStats() {
    return {
      totalPredictions: 8500 + Math.floor(Math.random() * 5000),
      avgConfidence: 75 + Math.random() * 15,
      accuracy: 78 + Math.random() * 12,
      collectionsTracked: 250 + Math.floor(Math.random() * 150),
      signalsGenerated: 1200 + Math.floor(Math.random() * 800),
    };
  }
}
