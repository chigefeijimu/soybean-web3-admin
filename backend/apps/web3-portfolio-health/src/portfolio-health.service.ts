import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

interface TokenHolding {
  symbol: string;
  balance: string;
  usdValue: number;
  contractAddress: string;
}

interface PortfolioHealthResult {
  address: string;
  overallScore: number;
  overallGrade: string;
  metrics: {
    diversificationScore: number;
    concentrationRisk: number;
    gasEfficiency: number;
    defiExposure: number;
    stablecoinRatio: number;
    volatilityScore: number;
  };
  recommendations: string[];
  tokenBreakdown: {
    category: string;
    value: number;
    percentage: number;
  }[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

@Injectable()
export class PortfolioHealthService {
  private readonly logger = new Logger(PortfolioHealthService.name);

  // Supported chains
  private readonly chainIds = [1, 137, 42161, 10, 56, 8453, 43114];

  // Known stablecoin addresses (simplified)
  private readonly stablecoins = new Set([
    '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // USDC
    '0x6b175474e89094c44da98b954eedeac495271d0f', // DAI
    '0x853d955aCEf822Db058eb8505911ED77F175b99e', // FRAX
    '0x4e3FBD56CD56c3e72c1403e103b45Db9da5B9D2B', // CBE
    '0x0000000000085d4780B73119b644AE5ecd22b376', // TUSD
    '0xdAC17F958D2ee523a2206206994597C13D831ec7', // USDT
    '0xbc6da0fe9ad5f3b0d58160288917aa0e33b9a638', // FRAX (Base)
  ]);

  constructor(private readonly httpService: HttpService) {}

  /**
   * Analyze portfolio health for a wallet address
   */
  async analyzePortfolioHealth(
    address: string,
    chainId: number = 1
  ): Promise<PortfolioHealthResult> {
    this.logger.log(`Analyzing portfolio health for ${address} on chain ${chainId}`);

    try {
      // Fetch portfolio data
      const portfolio = await this.fetchPortfolioData(address, chainId);
      
      if (!portfolio || !portfolio.tokens) {
        return this.getEmptyResult(address);
      }

      // Calculate metrics
      const tokens = portfolio.tokens;
      const totalValue = tokens.reduce((sum, t) => sum + (t.usdValue || 0), 0);

      if (totalValue === 0) {
        return this.getEmptyResult(address);
      }

      // Calculate individual scores
      const diversificationScore = this.calculateDiversificationScore(tokens, totalValue);
      const concentrationRisk = this.calculateConcentrationRisk(tokens, totalValue);
      const gasEfficiency = this.calculateGasEfficiency(tokens, totalValue, portfolio.ethBalance);
      const defiExposure = this.calculateDefiExposure(tokens, totalValue);
      const stablecoinRatio = this.calculateStablecoinRatio(tokens, totalValue);
      const volatilityScore = this.calculateVolatilityScore(tokens, totalValue);

      // Calculate overall score (weighted average)
      const overallScore = Math.round(
        diversificationScore * 0.25 +
        (100 - concentrationRisk) * 0.20 +
        gasEfficiency * 0.15 +
        defiExposure * 0.15 +
        stablecoinRatio * 0.15 +
        volatilityScore * 0.10
      );

      // Determine risk level
      const riskLevel = this.determineRiskLevel(overallScore, concentrationRisk, stablecoinRatio);

      // Generate recommendations
      const recommendations = this.generateRecommendations(
        diversificationScore,
        concentrationRisk,
        gasEfficiency,
        stablecoinRatio,
        riskLevel
      );

      // Token breakdown by category
      const tokenBreakdown = this.categorizeTokens(tokens, totalValue);

      return {
        address,
        overallScore,
        overallGrade: this.scoreToGrade(overallScore),
        metrics: {
          diversificationScore,
          concentrationRisk,
          gasEfficiency,
          defiExposure,
          stablecoinRatio,
          volatilityScore
        },
        recommendations,
        tokenBreakdown,
        riskLevel
      };
    } catch (error) {
      this.logger.error(`Error analyzing portfolio: ${error.message}`);
      return this.getEmptyResult(address);
    }
  }

  /**
   * Fetch portfolio data from the portfolio API
   */
  private async fetchPortfolioData(address: string, chainId: number) {
    try {
      // Try to fetch from portfolio analytics API
      const response = await firstValueFrom(
        this.httpService.get(
          `http://localhost:3000/web3/portfolio-analytics/portfolio/${address}`,
          { params: { chainId }, timeout: 10000 }
        ).catch(() => ({ data: null }))
      );
      
      if (response?.data) {
        return response.data;
      }

      // Fallback: return mock data structure for demo
      return {
        address,
        chainId,
        tokens: [],
        totalUsdValue: '0',
        ethBalance: '0'
      };
    } catch (error) {
      this.logger.warn(`Could not fetch portfolio data: ${error.message}`);
      return null;
    }
  }

  /**
   * Calculate diversification score (0-100)
   * Higher is better - more diversified portfolio
   */
  private calculateDiversificationScore(tokens: TokenHolding[], totalValue: number): number {
    if (tokens.length === 0) return 0;

    // Count tokens with meaningful value (>1% of portfolio)
    const significantTokens = tokens.filter(t => (t.usdValue / totalValue) > 0.01);
    const tokenCount = significantTokens.length;

    // Score based on token count
    // 1 token = 20, 2-3 = 40, 4-5 = 60, 6-10 = 80, 10+ = 100
    if (tokenCount >= 10) return 100;
    if (tokenCount >= 6) return 80;
    if (tokenCount >= 4) return 60;
    if (tokenCount >= 2) return 40;
    return 20;
  }

  /**
   * Calculate concentration risk (0-100)
   * Higher means more risky - single token dominates
   */
  private calculateConcentrationRisk(tokens: TokenHolding[], totalValue: number): number {
    if (tokens.length === 0 || totalValue === 0) return 0;

    // Find largest holding percentage
    const largestHolding = Math.max(...tokens.map(t => t.usdValue / totalValue));
    
    // If largest holding >50%, very high concentration risk
    // If largest holding <20%, low concentration risk
    return Math.min(100, Math.round(largestHolding * 200));
  }

  /**
   * Calculate gas efficiency score (0-100)
   */
  private calculateGasEfficiency(
    tokens: TokenHolding[],
    totalValue: number,
    ethBalance: string
  ): number {
    const ethValue = parseFloat(ethBalance) * 3000; // Assume ~$3000 ETH
    const ethRatio = totalValue > 0 ? (ethValue / totalValue) * 100 : 0;

    // Ideal: 5-15% ETH for gas
    if (ethRatio >= 5 && ethRatio <= 15) return 100;
    if (ethRatio < 5) return Math.max(20, ethRatio * 4);
    if (ethRatio > 30) return Math.max(20, 100 - (ethRatio - 30) * 2);
    return 70;
  }

  /**
   * Calculate DeFi exposure (0-100)
   */
  private calculateDefiExposure(tokens: TokenHolding[], totalValue: number): number {
    // DeFi tokens list (simplified)
    const defiTokens = new Set([
      'UNI', 'AAVE', 'MKR', 'COMP', 'SUSHI', 'CRV', 'LDO', 'SNX',
      'BAL', 'YFI', 'PERP', 'GMX', 'CR', 'FXS', 'CVX', 'RPL',
      'ENS', 'RNDR', 'IMX', 'OP', 'ARB', 'MATIC', 'LINK'
    ]);

    const defiValue = tokens
      .filter(t => defiTokens.has(t.symbol?.toUpperCase()))
      .reduce((sum, t) => sum + t.usdValue, 0);

    const defiRatio = totalValue > 0 ? (defiValue / totalValue) * 100 : 0;

    // Moderate DeFi exposure (20-40%) is healthy
    if (defiRatio >= 20 && defiRatio <= 40) return 100;
    if (defiRatio < 20) return defiRatio * 5;
    return Math.max(20, 100 - (defiRatio - 40));
  }

  /**
   * Calculate stablecoin ratio (0-100)
   */
  private calculateStablecoinRatio(tokens: TokenHolding[], totalValue: number): number {
    const stableValue = tokens
      .filter(t => this.stablecoins.has(t.contractAddress?.toLowerCase()))
      .reduce((sum, t) => sum + t.usdValue, 0);

    const stableRatio = totalValue > 0 ? (stableValue / totalValue) * 100 : 0;

    // 10-30% stablecoins is ideal
    if (stableRatio >= 10 && stableRatio <= 30) return 100;
    if (stableRatio < 10) return stableRatio * 10;
    return Math.max(20, 100 - (stableRatio - 30) * 3);
  }

  /**
   * Calculate volatility score based on portfolio composition
   */
  private calculateVolatilityScore(tokens: TokenHolding[], totalValue: number): number {
    // High volatility tokens
    const highVolTokens = new Set([
      'SHIB', 'DOGE', 'PEPE', 'WIF', 'BONK', 'SOL', 'AVAX', 'MATIC'
    ]);

    const volatileValue = tokens
      .filter(t => highVolTokens.has(t.symbol?.toUpperCase()))
      .reduce((sum, t) => sum + t.usdValue, 0);

    const volatileRatio = totalValue > 0 ? (volatileValue / totalValue) * 100 : 0;

    // Lower volatile token ratio = higher score
    return Math.max(20, 100 - volatileRatio * 2);
  }

  /**
   * Determine risk level based on multiple factors
   */
  private determineRiskLevel(
    overallScore: number,
    concentrationRisk: number,
    stablecoinRatio: number
  ): 'low' | 'medium' | 'high' | 'critical' {
    if (overallScore >= 75 && concentrationRisk < 40) return 'low';
    if (overallScore >= 50 && concentrationRisk < 60) return 'medium';
    if (overallScore >= 25) return 'high';
    return 'critical';
  }

  /**
   * Generate personalized recommendations
   */
  private generateRecommendations(
    diversificationScore: number,
    concentrationRisk: number,
    gasEfficiency: number,
    stablecoinRatio: number,
    riskLevel: string
  ): string[] {
    const recommendations: string[] = [];

    if (diversificationScore < 50) {
      recommendations.push('💡 Consider diversifying your portfolio across more assets to reduce risk');
    }

    if (concentrationRisk > 50) {
      recommendations.push('⚠️ Your portfolio is heavily concentrated in one asset. Consider rebalancing');
    }

    if (gasEfficiency < 50) {
      recommendations.push('⛽ Maintain a higher ETH balance (5-15%) for transaction fees');
    }

    if (stablecoinRatio < 10) {
      recommendations.push('💰 Consider adding some stablecoins for portfolio stability');
    }

    if (riskLevel === 'high' || riskLevel === 'critical') {
      recommendations.push('🚨 High risk detected! Review your portfolio allocation immediately');
    }

    if (recommendations.length === 0) {
      recommendations.push('✅ Your portfolio looks healthy! Keep up the good diversification');
    }

    return recommendations;
  }

  /**
   * Categorize tokens by type
   */
  private categorizeTokens(tokens: TokenHolding[], totalValue: number) {
    const categories: { [key: string]: number } = {
      'Stablecoins': 0,
      'Layer1': 0,
      'DeFi': 0,
      'NFT': 0,
      'Other': 0
    };

    const layer1Tokens = new Set(['ETH', 'BTC', 'BNB', 'SOL', 'AVAX', 'MATIC', 'ARB', 'OP']);
    const defiTokens = new Set(['UNI', 'AAVE', 'MKR', 'COMP', 'SUSHI', 'CRV', 'LDO', 'SNX', 'LINK']);

    tokens.forEach(token => {
      const symbol = token.symbol?.toUpperCase();
      const value = token.usdValue || 0;

      if (this.stablecoins.has(token.contractAddress?.toLowerCase())) {
        categories['Stablecoins'] += value;
      } else if (layer1Tokens.has(symbol)) {
        categories['Layer1'] += value;
      } else if (defiTokens.has(symbol)) {
        categories['DeFi'] += value;
      } else {
        categories['Other'] += value;
      }
    });

    return Object.entries(categories)
      .map(([category, value]) => ({
        category,
        value,
        percentage: totalValue > 0 ? (value / totalValue) * 100 : 0
      }))
      .filter(c => c.value > 0)
      .sort((a, b) => b.value - a.value);
  }

  /**
   * Convert score to letter grade
   */
  private scoreToGrade(score: number): string {
    if (score >= 90) return 'A+';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B+';
    if (score >= 60) return 'B';
    if (score >= 50) return 'C';
    if (score >= 40) return 'D';
    return 'F';
  }

  /**
   * Return empty result structure
   */
  private getEmptyResult(address: string): PortfolioHealthResult {
    return {
      address,
      overallScore: 0,
      overallGrade: 'N/A',
      metrics: {
        diversificationScore: 0,
        concentrationRisk: 0,
        gasEfficiency: 0,
        defiExposure: 0,
        stablecoinRatio: 0,
        volatilityScore: 0
      },
      recommendations: ['No portfolio data available'],
      tokenBreakdown: [],
      riskLevel: 'low'
    };
  }

  /**
   * Analyze multiple wallets
   */
  async analyzeMultipleWallets(addresses: string[], chainId: number = 1) {
    const results = await Promise.all(
      addresses.map(addr => this.analyzePortfolioHealth(addr, chainId))
    );
    return results;
  }
}
