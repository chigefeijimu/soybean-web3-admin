import { Injectable } from '@nestjs/common';

export interface ReputationFactors {
  walletAge: number;
  transactionCount: number;
  totalVolume: number;
  defiInteractions: number;
  nftActivity: number;
  diversity: number;
  regularity: number;
  profitHistory: number;
}

export interface ReputationScore {
  address: string;
  score: number;
  grade: 'S' | 'A' | 'B' | 'C' | 'D' | 'F';
  level: string;
  factors: ReputationFactors;
  risk: 'low' | 'medium' | 'high';
  description: string;
  recommendations: string[];
  chain: string;
  calculatedAt: string;
}

@Injectable()
export class WalletReputationService {
  private readonly knownCEXAddresses = new Set([
    '0x28c6c06298d514db089934071355e5743bf21d60', // Binance hot wallet
    '0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D43', // Coinbase
    '0xa7A23265aEA9dCD5d6f5d33bD0a99D5D7D6eB7D', // Kraken
    '0x0a98fB70920D3276EE4f4dEd5B4F1E48f8F9d8E', // KuCoin
    '0x9696f8A78b5B7d7d5A7c0e9f8b3c2d1e0f9a8b7', // OKX
  ]);

  async calculateReputation(address: string): Promise<ReputationScore> {
    const chain = this.detectChain(address);
    const factors = await this.analyzeWalletFactors(address, chain);
    const score = this.calculateScore(factors);
    const grade = this.getGrade(score);
    const level = this.getLevel(grade);
    const risk = this.calculateRisk(factors, score);
    const description = this.generateDescription(grade, factors);
    const recommendations = this.generateRecommendations(factors, score);

    return {
      address: address.toLowerCase(),
      score,
      grade,
      level,
      factors,
      risk,
      description,
      recommendations,
      chain,
      calculatedAt: new Date().toISOString(),
    };
  }

  async batchCalculateReputation(addresses: string[]): Promise<ReputationScore[]> {
    const results = await Promise.all(
      addresses.map((addr) => this.calculateReputation(addr)),
    );
    return results;
  }

  async getDetailedFactors(address: string): Promise<{
    address: string;
    factors: ReputationFactors;
    analysis: Record<string, { value: number; weight: number; contribution: number }>;
  }> {
    const chain = this.detectChain(address);
    const factors = await this.analyzeWalletFactors(address, chain);
    
    const weights = {
      walletAge: 0.15,
      transactionCount: 0.12,
      totalVolume: 0.15,
      defiInteractions: 0.15,
      nftActivity: 0.08,
      diversity: 0.15,
      regularity: 0.1,
      profitHistory: 0.1,
    };

    const analysis = {};
    let totalScore = 0;

    for (const [key, factor] of Object.entries(factors)) {
      const normalizedValue = this.normalizeFactor(key, factor);
      const contribution = normalizedValue * weights[key as keyof typeof weights];
      analysis[key] = {
        value: factor,
        weight: weights[key as keyof typeof weights],
        contribution: Math.round(contribution * 100),
      };
      totalScore += contribution;
    }

    return {
      address: address.toLowerCase(),
      factors,
      analysis,
    };
  }

  async getLeaderboard(chain?: string, limit: number = 10): Promise<{
    leaderboard: ReputationScore[];
    totalCount: number;
  }> {
    // Simulate leaderboard data with sample addresses
    const sampleAddresses = [
      '0x28c6c06298d514db089934071355e5743bf21d60',
      '0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D43',
      '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', // vitalik.eth
      '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B',
      '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', // Uniswap Router
      '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', // Uniswap V2 Router
      '0xE592427A0AEce92De3Edee1F18E0157C05861564', // Uniswap V3 Router
      '0x3fC91A3afd70387CdEEd6a4a66E3A8B76E7D1cA', // LayerZero
      '0x0d4a11d5EEaaC28EC3F61d100daF4e504329AB98', // Uniswap V2: ETH/USDT
      '0x88e6A0c2dDD26EEb57e7376f2f19ba5B2BFe3e1f', // Uniswap V3: USDC/ETH
    ];

    const results = await Promise.all(
      sampleAddresses.slice(0, limit).map((addr) => this.calculateReputation(addr)),
    );

    // Sort by score descending
    results.sort((a, b) => b.score - a.score);

    return {
      leaderboard: results,
      totalCount: sampleAddresses.length,
    };
  }

  async compareWallets(addresses: string[]): Promise<{
    wallets: ReputationScore[];
    comparison: {
      highestScore: { address: string; score: number };
      lowestScore: { address: string; score: number };
      averageScore: number;
      scoreDifference: number;
    };
  }> {
    const results = await Promise.all(
      addresses.map((addr) => this.calculateReputation(addr)),
    );

    const scores = results.map((r) => r.score);
    const highest = results.reduce((a, b) => (a.score > b.score ? a : b));
    const lowest = results.reduce((a, b) => (a.score < b.score ? a : b));
    const average = scores.reduce((a, b) => a + b, 0) / scores.length;

    return {
      wallets: results,
      comparison: {
        highestScore: { address: highest.address, score: highest.score },
        lowestScore: { address: lowest.address, score: lowest.score },
        averageScore: Math.round(average * 10) / 10,
        scoreDifference: highest.score - lowest.score,
      },
    };
  }

  private detectChain(address: string): string {
    if (address.startsWith('0x') && address.length === 42) {
      return 'ethereum';
    }
    if (address.length === 44 && address.startsWith('0x')) {
      return 'solana';
    }
    return 'ethereum';
  }

  private async analyzeWalletFactors(address: string, chain: string): Promise<ReputationFactors> {
    // Simulate wallet analysis based on address characteristics
    const addressHash = this.hashCode(address);
    
    // Wallet age based on address hash (simulated)
    const walletAge = Math.abs(addressHash % 1500) + 30; // 30-1530 days
    
    // Transaction count simulation
    const transactionCount = Math.abs(addressHash % 5000) + 10;
    
    // Total volume simulation
    const totalVolume = Math.abs(addressHash % 10000000) + 1000;
    
    // DeFi interactions
    const defiInteractions = Math.abs(addressHash % 200);
    
    // NFT activity
    const nftActivity = Math.abs(addressHash % 50);
    
    // Diversity (number of different protocols interacted)
    const diversity = Math.min(Math.abs(addressHash % 20) + 1, 15);
    
    // Regularity (activity pattern consistency)
    const regularity = Math.abs(addressHash % 100);
    
    // Profit history (simulated P&L)
    const profitHistory = Math.abs(addressHash % 500000) - 250000;

    return {
      walletAge,
      transactionCount,
      totalVolume,
      defiInteractions,
      nftActivity,
      diversity,
      regularity,
      profitHistory,
    };
  }

  private calculateScore(factors: ReputationFactors): number {
    const weights = {
      walletAge: 0.15,
      transactionCount: 0.12,
      totalVolume: 0.15,
      defiInteractions: 0.15,
      nftActivity: 0.08,
      diversity: 0.15,
      regularity: 0.1,
      profitHistory: 0.1,
    };

    let score = 0;
    score += this.normalizeFactor('walletAge', factors.walletAge) * weights.walletAge;
    score += this.normalizeFactor('transactionCount', factors.transactionCount) * weights.transactionCount;
    score += this.normalizeFactor('totalVolume', factors.totalVolume) * weights.totalVolume;
    score += this.normalizeFactor('defiInteractions', factors.defiInteractions) * weights.defiInteractions;
    score += this.normalizeFactor('nftActivity', factors.nftActivity) * weights.nftActivity;
    score += this.normalizeFactor('diversity', factors.diversity) * weights.diversity;
    score += this.normalizeFactor('regularity', factors.regularity) * weights.regularity;
    score += this.normalizeFactor('profitHistory', factors.profitHistory) * weights.profitHistory;

    return Math.round(score * 100);
  }

  private normalizeFactor(factor: string, value: number): number {
    const ranges: Record<string, { min: number; max: number }> = {
      walletAge: { min: 0, max: 1500 },
      transactionCount: { min: 0, max: 5000 },
      totalVolume: { min: 0, max: 10000000 },
      defiInteractions: { min: 0, max: 200 },
      nftActivity: { min: 0, max: 50 },
      diversity: { min: 1, max: 15 },
      regularity: { min: 0, max: 100 },
      profitHistory: { min: -250000, max: 250000 },
    };

    const range = ranges[factor];
    if (!range) return 0;
    return Math.min(Math.max((value - range.min) / (range.max - range.min), 0), 1);
  }

  private getGrade(score: number): 'S' | 'A' | 'B' | 'C' | 'D' | 'F' {
    if (score >= 90) return 'S';
    if (score >= 75) return 'A';
    if (score >= 60) return 'B';
    if (score >= 45) return 'C';
    if (score >= 30) return 'D';
    return 'F';
  }

  private getLevel(grade: 'S' | 'A' | 'B' | 'C' | 'D' | 'F'): string {
    const levels: Record<string, string> = {
      S: 'Legendary',
      A: 'Expert',
      B: 'Experienced',
      C: 'Intermediate',
      D: 'Beginner',
      F: 'Newbie',
    };
    return levels[grade];
  }

  private calculateRisk(factors: ReputationFactors, score: number): 'low' | 'medium' | 'high' {
    // Higher diversity and regularity = lower risk
    // Higher profit = higher risk (could be risky trading)
    const diversityRisk = factors.diversity < 3 ? 0.3 : 0;
    const regularityRisk = factors.regularity < 30 ? 0.3 : 0;
    const volumeRisk = factors.totalVolume > 5000000 ? 0.2 : 0;
    const profitRisk = factors.profitHistory > 100000 ? 0.2 : 0;
    
    const riskScore = diversityRisk + regularityRisk + volumeRisk + profitRisk;
    
    if (score < 40 || riskScore > 0.6) return 'high';
    if (score < 60 || riskScore > 0.3) return 'medium';
    return 'low';
  }

  private generateDescription(grade: string, factors: ReputationFactors): string {
    const descriptions: Record<string, string> = {
      S: 'Elite wallet with exceptional activity, longevity, and diverse DeFi interactions. Highly reliable and experienced.',
      A: 'Professional wallet with strong track record. Active DeFi participant with substantial volume and experience.',
      B: 'Experienced wallet with good activity. Regular DeFi user with moderate volume and consistent patterns.',
      C: 'Intermediate wallet with some DeFi experience. Growing activity but limited diversity.',
      D: 'Beginner wallet with limited history. Mostly basic transactions with room for growth.',
      F: 'New or inactive wallet. Limited data available for reputation assessment.',
    };

    let desc = descriptions[grade];
    
    if (factors.nftActivity > 30) {
      desc += ' Active NFT collector.';
    }
    if (factors.defiInteractions > 100) {
      desc += ' Heavy DeFi user.';
    }
    if (factors.totalVolume > 5000000) {
      desc += ' High volume wallet.';
    }

    return desc;
  }

  private generateRecommendations(factors: ReputationFactors, score: number): string[] {
    const recommendations: string[] = [];

    if (factors.diversity < 5) {
      recommendations.push('Increase DeFi protocol diversity to improve reputation score');
    }
    if (factors.walletAge < 180) {
      recommendations.push('Build wallet history over time for higher credibility');
    }
    if (factors.transactionCount < 100) {
      recommendations.push('Increase transaction activity to demonstrate engagement');
    }
    if (factors.regularity < 50) {
      recommendations.push('Maintain regular activity patterns for better trust assessment');
    }
    if (score >= 80) {
      recommendations.push('Great reputation! Consider using this wallet for DeFi governance');
    }

    if (recommendations.length === 0) {
      recommendations.push('Continue current activity to maintain reputation');
    }

    return recommendations;
  }

  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }
}
