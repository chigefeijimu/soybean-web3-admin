import { Injectable } from '@nestjs/common';

interface CorrelationResult {
  tokenA: string;
  tokenB: string;
  correlation: number;
}

interface HeatmapRow {
  token: string;
  values: { token: string; correlation: number }[];
}

interface DiversificationResult {
  diversificationScore: number;
  rating: string;
  averageCorrelation: number;
  riskyPairs: { tokenA: string; tokenB: string; correlation: number }[];
  recommendations: string[];
}

@Injectable()
export class TokenCorrelationService {
  // Popular tokens by chain
  private readonly popularTokens: Record<string, string[]> = {
    ethereum: ['ETH', 'WBTC', 'USDC', 'USDT', 'DAI', 'UNI', 'LINK', 'AAVE', 'MKR', 'CRV', 'SOL', 'MATIC'],
    arbitrum: ['ETH', 'ARB', 'USDC', 'USDT', 'UNI', 'MAGIC', 'GMX', 'DPX', 'RDNT'],
    optimism: ['ETH', 'OP', 'USDC', 'USDT', 'VELO', 'SNX', 'KDY', 'LYRA'],
    polygon: ['MATIC', 'USDC', 'USDT', 'QUICK', 'AAVE', 'GHST', 'CRV', 'BAL'],
    bsc: ['BNB', 'CAKE', 'BUSD', 'USDT', 'USDC', 'VENOM'],
    avalanche: ['AVAX', 'JOE', 'PNG', 'QI', 'PTP', 'YY'],
    base: ['ETH', 'CBETH', 'USDC', 'DEGEN', 'BASIS', 'BRETT'],
  };

  // Generate mock correlation data based on token pairs
  private generateCorrelationMatrix(tokens: string[], timeframe: string): CorrelationResult[] {
    const results: CorrelationResult[] = [];
    const seed = this.getTimeframeSeed(timeframe);

    for (let i = 0; i < tokens.length; i++) {
      for (let j = i + 1; j < tokens.length; j++) {
        // Generate realistic correlation values (-1 to 1)
        // Stablecoins tend to have high positive correlation
        const isStablecoin = ['USDC', 'USDT', 'DAI', 'BUSD', 'FRAX', 'TUSD', 'USDD'].includes(tokens[i]) ||
          ['USDC', 'USDT', 'DAI', 'BUSD', 'FRAX', 'TUSD', 'USDD'].includes(tokens[j]);

        const isSameCategory = (this.isDeFiToken(tokens[i]) && this.isDeFiToken(tokens[j])) ||
          (this.isEtherToken(tokens[i]) && this.isEtherToken(tokens[j]));

        let correlation: number;
        if (isStablecoin) {
          // Stablecoins have high correlation with each other
          correlation = 0.85 + Math.random() * 0.15;
        } else if (isSameCategory) {
          // Same category tokens have moderate correlation
          correlation = 0.3 + Math.random() * 0.5;
        } else {
          // Different categories have lower correlation
          correlation = -0.2 + Math.random() * 0.7;
        }

        // Apply timeframe factor
        const timeFactor = this.getTimeframeFactor(timeframe);
        correlation = Math.max(-1, Math.min(1, correlation * timeFactor + (Math.random() - 0.5) * 0.1 * seed));

        results.push({
          tokenA: tokens[i],
          tokenB: tokens[j],
          correlation: Number(correlation.toFixed(3)),
        });
      }
    }

    return results;
  }

  private getTimeframeSeed(timeframe: string): number {
    const seeds: Record<string, number> = {
      '7d': 0.9,
      '30d': 1.0,
      '90d': 1.1,
    };
    return seeds[timeframe] || 1.0;
  }

  private getTimeframeFactor(timeframe: string): number {
    const factors: Record<string, number> = {
      '7d': 1.2,
      '30d': 1.0,
      '90d': 0.8,
    };
    return factors[timeframe] || 1.0;
  }

  private isDeFiToken(token: string): boolean {
    const defiTokens = ['UNI', 'AAVE', 'MKR', 'CRV', 'SNX', 'BAL', 'COMP', 'SUSHI', 'YFI', 'PERP', 'GMX', 'RDNT'];
    return defiTokens.includes(token.toUpperCase());
  }

  private isEtherToken(token: string): boolean {
    const etherTokens = ['ETH', 'WETH', 'CBETH', 'STETH', 'RETH'];
    return etherTokens.includes(token.toUpperCase());
  }

  async getCorrelationMatrix(tokens: string[], chain: string, timeframe: string): Promise<CorrelationResult[]> {
    const normalizedChain = (chain || 'ethereum').toLowerCase();
    const tokenList = tokens && tokens.length > 0
      ? tokens.split(',').map(t => t.trim().toUpperCase())
      : this.popularTokens[normalizedChain] || this.popularTokens['ethereum'];

    return this.generateCorrelationMatrix(tokenList, timeframe);
  }

  async getHeatmapData(chain: string, timeframe: string): Promise<HeatmapRow[]> {
    const normalizedChain = (chain || 'ethereum').toLowerCase();
    const tokens = this.popularTokens[normalizedChain] || this.popularTokens['ethereum'];
    const correlations = this.generateCorrelationMatrix(tokens, timeframe);

    const heatmapData: HeatmapRow[] = tokens.map(token => ({
      token,
      values: tokens.map(t => {
        if (token === t) {
          return { token: t, correlation: 1 };
        }
        const corr = correlations.find(
          c => (c.tokenA === token && c.tokenB === t) || (c.tokenA === t && c.tokenB === token)
        );
        return { token: t, correlation: corr ? corr.correlation : 0 };
      }),
    }));

    return heatmapData;
  }

  async getTopCorrelations(token: string, chain: string, timeframe: string, limit: number = 10): Promise<CorrelationResult[]> {
    const normalizedChain = (chain || 'ethereum').toLowerCase();
    const tokens = this.popularTokens[normalizedChain] || this.popularTokens['ethereum'];

    // Filter to only pairs containing the specified token
    const allCorrelations = this.generateCorrelationMatrix(tokens, timeframe);
    const tokenCorrelations = allCorrelations
      .filter(c => c.tokenA === token.toUpperCase() || c.tokenB === token.toUpperCase())
      .sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));

    return tokenCorrelations.slice(0, limit);
  }

  async getDiversificationScore(tokens: string, chain: string, timeframe: string): Promise<DiversificationResult> {
    const normalizedChain = (chain || 'ethereum').toLowerCase();
    const tokenList = tokens.split(',').map(t => t.trim().toUpperCase());

    const correlations = this.generateCorrelationMatrix(tokenList, timeframe);

    // Calculate average absolute correlation
    const avgCorrelation = correlations.reduce((sum, c) => sum + Math.abs(c.correlation), 0) / correlations.length;

    // Diversification score: lower average correlation = higher score
    const diversificationScore = Math.round(Math.max(0, Math.min(100, 100 - avgCorrelation * 100)));

    // Determine rating
    let rating: string;
    if (diversificationScore >= 70) {
      rating = 'excellent';
    } else if (diversificationScore >= 50) {
      rating = 'good';
    } else if (diversificationScore >= 30) {
      rating = 'fair';
    } else {
      rating = 'poor';
    }

    // Find risky pairs (high correlation > 0.7)
    const riskyPairs = correlations
      .filter(c => c.correlation > 0.7)
      .sort((a, b) => b.correlation - a.correlation)
      .slice(0, 5);

    // Generate recommendations
    const recommendations: string[] = [];
    if (diversificationScore < 50) {
      recommendations.push('Consider adding more uncorrelated assets to reduce risk');
    }
    if (riskyPairs.length > 3) {
      recommendations.push('You have several highly correlated pairs - consider diversifying');
    }
    if (avgCorrelation > 0.6) {
      recommendations.push('Your portfolio is heavily correlated - add stablecoins or assets from different categories');
    }
    if (tokenList.length < 5) {
      recommendations.push('Add more unique assets to improve diversification');
    }
    recommendations.push('Consider adding assets with negative correlation for better risk-adjusted returns');

    return {
      diversificationScore,
      rating,
      averageCorrelation: Number(avgCorrelation.toFixed(3)),
      riskyPairs,
      recommendations,
    };
  }

  async getTrendingCorrelations(chain: string, timeframe: string): Promise<{ pairs: CorrelationResult[]; summary: string }> {
    const normalizedChain = (chain || 'ethereum').toLowerCase();
    const tokens = this.popularTokens[normalizedChain].slice(0, 6);
    const correlations = this.generateCorrelationMatrix(tokens, timeframe);

    const sorted = [...correlations].sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));

    const summary = `Trending: ${sorted[0]?.tokenA} and ${sorted[0]?.tokenB} show strongest correlation at ${sorted[0]?.correlation.toFixed(2)}`;

    return {
      pairs: sorted.slice(0, 5),
      summary,
    };
  }
}
