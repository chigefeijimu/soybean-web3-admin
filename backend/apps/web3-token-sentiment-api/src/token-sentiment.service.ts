import { Injectable } from '@nestjs/common';

export interface TokenSentiment {
  symbol: string;
  name: string;
  chain: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  sentimentScore: number; // 0-100
  priceChange24h: number;
  volumeChange24h: number;
  socialScore: number;
  chainActivityScore: number;
  technicalScore: number;
  fearGreedIndex: number;
  signals: {
    type: 'buy' | 'sell' | 'hold';
    strength: number; // 0-100
    reason: string;
  }[];
  metrics: {
    dominance: number;
    marketCap: number;
    volume24h: number;
    holders: number;
    transactions24h: number;
  };
  timestamp: number;
}

export interface SentimentHistory {
  symbol: string;
  history: {
    timestamp: number;
    sentimentScore: number;
    price: number;
  }[];
}

@Injectable()
export class TokenSentimentService {
  // Supported tokens for sentiment analysis
  private readonly supportedTokens = [
    { symbol: 'ETH', name: 'Ethereum', chain: 'ethereum' },
    { symbol: 'BTC', name: 'Bitcoin', chain: 'bitcoin' },
    { symbol: 'SOL', name: 'Solana', chain: 'solana' },
    { symbol: 'BNB', name: 'BNB', chain: 'bsc' },
    { symbol: 'XRP', name: 'XRP', chain: 'ripple' },
    { symbol: 'ADA', name: 'Cardano', chain: 'cardano' },
    { symbol: 'AVAX', name: 'Avalanche', chain: 'avalanche' },
    { symbol: 'DOGE', name: 'Dogecoin', chain: 'dogecoin' },
    { symbol: 'DOT', name: 'Polkadot', chain: 'polkadot' },
    { symbol: 'MATIC', name: 'Polygon', chain: 'polygon' },
    { symbol: 'LINK', name: 'Chainlink', chain: 'ethereum' },
    { symbol: 'UNI', name: 'Uniswap', chain: 'ethereum' },
    { symbol: 'AAVE', name: 'Aave', chain: 'ethereum' },
    { symbol: 'MKR', name: 'Maker', chain: 'ethereum' },
    { symbol: 'CRV', name: 'Curve DAO', chain: 'ethereum' },
    { symbol: 'LDO', name: 'Lido DAO', chain: 'ethereum' },
    { symbol: 'ARB', name: 'Arbitrum', chain: 'arbitrum' },
    { symbol: 'OP', name: 'Optimism', chain: 'optimism' },
    { symbol: 'APT', name: 'Aptos', chain: 'aptos' },
    { symbol: 'SAND', name: 'The Sandbox', chain: 'ethereum' },
  ];

  // Simulated sentiment data for tokens
  private generateSentiment(symbol: string): TokenSentiment {
    const token = this.supportedTokens.find(t => t.symbol === symbol) || {
      symbol,
      name: symbol,
      chain: 'ethereum'
    };

    // Generate realistic-looking sentiment data
    const basePrice = this.getBasePrice(symbol);
    const priceChange = (Math.random() - 0.5) * 20; // -10% to +10%
    const volumeChange = (Math.random() - 0.5) * 50; // -25% to +25%
    
    // Calculate sentiment score based on various factors
    const socialScore = Math.floor(Math.random() * 40) + 60; // 60-100
    const chainActivityScore = Math.floor(Math.random() * 40) + 50; // 50-90
    const technicalScore = Math.floor(Math.random() * 50) + 40; // 40-90
    
    const sentimentScore = Math.floor(
      (socialScore * 0.3 + chainActivityScore * 0.3 + technicalScore * 0.4)
    );
    
    const fearGreedIndex = Math.floor(Math.random() * 100);
    
    let sentiment: 'bullish' | 'bearish' | 'neutral';
    if (sentimentScore >= 65) sentiment = 'bullish';
    else if (sentimentScore <= 35) sentiment = 'bearish';
    else sentiment = 'neutral';
    
    // Generate signals
    const signals = this.generateSignals(sentimentScore, priceChange, fearGreedIndex);
    
    // Generate metrics
    const metrics = this.generateMetrics(symbol);
    
    return {
      symbol: token.symbol,
      name: token.name,
      chain: token.chain,
      sentiment,
      sentimentScore,
      priceChange24h: Number(priceChange.toFixed(2)),
      volumeChange24h: Number(volumeChange.toFixed(2)),
      socialScore,
      chainActivityScore,
      technicalScore,
      fearGreedIndex,
      signals,
      metrics,
      timestamp: Date.now(),
    };
  }

  private getBasePrice(symbol: string): number {
    const prices: Record<string, number> = {
      ETH: 2500,
      BTC: 62500,
      SOL: 120,
      BNB: 580,
      XRP: 0.55,
      ADA: 0.45,
      AVAX: 35,
      DOGE: 0.12,
      DOT: 7.5,
      MATIC: 0.85,
      LINK: 15,
      UNI: 7.5,
      AAVE: 95,
      MKR: 1500,
      CRV: 0.55,
      LDO: 2.2,
      ARB: 1.8,
      OP: 2.5,
      APT: 8.5,
      SAND: 0.45,
    };
    return prices[symbol] || 1;
  }

  private generateSignals(
    sentimentScore: number,
    priceChange: number,
    fearGreedIndex: number
  ): TokenSentiment['signals'] {
    const signals: TokenSentiment['signals'] = [];
    
    // Price momentum signal
    if (priceChange > 5) {
      signals.push({
        type: 'buy',
        strength: Math.min(Math.abs(priceChange) * 8, 90),
        reason: 'Strong positive price momentum (+' + priceChange.toFixed(1) + '%)',
      });
    } else if (priceChange < -5) {
      signals.push({
        type: 'sell',
        strength: Math.min(Math.abs(priceChange) * 8, 90),
        reason: 'Negative price momentum (' + priceChange.toFixed(1) + '%)',
      });
    }
    
    // Fear & Greed signal
    if (fearGreedIndex < 25) {
      signals.push({
        type: 'buy',
        strength: 100 - fearGreedIndex,
        reason: 'Extreme fear in market (index: ' + fearGreedIndex + ')',
      });
    } else if (fearGreedIndex > 75) {
      signals.push({
        type: 'sell',
        strength: fearGreedIndex,
        reason: 'Extreme greed in market (index: ' + fearGreedIndex + ')',
      });
    }
    
    // Sentiment-based signal
    if (sentimentScore > 70) {
      signals.push({
        type: 'buy',
        strength: sentimentScore,
        reason: 'Strong positive sentiment (score: ' + sentimentScore + ')',
      });
    } else if (sentimentScore < 30) {
      signals.push({
        type: 'sell',
        strength: 100 - sentimentScore,
        reason: 'Strong negative sentiment (score: ' + sentimentScore + ')',
      });
    }
    
    // Default hold if no strong signals
    if (signals.length === 0) {
      signals.push({
        type: 'hold',
        strength: 60,
        reason: 'No strong signals detected, maintain current position',
      });
    }
    
    return signals;
  }

  private generateMetrics(symbol: string): TokenSentiment['metrics'] {
    const basePrice = this.getBasePrice(symbol);
    const marketCaps: Record<string, number> = {
      ETH: 300000000000,
      BTC: 1200000000000,
      SOL: 50000000000,
      BNB: 85000000000,
      XRP: 30000000000,
      ADA: 16000000000,
      AVAX: 12000000000,
      DOGE: 17000000000,
      DOT: 10000000000,
      MATIC: 7500000000,
    };
    
    const marketCap = marketCaps[symbol] || basePrice * 1000000000;
    const volume24h = marketCap * (0.02 + Math.random() * 0.08);
    const dominance = symbol === 'BTC' ? 52 : symbol === 'ETH' ? 18 : Math.random() * 3;
    
    return {
      dominance: Number(dominance.toFixed(2)),
      marketCap,
      volume24h: Number(volume24h.toFixed(0)),
      holders: Math.floor(Math.random() * 1000000) + 10000,
      transactions24h: Math.floor(Math.random() * 500000) + 10000,
    };
  }

  // Get sentiment for a single token
  async getTokenSentiment(symbol: string): Promise<TokenSentiment> {
    const upperSymbol = symbol.toUpperCase();
    return this.generateSentiment(upperSymbol);
  }

  // Get sentiment for multiple tokens
  async getMultipleTokenSentiment(symbols: string[]): Promise<TokenSentiment[]> {
    return symbols.map(symbol => this.generateSentiment(symbol.toUpperCase()));
  }

  // Get all supported tokens sentiment
  async getAllTokensSentiment(): Promise<TokenSentiment[]> {
    return this.supportedTokens.map(token => this.generateSentiment(token.symbol));
  }

  // Get top sentiment tokens (most bullish)
  async getTopBullishTokens(limit: number = 10): Promise<TokenSentiment[]> {
    const allSentiments = this.supportedTokens.map(token => 
      this.generateSentiment(token.symbol)
    );
    
    return allSentiments
      .sort((a, b) => b.sentimentScore - a.sentimentScore)
      .slice(0, limit);
  }

  // Get top bearish tokens
  async getTopBearishTokens(limit: number = 10): Promise<TokenSentiment[]> {
    const allSentiments = this.supportedTokens.map(token => 
      this.generateSentiment(token.symbol)
    );
    
    return allSentiments
      .sort((a, b) => a.sentimentScore - b.sentimentScore)
      .slice(0, limit);
  }

  // Get market overview
  async getMarketSentimentOverview(): Promise<{
    overallSentiment: 'bullish' | 'bearish' | 'neutral';
    averageSentimentScore: number;
    fearGreedIndex: number;
    totalTokensAnalyzed: number;
    bullishCount: number;
    bearishCount: number;
    neutralCount: number;
    topGainers: TokenSentiment[];
    topLosers: TokenSentiment[];
  }> {
    const allSentiments = this.supportedTokens.map(token => 
      this.generateSentiment(token.symbol)
    );
    
    const avgScore = Math.floor(
      allSentiments.reduce((sum, t) => sum + t.sentimentScore, 0) / allSentiments.length
    );
    
    const bullishCount = allSentiments.filter(t => t.sentiment === 'bullish').length;
    const bearishCount = allSentiments.filter(t => t.sentiment === 'bearish').length;
    const neutralCount = allSentiments.filter(t => t.sentiment === 'neutral').length;
    
    let overallSentiment: 'bullish' | 'bearish' | 'neutral';
    if (avgScore >= 60) overallSentiment = 'bullish';
    else if (avgScore <= 40) overallSentiment = 'bearish';
    else overallSentiment = 'neutral';
    
    const fearGreedIndex = Math.floor(Math.random() * 100);
    
    const sortedByPrice = [...allSentiments].sort((a, b) => 
      b.priceChange24h - a.priceChange24h
    );
    
    return {
      overallSentiment,
      averageSentimentScore: avgScore,
      fearGreedIndex,
      totalTokensAnalyzed: allSentiments.length,
      bullishCount,
      bearishCount,
      neutralCount,
      topGainers: sortedByPrice.slice(0, 5),
      topLosers: sortedByPrice.slice(-5).reverse(),
    };
  }

  // Get sentiment history (simulated)
  async getSentimentHistory(
    symbol: string, 
    days: number = 7
  ): Promise<SentimentHistory> {
    const upperSymbol = symbol.toUpperCase();
    const history: SentimentHistory['history'] = [];
    const now = Date.now();
    const basePrice = this.getBasePrice(upperSymbol);
    
    for (let i = days; i >= 0; i--) {
      const timestamp = now - i * 24 * 60 * 60 * 1000;
      const sentimentScore = Math.floor(Math.random() * 60) + 20;
      const priceVariation = (Math.random() - 0.5) * 0.1;
      const price = basePrice * (1 + priceVariation);
      
      history.push({
        timestamp,
        sentimentScore,
        price: Number(price.toFixed(2)),
      });
    }
    
    return {
      symbol: upperSymbol,
      history,
    };
  }

  // Get supported tokens list
  getSupportedTokens(): { symbol: string; name: string; chain: string }[] {
    return this.supportedTokens;
  }
}
