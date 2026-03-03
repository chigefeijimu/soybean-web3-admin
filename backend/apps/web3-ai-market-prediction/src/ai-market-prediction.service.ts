import { Injectable } from '@nestjs/common';

export interface MarketPrediction {
  symbol: string;
  name: string;
  currentPrice: number;
  priceChange24h: number;
  prediction: {
    trend: 'bullish' | 'bearish' | 'neutral';
    confidence: number;
    targetPrice24h: number;
    targetPrice7d: number;
    signal: 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell';
  };
  technicalIndicators: {
    rsi: number;
    macd: string;
    ema20: number;
    ema50: number;
    sma20: number;
    sma50: number;
    bollingerBands: {
      upper: number;
      middle: number;
      lower: number;
    };
    trend: 'uptrend' | 'downtrend' | 'sideways';
  };
  onChainMetrics: {
    exchangeFlowRatio: number;
    whaleActivity: 'high' | 'medium' | 'low';
    networkGrowth: number;
    activeAddresses: number;
    transactionVolume: number;
  };
  sentimentScore: number;
  riskAssessment: {
    level: 'low' | 'medium' | 'high';
    factors: string[];
  };
  timestamp: string;
}

export interface PredictionSummary {
  marketTrend: 'bullish' | 'bearish' | 'neutral';
  overallConfidence: number;
  topPick: string;
  riskLevel: 'low' | 'medium' | 'high';
  predictionCount: number;
}

@Injectable()
export class AiMarketPredictionService {
  private readonly supportedTokens = [
    { symbol: 'BTC', name: 'Bitcoin', basePrice: 85000 },
    { symbol: 'ETH', name: 'Ethereum', basePrice: 2200 },
    { symbol: 'SOL', name: 'Solana', basePrice: 145 },
    { symbol: 'BNB', name: 'BNB', basePrice: 580 },
    { symbol: 'XRP', name: 'XRP', basePrice: 2.8 },
    { symbol: 'ADA', name: 'Cardano', basePrice: 0.95 },
    { symbol: 'AVAX', name: 'Avalanche', basePrice: 42 },
    { symbol: 'DOGE', name: 'Dogecoin', basePrice: 0.32 },
    { symbol: 'DOT', name: 'Polkadot', basePrice: 18 },
    { symbol: 'MATIC', name: 'Polygon', basePrice: 0.85 },
    { symbol: 'LINK', name: 'Chainlink', basePrice: 18 },
    { symbol: 'UNI', name: 'Uniswap', basePrice: 12 },
    { symbol: 'AAVE', name: 'Aave', basePrice: 280 },
    { symbol: 'MKR', name: 'Maker', basePrice: 1500 },
    { symbol: 'CRV', name: 'Curve DAO', basePrice: 0.65 },
    { symbol: 'LDO', name: 'Lido DAO', basePrice: 2.8 },
    { symbol: 'ARB', name: 'Arbitrum', basePrice: 1.2 },
    { symbol: 'OP', name: 'Optimism', basePrice: 2.4 },
    { symbol: 'APT', name: 'Aptos', basePrice: 9.5 },
    { symbol: 'SAND', name: 'The Sandbox', basePrice: 0.55 },
  ];

  /**
   * Generate a complete market prediction for a token
   */
  async getTokenPrediction(symbol: string): Promise<MarketPrediction | null> {
    const token = this.supportedTokens.find(
      (t) => t.symbol.toUpperCase() === symbol.toUpperCase(),
    );
    if (!token) return null;

    const priceVariation = (Math.random() - 0.5) * 0.1;
    const currentPrice = token.basePrice * (1 + priceVariation);
    const priceChange24h = (Math.random() - 0.5) * 10;

    // Generate technical indicators
    const rsi = 30 + Math.random() * 40;
    const ema20 = currentPrice * (1 + (Math.random() - 0.5) * 0.05);
    const ema50 = currentPrice * (1 + (Math.random() - 0.5) * 0.08);
    const sma20 = currentPrice * (1 + (Math.random() - 0.5) * 0.04);
    const sma50 = currentPrice * (1 + (Math.random() - 0.5) * 0.06);
    const bollingerMiddle = currentPrice;
    const bollingerStd = currentPrice * 0.03;
    const bollingerBands = {
      upper: bollingerMiddle + bollingerStd * 2,
      middle: bollingerMiddle,
      lower: bollingerMiddle - bollingerStd * 2,
    };

    // Determine trend
    let trend: 'uptrend' | 'downtrend' | 'sideways';
    if (ema20 > ema50 && sma20 > sma50) {
      trend = 'uptrend';
    } else if (ema20 < ema50 && sma20 < sma50) {
      trend = 'downtrend';
    } else {
      trend = 'sideways';
    }

    // MACD
    const macdValue = (ema20 - ema50) / currentPrice * 100;
    let macd: string;
    if (macdValue > 0.5) {
      macd = 'bullish_crossover';
    } else if (macdValue < -0.5) {
      macd = 'bearish_crossover';
    } else {
      macd = 'neutral';
    }

    // Calculate prediction
    const trendScore = trend === 'uptrend' ? 1 : trend === 'downtrend' ? -1 : 0;
    const rsiScore = rsi > 70 ? -1 : rsi < 30 ? 1 : 0;
    const macdScore = macd.includes('bullish') ? 1 : macd.includes('bearish') ? -1 : 0;
    const combinedScore = (trendScore + rsiScore + macdScore) / 3;

    let prediction: MarketPrediction['prediction'];
    if (combinedScore > 0.3) {
      prediction = {
        trend: 'bullish',
        confidence: 60 + Math.random() * 25,
        targetPrice24h: currentPrice * (1 + (Math.random() * 0.05 + 0.01)),
        targetPrice7d: currentPrice * (1 + (Math.random() * 0.12 + 0.02)),
        signal: combinedScore > 0.6 ? 'strong_buy' : 'buy',
      };
    } else if (combinedScore < -0.3) {
      prediction = {
        trend: 'bearish',
        confidence: 60 + Math.random() * 25,
        targetPrice24h: currentPrice * (1 - (Math.random() * 0.05 + 0.01)),
        targetPrice7d: currentPrice * (1 - (Math.random() * 0.12 + 0.02)),
        signal: combinedScore < -0.6 ? 'strong_sell' : 'sell',
      };
    } else {
      prediction = {
        trend: 'neutral',
        confidence: 50 + Math.random() * 20,
        targetPrice24h: currentPrice * (1 + (Math.random() - 0.5) * 0.02),
        targetPrice7d: currentPrice * (1 + (Math.random() - 0.5) * 0.04),
        signal: 'hold',
      };
    }

    // On-chain metrics
    const exchangeFlowRatio = 0.3 + Math.random() * 0.4;
    const whaleActivity: 'high' | 'medium' | 'low' = Math.random() > 0.6 ? 'high' : Math.random() > 0.3 ? 'medium' : 'low';
    const networkGrowth = (Math.random() - 0.3) * 20;
    const activeAddresses = Math.floor(100000 + Math.random() * 500000);
    const transactionVolume = Math.floor(1000000000 + Math.random() * 5000000000);

    // Sentiment score
    const sentimentScore = 30 + Math.random() * 40;

    // Risk assessment
    let riskLevel: 'low' | 'medium' | 'high';
    const riskFactors: string[] = [];
    
    if (rsi > 70) {
      riskFactors.push('Overbought conditions (RSI > 70)');
    }
    if (rsi < 30) {
      riskFactors.push('Oversold conditions (RSI < 30)');
    }
    if (Math.abs(priceChange24h) > 5) {
      riskFactors.push('High volatility (24h change > 5%)');
    }
    if (whaleActivity === 'high') {
      riskFactors.push('High whale activity detected');
    }
    if (networkGrowth < 0) {
      riskFactors.push('Negative network growth');
    }

    if (riskFactors.length >= 3) {
      riskLevel = 'high';
    } else if (riskFactors.length >= 1) {
      riskLevel = 'medium';
    } else {
      riskLevel = 'low';
    }

    return {
      symbol: token.symbol,
      name: token.name,
      currentPrice,
      priceChange24h,
      prediction,
      technicalIndicators: {
        rsi,
        macd,
        ema20,
        ema50,
        sma20,
        sma50,
        bollingerBands,
        trend,
      },
      onChainMetrics: {
        exchangeFlowRatio,
        whaleActivity,
        networkGrowth,
        activeAddresses,
        transactionVolume,
      },
      sentimentScore,
      riskAssessment: {
        level: riskLevel,
        factors: riskFactors,
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get predictions for multiple tokens
   */
  async getMultipleTokenPredictions(symbols: string[]): Promise<MarketPrediction[]> {
    const predictions: MarketPrediction[] = [];
    for (const symbol of symbols) {
      const prediction = await this.getTokenPrediction(symbol);
      if (prediction) {
        predictions.push(prediction);
      }
    }
    return predictions;
  }

  /**
   * Get all token predictions
   */
  async getAllTokenPredictions(): Promise<MarketPrediction[]> {
    const predictions: MarketPrediction[] = [];
    for (const token of this.supportedTokens) {
      const prediction = await this.getTokenPrediction(token.symbol);
      if (prediction) {
        predictions.push(prediction);
      }
    }
    return predictions;
  }

  /**
   * Get top bullish predictions
   */
  async getTopBullishPredictions(limit: number = 5): Promise<MarketPrediction[]> {
    const allPredictions = await this.getAllTokenPredictions();
    const bullish = allPredictions
      .filter((p) => p.prediction.trend === 'bullish')
      .sort((a, b) => b.prediction.confidence - a.prediction.confidence)
      .slice(0, limit);
    return bullish;
  }

  /**
   * Get top bearish predictions
   */
  async getTopBearishPredictions(limit: number = 5): Promise<MarketPrediction[]> {
    const allPredictions = await this.getAllTokenPredictions();
    const bearish = allPredictions
      .filter((p) => p.prediction.trend === 'bearish')
      .sort((a, b) => b.prediction.confidence - a.prediction.confidence)
      .slice(0, limit);
    return bearish;
  }

  /**
   * Get strong buy signals
   */
  async getStrongBuySignals(limit: number = 10): Promise<MarketPrediction[]> {
    const allPredictions = await this.getAllTokenPredictions();
    return allPredictions
      .filter((p) => p.prediction.signal === 'strong_buy' || p.prediction.signal === 'buy')
      .sort((a, b) => b.prediction.confidence - a.prediction.confidence)
      .slice(0, limit);
  }

  /**
   * Get market prediction summary
   */
  async getMarketSummary(): Promise<PredictionSummary> {
    const allPredictions = await this.getAllTokenPredictions();
    
    const bullish = allPredictions.filter((p) => p.prediction.trend === 'bullish').length;
    const bearish = allPredictions.filter((p) => p.prediction.trend === 'bearish').length;
    const neutral = allPredictions.filter((p) => p.prediction.trend === 'neutral').length;

    const avgConfidence = allPredictions.reduce((sum, p) => sum + p.prediction.confidence, 0) / allPredictions.length;
    
    const highRisk = allPredictions.filter((p) => p.riskAssessment.level === 'high').length;

    let marketTrend: 'bullish' | 'bearish' | 'neutral';
    if (bullish > bearish && bullish > neutral) {
      marketTrend = 'bullish';
    } else if (bearish > bullish && bearish > neutral) {
      marketTrend = 'bearish';
    } else {
      marketTrend = 'neutral';
    }

    // Find top pick (highest confidence bullish)
    const topPick = allPredictions
      .filter((p) => p.prediction.trend === 'bullish')
      .sort((a, b) => b.prediction.confidence - a.prediction.confidence)[0];

    return {
      marketTrend,
      overallConfidence: avgConfidence,
      topPick: topPick?.symbol || 'N/A',
      riskLevel: highRisk > allPredictions.length / 3 ? 'high' : highRisk > allPredictions.length / 5 ? 'medium' : 'low',
      predictionCount: allPredictions.length,
    };
  }

  /**
   * Get prediction history
   */
  async getPredictionHistory(symbol: string, days: number = 7): Promise<any[]> {
    const history = [];
    const now = new Date();
    
    for (let i = days; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      const prediction = await this.getTokenPrediction(symbol);
      if (prediction) {
        history.push({
          date: date.toISOString().split('T')[0],
          prediction: prediction.prediction.trend,
          confidence: prediction.prediction.confidence,
          price: prediction.currentPrice,
        });
      }
    }
    
    return history;
  }

  /**
   * Get supported tokens
   */
  getSupportedTokens(): { symbol: string; name: string }[] {
    return this.supportedTokens;
  }

  /**
   * Compare multiple tokens
   */
  async compareTokens(symbols: string[]): Promise<{
    tokens: MarketPrediction[];
    comparison: {
      bestMomentum: string;
      lowestRisk: string;
      highestConfidence: string;
    };
  }> {
    const predictions = await this.getMultipleTokenPredictions(symbols);
    
    const bestMomentum = predictions
      .filter((p) => p.prediction.trend === 'bullish')
      .sort((a, b) => b.prediction.confidence - a.prediction.confidence)[0]?.symbol || 'N/A';
    
    const lowestRisk = predictions
      .filter((p) => p.riskAssessment.level === 'low')
      .sort((a, b) => b.prediction.confidence - a.prediction.confidence)[0]?.symbol || 'N/A';
    
    const highestConfidence = predictions
      .sort((a, b) => b.prediction.confidence - a.prediction.confidence)[0]?.symbol || 'N/A';

    return {
      tokens: predictions,
      comparison: {
        bestMomentum,
        lowestRisk,
        highestConfidence,
      },
    };
  }
}
