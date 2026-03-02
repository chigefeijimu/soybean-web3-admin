import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';

interface PriceData {
  symbol: string;
  prices: number[];
  timestamps: number[];
}

@Injectable()
export class TokenCorrelationService {
  private readonly coingeckoBaseUrl = 'https://api.coingecko.com/api/v3';
  private readonly chainToId: Record<string, string> = {
    ethereum: 'ethereum',
    polygon: 'matic-network',
    arbitrum: 'arbitrum',
    optimism: 'optimism',
    bsc: 'binancecoin',
    avalanche: 'avalanche-2',
    base: 'base',
    solana: 'solana',
  };

  private readonly popularTokens: Record<string, string> = {
    ETH: 'ethereum',
    BTC: 'bitcoin',
    SOL: 'solana',
    BNB: 'binancecoin',
    XRP: 'ripple',
    ADA: 'cardano',
    MATIC: 'matic-network',
    AVAX: 'avalanche-2',
    LINK: 'chainlink',
    UNI: 'uniswap',
    AAVE: 'aave',
    MKR: 'maker',
    CRV: 'curve-dao-token',
    WBTC: 'wrapped-bitcoin',
    DOGE: 'dogecoin',
    SHIB: 'shiba-inu',
    DOT: 'polkadot',
    ATOM: 'cosmos',
    LTC: 'litecoin',
    FIL: 'filecoin',
  };

  async getCorrelationMatrix(
    tokens: string[],
    chain: string = 'ethereum',
    timeframe: string = '30d',
  ): Promise<any> {
    try {
      const days = this.getDaysFromTimeframe(timeframe);
      const coinIds = tokens.map(t => this.popularTokens[t.toUpperCase()] || t.toLowerCase());
      
      // Fetch price data for all tokens
      const priceData = await this.fetchPriceData(coinIds, days);
      
      // Calculate correlation matrix
      const correlationMatrix = this.calculateCorrelationMatrix(priceData);
      
      // Build response
      const matrix: any[] = [];
      tokens.forEach((tokenA, i) => {
        tokens.forEach((tokenB, j) => {
          matrix.push({
            tokenA,
            tokenB,
            correlation: correlationMatrix[i][j],
            strength: this.getCorrelationStrength(correlationMatrix[i][j]),
          });
        });
      });

      return {
        success: true,
        chain,
        timeframe,
        tokens,
        matrix,
        summary: this.generateSummary(correlationMatrix, tokens),
        generatedAt: new Date().toISOString(),
      };
    } catch (error) {
      throw new HttpException(
        `Failed to calculate correlation matrix: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getTopCorrelations(
    token: string,
    chain: string = 'ethereum',
    timeframe: string = '30d',
    limit: number = 10,
  ): Promise<any> {
    try {
      const days = this.getDaysFromTimeframe(timeframe);
      const coinId = this.popularTokens[token.toUpperCase()] || token.toLowerCase();
      
      // Get all popular tokens except the query token
      const otherTokens = Object.keys(this.popularTokens).filter(
        t => t.toUpperCase() !== token.toUpperCase()
      );
      
      const allTokens = [token.toUpperCase(), ...otherTokens.slice(0, 19)];
      const coinIds = allTokens.map(t => this.popularTokens[t] || t.toLowerCase());
      
      const priceData = await this.fetchPriceData(coinIds, days);
      const correlationMatrix = this.calculateCorrelationMatrix(priceData);
      
      // Find correlations for the specified token
      const tokenIndex = 0; // First token is the query token
      const correlations: any[] = [];
      
      allTokens.slice(1).forEach((otherToken, i) => {
        const corr = correlationMatrix[tokenIndex][i + 1];
        correlations.push({
          token: otherToken,
          correlation: corr,
          strength: this.getCorrelationStrength(corr),
          type: corr > 0 ? 'positive' : 'negative',
        });
      });

      // Sort by absolute correlation value
      correlations.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));
      
      return {
        success: true,
        baseToken: token,
        chain,
        timeframe,
        correlations: correlations.slice(0, limit),
        generatedAt: new Date().toISOString(),
      };
    } catch (error) {
      throw new HttpException(
        `Failed to get top correlations: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getDiversificationScore(
    tokens: string[],
    chain: string = 'ethereum',
    timeframe: string = '30d',
  ): Promise<any> {
    try {
      const days = this.getDaysFromTimeframe(timeframe);
      const coinIds = tokens.map(t => this.popularTokens[t.toUpperCase()] || t.toLowerCase());
      
      const priceData = await this.fetchPriceData(coinIds, days);
      const correlationMatrix = this.calculateCorrelationMatrix(priceData);
      
      // Calculate average correlation (excluding diagonal)
      let sum = 0;
      let count = 0;
      for (let i = 0; i < correlationMatrix.length; i++) {
        for (let j = 0; j < correlationMatrix[i].length; j++) {
          if (i !== j) {
            sum += correlationMatrix[i][j];
            count++;
          }
        }
      }
      const avgCorrelation = sum / count;
      
      // Calculate diversification score (lower avg correlation = higher diversification)
      const diversificationScore = Math.max(0, Math.min(100, (1 - Math.abs(avgCorrelation)) * 100));
      
      // Identify highly correlated pairs that may reduce diversification
      const riskyPairs: any[] = [];
      for (let i = 0; i < tokens.length; i++) {
        for (let j = i + 1; j < tokens.length; j++) {
          const corr = correlationMatrix[i][j];
          if (Math.abs(corr) > 0.7) {
            riskyPairs.push({
              tokenA: tokens[i],
              tokenB: tokens[j],
              correlation: corr,
            });
          }
        }
      }

      // Generate recommendations
      const recommendations: string[] = [];
      if (diversificationScore < 50) {
        recommendations.push('Consider adding more uncorrelated assets to improve diversification');
      }
      if (riskyPairs.length > 0) {
        recommendations.push(`Found ${riskyPairs.length} highly correlated pairs - consider reducing exposure`);
      }
      if (avgCorrelation > 0.5) {
        recommendations.push('Your portfolio is highly correlated - consider Bitcoin or stablecoins as diversifiers');
      }
      if (diversificationScore > 70) {
        recommendations.push('Good diversification! Your portfolio has a healthy mix of assets');
      }

      return {
        success: true,
        tokens,
        chain,
        timeframe,
        diversificationScore: Math.round(diversificationScore),
        averageCorrelation: Math.round(avgCorrelation * 100) / 100,
        rating: this.getDiversificationRating(diversificationScore),
        riskyPairs,
        recommendations,
        generatedAt: new Date().toISOString(),
      };
    } catch (error) {
      throw new HttpException(
        `Failed to calculate diversification score: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getTrendingCorrelations(chain: string, timeframe: string): Promise<any> {
    try {
      const topTokens = ['ETH', 'BTC', 'SOL', 'BNB', 'XRP', 'ADA', 'MATIC', 'AVAX', 'LINK', 'UNI'];
      return this.getCorrelationMatrix(topTokens, chain, timeframe);
    } catch (error) {
      throw new HttpException(
        `Failed to get trending correlations: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getHeatmapData(chain: string, timeframe: string): Promise<any> {
    try {
      const days = this.getDaysFromTimeframe(timeframe);
      const tokens = ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'ADA', 'MATIC', 'AVAX'];
      const coinIds = tokens.map(t => this.popularTokens[t]);
      
      const priceData = await this.fetchPriceData(coinIds, days);
      const correlationMatrix = this.calculateCorrelationMatrix(priceData);
      
      // Format for heatmap
      const heatmapData = tokens.map((token, i) => ({
        token,
        values: tokens.map((_, j) => ({
          token: tokens[j],
          correlation: Math.round(correlationMatrix[i][j] * 100) / 100,
          color: this.getCorrelationColor(correlationMatrix[i][j]),
        })),
      }));

      return {
        success: true,
        chain,
        timeframe,
        heatmap: heatmapData,
        generatedAt: new Date().toISOString(),
      };
    } catch (error) {
      throw new HttpException(
        `Failed to get heatmap data: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private async fetchPriceData(coinIds: string[], days: number): Promise<PriceData[]> {
    const priceData: PriceData[] = [];
    
    // Use CoinGecko API to fetch historical prices
    const ids = coinIds.join(',');
    const url = `${this.coingeckoBaseUrl}/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&per_page=20&page=1&sparkline=true&price_change_percentage=${days}d`;
    
    const response = await axios.get(url, {
      headers: { 'Accept': 'application/json' },
      timeout: 30000,
    });

    const data = response.data;
    
    for (const coin of data) {
      if (coin.sparkline_in_7d?.price) {
        const prices = coin.sparkline_in_7d.price.slice(-days * 24);
        priceData.push({
          symbol: coin.symbol.toUpperCase(),
          prices,
          timestamps: prices.map((_, i) => Date.now() - (prices.length - i) * 3600000),
        });
      }
    }

    return priceData;
  }

  private calculateCorrelationMatrix(priceData: PriceData[]): number[][] {
    const n = priceData.length;
    const matrix: number[][] = Array(n).fill(null).map(() => Array(n).fill(0));

    // Normalize prices (calculate returns)
    const returns = priceData.map(data => {
      const prices = data.prices;
      const ret: number[] = [];
      for (let i = 1; i < prices.length; i++) {
        ret.push((prices[i] - prices[i - 1]) / prices[i - 1]);
      }
      return ret;
    });

    // Calculate correlation for each pair
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i === j) {
          matrix[i][j] = 1;
        } else if (i < j) {
          const corr = this.pearsonCorrelation(returns[i], returns[j]);
          matrix[i][j] = corr;
          matrix[j][i] = corr;
        }
      }
    }

    return matrix;
  }

  private pearsonCorrelation(x: number[], y: number[]): number {
    const n = Math.min(x.length, y.length);
    if (n === 0) return 0;

    const sumX = x.slice(0, n).reduce((a, b) => a + b, 0);
    const sumY = y.slice(0, n).reduce((a, b) => a + b, 0);
    const sumXY = x.slice(0, n).reduce((total, xi, i) => total + xi * y[i], 0);
    const sumX2 = x.slice(0, n).reduce((total, xi) => total + xi * xi, 0);
    const sumY2 = y.slice(0, n).reduce((total, yi) => total + yi * yi, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

    if (denominator === 0) return 0;
    return Math.round((numerator / denominator) * 1000) / 1000;
  }

  private getCorrelationStrength(correlation: number): string {
    const abs = Math.abs(correlation);
    if (abs >= 0.8) return 'very-strong';
    if (abs >= 0.6) return 'strong';
    if (abs >= 0.4) return 'moderate';
    if (abs >= 0.2) return 'weak';
    return 'very-weak';
  }

  private getCorrelationColor(correlation: number): string {
    if (correlation >= 0.8) return '#166534'; // dark green
    if (correlation >= 0.6) return '#22c55e'; // green
    if (correlation >= 0.4) return '#86efac'; // light green
    if (correlation >= 0.2) return '#dcfce7'; // very light green
    if (correlation >= 0) return '#f0fdf4'; // almost white
    if (correlation >= -0.2) return '#fef2f2'; // very light red
    if (correlation >= -0.4) return '#fecaca'; // light red
    if (correlation >= -0.6) return '#f87171'; // red
    if (correlation >= -0.8) return '#dc2626'; // dark red
    return '#991b1b'; // very dark red
  }

  private getDiversificationRating(score: number): string {
    if (score >= 80) return 'excellent';
    if (score >= 60) return 'good';
    if (score >= 40) return 'moderate';
    if (score >= 20) return 'poor';
    return 'very-poor';
  }

  private generateSummary(matrix: number[][], tokens: string[]): any {
    // Find strongest positive and negative correlations
    let maxCorr = -1;
    let minCorr = 1;
    let maxPair: [string, string] = ['', ''];
    let minPair: [string, string] = ['', ''];

    for (let i = 0; i < tokens.length; i++) {
      for (let j = i + 1; j < tokens.length; j++) {
        if (matrix[i][j] > maxCorr) {
          maxCorr = matrix[i][j];
          maxPair = [tokens[i], tokens[j]];
        }
        if (matrix[i][j] < minCorr) {
          minCorr = matrix[i][j];
          minPair = [tokens[i], tokens[j]];
        }
      }
    }

    // Calculate average correlation
    let sum = 0;
    let count = 0;
    for (let i = 0; i < matrix.length; i++) {
      for (let j = i + 1; j < matrix[i].length; j++) {
        sum += matrix[i][j];
        count++;
      }
    }
    const avgCorrelation = sum / count;

    return {
      strongestPositive: { pair: maxPair, correlation: maxCorr },
      strongestNegative: { pair: minPair, correlation: minCorr },
      averageCorrelation: Math.round(avgCorrelation * 100) / 100,
    };
  }

  private getDaysFromTimeframe(timeframe: string): number {
    switch (timeframe) {
      case '7d': return 7;
      case '30d': return 30;
      case '90d': return 90;
      default: return 30;
    }
  }
}
