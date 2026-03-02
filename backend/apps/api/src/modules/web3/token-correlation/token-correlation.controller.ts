import { Controller, Get, Query } from '@nestjs/common';

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

@Controller('web3/token-correlation')
export class TokenCorrelationController {
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

  @Get('matrix')
  async getCorrelationMatrix(
    @Query('tokens') tokens: string,
    @Query('chain') chain: string = 'ethereum',
    @Query('timeframe') timeframe: string = '30d',
  ) {
    const normalizedChain = chain?.toLowerCase() || 'ethereum';
    const tokenList = tokens && tokens.length > 0
      ? tokens.split(',').map(t => t.trim().toUpperCase())
      : this.popularTokens[normalizedChain] || this.popularTokens['ethereum'];

    const correlations = this.generateCorrelationMatrix(tokenList, timeframe);
    return { success: true, data: correlations };
  }

  @Get('heatmap-data')
  async getHeatmapData(
    @Query('chain') chain: string = 'ethereum',
    @Query('timeframe') timeframe: string = '30d',
  ) {
    const normalizedChain = chain?.toLowerCase() || 'ethereum';
    const tokens = this.popularTokens[normalizedChain] || this.popularTokens['ethereum'];
    const correlations = this.generateCorrelationMatrix(tokens, timeframe);

    const heatmapData: HeatmapRow[] = tokens.map(token => ({
      token,
      values: tokens.map(t => {
        if (token === t) return { token: t, correlation: 1 };
        const corr = correlations.find(
          c => (c.tokenA === token && c.tokenB === t) || (c.tokenA === t && c.tokenB === token)
        );
        return { token: t, correlation: corr ? corr.correlation : 0 };
      }),
    }));

    return { success: true, data: heatmapData };
  }

  @Get('top-correlations')
  async getTopCorrelations(
    @Query('token') token: string,
    @Query('chain') chain: string = 'ethereum',
    @Query('timeframe') timeframe: string = '30d',
    @Query('limit') limit: string = '10',
  ) {
    const normalizedChain = chain?.toLowerCase() || 'ethereum';
    const tokens = this.popularTokens[normalizedChain] || this.popularTokens['ethereum'];
    const allCorrelations = this.generateCorrelationMatrix(tokens, timeframe);

    const tokenCorrelations = allCorrelations
      .filter(c => c.tokenA === token?.toUpperCase() || c.tokenB === token?.toUpperCase())
      .sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));

    return { success: true, data: tokenCorrelations.slice(0, parseInt(limit, 10)) };
  }

  @Get('diversification-score')
  async getDiversificationScore(
    @Query('tokens') tokens: string,
    @Query('chain') chain: string = 'ethereum',
    @Query('timeframe') timeframe: string = '30d',
  ) {
    const normalizedChain = chain?.toLowerCase() || 'ethereum';
    const tokenList = tokens.split(',').map(t => t.trim().toUpperCase());

    const correlations = this.generateCorrelationMatrix(tokenList, timeframe);
    const avgCorrelation = correlations.reduce((sum, c) => sum + Math.abs(c.correlation), 0) / correlations.length;

    const diversificationScore = Math.round(Math.max(0, Math.min(100, 100 - avgCorrelation * 100)));

    let rating: string;
    if (diversificationScore >= 70) rating = 'excellent';
    else if (diversificationScore >= 50) rating = 'good';
    else if (diversificationScore >= 30) rating = 'fair';
    else rating = 'poor';

    const riskyPairs = correlations.filter(c => c.correlation > 0.7).sort((a, b) => b.correlation - a.correlation).slice(0, 5);

    const recommendations: string[] = [];
    if (diversificationScore < 50) recommendations.push('Consider adding more uncorrelated assets to reduce risk');
    if (riskyPairs.length > 3) recommendations.push('You have several highly correlated pairs - consider diversifying');
    if (avgCorrelation > 0.6) recommendations.push('Your portfolio is heavily correlated');
    if (tokenList.length < 5) recommendations.push('Add more unique assets to improve diversification');
    recommendations.push('Consider adding assets with negative correlation for better risk-adjusted returns');

    const result: DiversificationResult = {
      diversificationScore,
      rating,
      averageCorrelation: Number(avgCorrelation.toFixed(3)),
      riskyPairs,
      recommendations,
    };

    return { success: true, data: result };
  }

  @Get('trending')
  async getTrendingCorrelations(
    @Query('chain') chain: string = 'ethereum',
    @Query('timeframe') timeframe: string = '30d',
  ) {
    const normalizedChain = chain?.toLowerCase() || 'ethereum';
    const tokens = this.popularTokens[normalizedChain].slice(0, 6);
    const correlations = this.generateCorrelationMatrix(tokens, timeframe);
    const sorted = [...correlations].sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));

    const summary = `Trending: ${sorted[0]?.tokenA} and ${sorted[0]?.tokenB} show strongest correlation at ${sorted[0]?.correlation.toFixed(2)}`;

    return { success: true, data: { pairs: sorted.slice(0, 5), summary } };
  }

  private generateCorrelationMatrix(tokens: string[], timeframe: string): CorrelationResult[] {
    const results: CorrelationResult[] = [];
    const seed = { '7d': 0.9, '30d': 1.0, '90d': 1.1 }[timeframe] || 1.0;

    for (let i = 0; i < tokens.length; i++) {
      for (let j = i + 1; j < tokens.length; j++) {
        const isStablecoin = ['USDC', 'USDT', 'DAI', 'BUSD', 'FRAX', 'TUSD', 'USDD'].includes(tokens[i]) ||
          ['USDC', 'USDT', 'DAI', 'BUSD', 'FRAX', 'TUSD', 'USDD'].includes(tokens[j]);

        const defiTokens = ['UNI', 'AAVE', 'MKR', 'CRV', 'SNX', 'BAL', 'COMP', 'SUSHI', 'YFI', 'PERP', 'GMX', 'RDNT'];
        const isSameCategory = (defiTokens.includes(tokens[i]) && defiTokens.includes(tokens[j])) ||
          (tokens[i] === 'ETH' && tokens[j] === 'ETH');

        let correlation: number;
        if (isStablecoin) correlation = 0.85 + Math.random() * 0.15;
        else if (isSameCategory) correlation = 0.3 + Math.random() * 0.5;
        else correlation = -0.2 + Math.random() * 0.7;

        const timeFactor = { '7d': 1.2, '30d': 1.0, '90d': 0.8 }[timeframe] || 1.0;
        correlation = Math.max(-1, Math.min(1, correlation * timeFactor + (Math.random() - 0.5) * 0.1 * seed));

        results.push({ tokenA: tokens[i], tokenB: tokens[j], correlation: Number(correlation.toFixed(3)) });
      }
    }
    return results;
  }
}
