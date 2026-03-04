import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';

@ApiTags('Privacy Score Analyzer')
@Controller('api/web3/privacy')
export class PrivacyScoreController {
  
  @Get('analyze')
  @ApiOperation({ summary: 'Analyze wallet privacy score across chains' })
  @ApiQuery({ name: 'address', required: true, type: String })
  @ApiQuery({ name: 'chains', required: false, type: String })
  async analyzePrivacy(
    @Query('address') address: string,
    @Query('chains') chains?: string,
  ) {
    const chainList = chains 
      ? chains.split(',').map(c => parseInt(c)) 
      : [1, 137, 42161, 8453, 43114, 56, 10];
    
    const result = await this.calculatePrivacyScore(address, chainList);
    
    return {
      data: result,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('chains')
  @ApiOperation({ summary: 'Get supported chains for privacy analysis' })
  async getSupportedChains() {
    return {
      data: [
        { id: 1, name: 'Ethereum', symbol: 'ETH', color: '#627EEA' },
        { id: 137, name: 'Polygon', symbol: 'MATIC', color: '#8247E5' },
        { id: 42161, name: 'Arbitrum', symbol: 'ETH', color: '#28A0F0' },
        { id: 8453, name: 'Base', symbol: 'ETH', color: '#0052FF' },
        { id: 43114, name: 'Avalanche', symbol: 'AVAX', color: '#E84142' },
        { id: 56, name: 'BNB Chain', symbol: 'BNB', color: '#F3BA2F' },
        { id: 10, name: 'Optimism', symbol: 'ETH', color: '#FF0420' },
        { id: 11155111, name: 'Sepolia', symbol: 'ETH', color: '#627EEA' },
      ],
    };
  }

  @Get('factors')
  @ApiOperation({ summary: 'Get privacy scoring factors explanation' })
  async getPrivacyFactors() {
    return {
      data: [
        {
          factor: 'address_reuse',
          name: 'Address Reuse',
          description: 'Frequency of using the same address for multiple transactions',
          weight: 15,
          impact: 'negative',
        },
        {
          factor: 'transaction_pattern',
          name: 'Transaction Pattern',
          description: 'Analysis of transaction timing and amounts',
          weight: 20,
          impact: 'negative',
        },
        {
          factor: 'interaction_diversity',
          name: 'Interaction Diversity',
          description: 'Number of unique contracts/interactions',
          weight: 20,
          impact: 'positive',
        },
        {
          factor: 'chain_diversity',
          name: 'Chain Diversity',
          description: 'Number of different chains used',
          weight: 15,
          impact: 'positive',
        },
        {
          factor: 'public_exposure',
          name: 'Public Exposure',
          description: 'Whether address is linked to identity',
          weight: 15,
          impact: 'negative',
        },
        {
          factor: 'asset_privacy',
          name: 'Asset Privacy',
          description: 'Types of assets held (privacy coins vs regular)',
          weight: 15,
          impact: 'positive',
        },
      ],
    };
  }

  @Get('recommendations')
  @ApiOperation({ summary: 'Get privacy improvement recommendations' })
  async getRecommendations() {
    return {
      data: [
        {
          id: 1,
          title: 'Use Separate Addresses',
          description: 'Create different addresses for different purposes (DeFi, NFT, trading)',
          impact: 'high',
          difficulty: 'easy',
        },
        {
          id: 2,
          title: 'Enable Privacy Mode',
          description: 'Use privacy-enhanced wallets or mixers for transactions',
          impact: 'high',
          difficulty: 'medium',
        },
        {
          id: 3,
          title: 'Avoid Address Linking',
          description: 'Don\'t use the same address for identity verification',
          impact: 'medium',
          difficulty: 'easy',
        },
        {
          id: 4,
          title: 'Use Privacy Coins',
          description: 'Consider holding privacy-focused cryptocurrencies',
          impact: 'medium',
          difficulty: 'medium',
        },
        {
          id: 5,
          title: 'Cross-chain Separation',
          description: 'Use different addresses on different chains',
          impact: 'medium',
          difficulty: 'easy',
        },
        {
          id: 6,
          title: 'Time-based Transactions',
          description: 'Avoid regular transaction patterns by varying timing',
          impact: 'low',
          difficulty: 'easy',
        },
      ],
    };
  }

  private async calculatePrivacyScore(address: string, chains: number[]) {
    // Simulate privacy analysis
    const addressHash = this.hashCode(address);
    const random = (seed: number) => Math.abs(Math.sin(seed) * 10000) % 100;
    
    const addressReuse = random(addressHash);
    const transactionPattern = random(addressHash + 1);
    const interactionDiversity = random(addressHash + 2);
    const chainDiversity = random(addressHash + 3);
    const publicExposure = random(addressHash + 4);
    const assetPrivacy = random(addressHash + 5);
    
    // Calculate weighted score
    const score = Math.round(
      (100 - addressReuse * 0.15) +
      (100 - transactionPattern * 0.20) +
      (interactionDiversity * 0.20) +
      (chainDiversity * 0.15) +
      (100 - publicExposure * 0.15) +
      (assetPrivacy * 0.15)
    );
    
    const normalizedScore = Math.min(100, Math.max(0, score));
    
    const getGrade = (s: number): string => {
      if (s >= 90) return 'A+';
      if (s >= 80) return 'A';
      if (s >= 70) return 'B';
      if (s >= 60) return 'C';
      if (s >= 50) return 'D';
      return 'F';
    };
    
    const getRiskLevel = (s: number): string => {
      if (s >= 80) return 'low';
      if (s >= 60) return 'medium';
      if (s >= 40) return 'high';
      return 'critical';
    };
    
    const chainData = chains.map(chainId => ({
      chainId,
      chainName: this.getChainName(chainId),
      txCount: Math.floor(random(addressHash + chainId) * 1000),
      uniqueContracts: Math.floor(random(addressHash + chainId + 100) * 50),
      firstActivity: this.getRandomDate(),
      lastActivity: this.getRandomDate(),
      privacyScore: Math.floor(random(addressHash + chainId + 200) * 100),
    }));
    
    return {
      address,
      overallScore: normalizedScore,
      grade: getGrade(normalizedScore),
      riskLevel: getRiskLevel(normalizedScore),
      factors: {
        addressReuse: {
          score: Math.round(100 - addressReuse),
          value: `${Math.round(addressReuse)}%`,
          description: 'Percentage of transaction reuse',
        },
        transactionPattern: {
          score: Math.round(100 - transactionPattern),
          value: transactionPattern > 50 ? 'Predictable' : 'Varied',
          description: 'Transaction timing pattern analysis',
        },
        interactionDiversity: {
          score: Math.round(interactionDiversity),
          value: `${Math.floor(interactionDiversity * 50)} contracts`,
          description: 'Unique contract interactions',
        },
        chainDiversity: {
          score: Math.round(chainDiversity * 100),
          value: `${Math.floor(chainDiversity * chains.length)} chains`,
          description: 'Multi-chain usage',
        },
        publicExposure: {
          score: Math.round(100 - publicExposure),
          value: publicExposure > 50 ? 'Exposed' : 'Private',
          description: 'Identity linkage risk',
        },
        assetPrivacy: {
          score: Math.round(assetPrivacy),
          value: assetPrivacy > 50 ? 'Privacy Assets' : 'Regular Assets',
          description: 'Asset type privacy',
        },
      },
      chainData,
      recommendations: this.generateRecommendations(normalizedScore),
      stats: {
        totalTransactions: chainData.reduce((a, b) => a + b.txCount, 0),
        totalContracts: chainData.reduce((a, b) => a + b.uniqueContracts, 0),
        activeChains: chainData.length,
        averageScore: Math.round(chainData.reduce((a, b) => a + b.privacyScore, 0) / chainData.length),
      },
    };
  }
  
  private generateRecommendations(score: number) {
    const recs: Array<{ factor: string; recommendation: string; priority: string }> = [];
    if (score < 80) {
      recs.push({
        factor: 'address_reuse',
        recommendation: 'Consider using address rotation or separate addresses for different purposes',
        priority: 'high',
      });
    }
    if (score < 70) {
      recs.push({
        factor: 'transaction_pattern',
        recommendation: 'Vary transaction timing and amounts to avoid pattern analysis',
        priority: 'medium',
      });
    }
    if (score < 60) {
      recs.push({
        factor: 'public_exposure',
        recommendation: 'Avoid linking your address to social media or public identities',
        priority: 'high',
      });
    }
    return recs;
  }
  
  private getChainName(chainId: number): string {
    const names: Record<number, string> = {
      1: 'Ethereum',
      137: 'Polygon',
      42161: 'Arbitrum',
      8453: 'Base',
      43114: 'Avalanche',
      56: 'BNB Chain',
      10: 'Optimism',
      11155111: 'Sepolia',
    };
    return names[chainId] || `Chain ${chainId}`;
  }
  
  private getRandomDate(): string {
    const now = new Date();
    const daysAgo = Math.floor(Math.random() * 365);
    now.setDate(now.getDate() - daysAgo);
    return now.toISOString().split('T')[0];
  }
  
  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }
}
