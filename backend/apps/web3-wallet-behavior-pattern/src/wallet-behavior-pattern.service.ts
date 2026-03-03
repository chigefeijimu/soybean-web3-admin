import { Injectable } from '@nestjs/common';
import axios from 'axios';

export interface WalletBehaviorProfile {
  address: string;
  chain: string;
  behaviorPattern: BehaviorPattern;
  confidence: number;
  metrics: BehaviorMetrics;
  riskAssessment: RiskAssessment;
  recommendations: string[];
  similarityScores: SimilarWallet[];
  historicalAnalysis: HistoricalBehavior[];
}

export interface BehaviorPattern {
  primary: PatternType;
  secondary?: PatternType;
  description: string;
  score: number;
}

export type PatternType = 
  | 'trader' 
  | 'hodler' 
  | 'defi_user' 
  | 'nft_trader' 
  | 'whale' 
  | 'bot' 
  | 'social_actor' 
  | 'yield_farmer'
  | 'gambler'
  | 'airdrop_hunter'
  | 'unknown';

export interface BehaviorMetrics {
  transactionFrequency: number;
  averageHoldingPeriod: number;
  averageTransactionSize: number;
  defiInteractionRatio: number;
  nftActivityRatio: number;
  governanceParticipation: number;
  tradingVolume: number;
  gasEfficiency: number;
  timeDistribution: TimeDistribution;
  diversityScore: number;
}

export interface TimeDistribution {
  hourly: number[];
  weekly: number[];
  timezone: string;
}

export interface RiskAssessment {
  overall: 'low' | 'medium' | 'high' | 'critical';
  score: number;
  factors: RiskFactor[];
}

export interface RiskFactor {
  name: string;
  impact: 'positive' | 'negative' | 'neutral';
  description: string;
}

export interface SimilarWallet {
  address: string;
  similarity: number;
  pattern: PatternType;
}

export interface HistoricalBehavior {
  period: string;
  pattern: PatternType;
  confidence: number;
}

@Injectable()
export class WalletBehaviorPatternService {
  private readonly chains = ['ethereum', 'polygon', 'arbitrum', 'optimism', 'bsc', 'base', 'avalanche'];
  
  private readonly chainRpcUrls: Record<string, string> = {
    ethereum: 'https://eth.llamarpc.com',
    polygon: 'https://polygon-rpc.com',
    arbitrum: 'https://arb1.arbitrum.io/rpc',
    optimism: 'https://mainnet.optimism.io',
    bsc: 'https://bsc-dataseed.binance.org',
    base: 'https://mainnet.base.org',
    avalanche: 'https://api.avax.network/ext/bc/C/rpc',
  };

  async analyzeWalletBehavior(address: string, chain: string = 'ethereum'): Promise<WalletBehaviorProfile> {
    const normalizedChain = chain.toLowerCase();
    
    if (!this.chains.includes(normalizedChain)) {
      throw new Error(`Unsupported chain: ${chain}`);
    }

    // Fetch wallet transactions
    const transactions = await this.fetchWalletTransactions(address, normalizedChain);
    
    // Calculate behavior metrics
    const metrics = this.calculateBehaviorMetrics(transactions, normalizedChain);
    
    // Determine primary behavior pattern
    const behaviorPattern = this.determineBehaviorPattern(metrics, transactions, normalizedChain);
    
    // Calculate risk assessment
    const riskAssessment = this.calculateRiskAssessment(metrics, transactions);
    
    // Find similar wallets
    const similarWallets = await this.findSimilarWallets(address, behaviorPattern.primary, normalizedChain);
    
    // Historical analysis
    const historicalAnalysis = this.analyzeHistoricalBehavior(transactions);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(behaviorPattern, metrics, riskAssessment);
    
    return {
      address: address.toLowerCase(),
      chain: normalizedChain,
      behaviorPattern,
      confidence: this.calculateConfidence(metrics),
      metrics,
      riskAssessment,
      recommendations,
      similarityScores: similarWallets,
      historicalAnalysis,
    };
  }

  private async fetchWalletTransactions(address: string, chain: string): Promise<any[]> {
    try {
      // Use public API to fetch transactions
      let apiUrl: string;
      
      if (chain === 'ethereum') {
        apiUrl = `https://api.etherscan.io/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=100&sort=desc&apikey=YourApiKeyToken`;
      } else if (chain === 'polygon') {
        apiUrl = `https://api.polygonscan.com/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=100&sort=desc&apikey=YourApiKeyToken`;
      } else if (chain === 'bsc') {
        apiUrl = `https://api.bscscan.com/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=100&sort=desc&apikey=YourApiKeyToken`;
      } else {
        // For other chains, use a generic approach withBlockscout
        apiUrl = `https://${chain}.blockscout.com/api?module=account&action=txlist&address=${address}&limit=100`;
      }
      
      const response = await axios.get(apiUrl, { timeout: 10000 });
      
      if (response.data && response.data.result) {
        if (Array.isArray(response.data.result)) {
          return response.data.result.slice(0, 100);
        }
        return [];
      }
      
      return [];
    } catch (error) {
      console.error(`Error fetching transactions for ${address} on ${chain}:`, error.message);
      return [];
    }
  }

  private calculateBehaviorMetrics(transactions: any[], chain: string): BehaviorMetrics {
    if (transactions.length === 0) {
      return {
        transactionFrequency: 0,
        averageHoldingPeriod: 0,
        averageTransactionSize: 0,
        defiInteractionRatio: 0,
        nftActivityRatio: 0,
        governanceParticipation: 0,
        tradingVolume: 0,
        gasEfficiency: 0,
        timeDistribution: {
          hourly: new Array(24).fill(0),
          weekly: new Array(7).fill(0),
          timezone: 'UTC',
        },
        diversityScore: 0,
      };
    }

    // Calculate transaction frequency (transactions per day)
    const firstTx = Math.min(...transactions.map((tx: any) => parseInt(tx.timeStamp) * 1000));
    const lastTx = Math.max(...transactions.map((tx: any) => parseInt(tx.timeStamp) * 1000));
    const daysActive = Math.max(1, (lastTx - firstTx) / (1000 * 60 * 60 * 24));
    const transactionFrequency = transactions.length / daysActive;

    // Calculate average holding period (simplified estimation based on time between transactions)
    const sortedTxs = [...transactions].sort((a: any, b: any) => 
      parseInt(a.timeStamp) - parseInt(b.timeStamp)
    );
    let totalHoldingTime = 0;
    for (let i = 1; i < sortedTxs.length; i++) {
      totalHoldingTime += (parseInt(sortedTxs[i].timeStamp) - parseInt(sortedTxs[i - 1].timeStamp));
    }
    const averageHoldingPeriod = sortedTxs.length > 1 
      ? totalHoldingTime / (sortedTxs.length - 1) / (60 * 60 * 24) // in days
      : 0;

    // Calculate average transaction size in USD (simplified)
    const totalValue = transactions.reduce((sum: number, tx: any) => {
      const value = parseFloat(tx.value || '0') / 1e18;
      return sum + value;
    }, 0);
    const averageTransactionSize = totalValue / transactions.length;

    // Calculate DeFi interaction ratio (simplified - checking for common DeFi contract interactions)
    const defiContracts = this.getDefiContracts(chain);
    const defiInteractions = transactions.filter((tx: any) => 
      defiContracts.some((contract: string) => tx.to?.toLowerCase() === contract.toLowerCase())
    ).length;
    const defiInteractionRatio = defiInteractions / transactions.length;

    // NFT activity ratio (checking for NFT contract interactions)
    const nftContracts = this.getNftContracts(chain);
    const nftInteractions = transactions.filter((tx: any) =>
      nftContracts.some((contract: string) => tx.to?.toLowerCase() === contract.toLowerCase())
    ).length;
    const nftActivityRatio = nftInteractions / transactions.length;

    // Governance participation (simplified - no real on-chain governance detection)
    const governanceParticipation = 0;

    // Trading volume (total value in USD, simplified as ETH value)
    const tradingVolume = totalValue;

    // Gas efficiency (average gas price)
    const totalGas = transactions.reduce((sum: number, tx: any) => {
      return sum + parseFloat(tx.gasUsed || '0') * parseFloat(tx.gasPrice || '0') / 1e18;
    }, 0);
    const gasEfficiency = transactions.length > 0 ? totalGas / transactions.length : 0;

    // Time distribution
    const hourly = new Array(24).fill(0);
    const weekly = new Array(7).fill(0);
    
    transactions.forEach((tx: any) => {
      const date = new Date(parseInt(tx.timeStamp) * 1000);
      hourly[date.getUTCHours()]++;
      weekly[date.getUTCDay()]++;
    });

    // Diversity score (unique addresses interacted with)
    const uniqueToAddresses = new Set(transactions.map((tx: any) => tx.to?.toLowerCase()).filter(Boolean));
    const uniqueFromAddresses = new Set(transactions.map((tx: any) => tx.from?.toLowerCase()).filter(Boolean));
    const allAddresses = new Set([...uniqueToAddresses, ...uniqueFromAddresses]);
    const diversityScore = Math.min(100, (allAddresses.size / transactions.length) * 100);

    return {
      transactionFrequency,
      averageHoldingPeriod,
      averageTransactionSize,
      defiInteractionRatio,
      nftActivityRatio,
      governanceParticipation,
      tradingVolume,
      gasEfficiency,
      timeDistribution: {
        hourly,
        weekly,
        timezone: 'UTC',
      },
      diversityScore,
    };
  }

  private getDefiContracts(chain: string): string[] {
    const defiContracts: Record<string, string[]> = {
      ethereum: [
        '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', // Uniswap V2
        '0xE592427A0AEce92De3Edee1F18E0157C05861564', // Uniswap V3
        '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
        '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9', // AAVE
        '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', // WBTC
      ],
      polygon: [
        '0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff', // QuickSwap
        '0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6', // WBTC
      ],
      arbitrum: [
        '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', // Uniswap
      ],
      optimism: [
        '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
      ],
      bsc: [
        '0x10ED43C718714eb63d5aA57B78B54704E256024E', // PancakeSwap
        '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', // WBNB
      ],
      base: [
        '0x4e8382aE5f3eC5b7b6C5D0a7D3e8F4a8f9d0c1b2',
      ],
      avalanche: [
        '0xE54Ca86531e17Ef3616d22Ca28b0D86b6B275005', // Trader Joe
      ],
    };
    
    return defiContracts[chain] || [];
  }

  private getNftContracts(chain: string): string[] {
    const nftContracts: Record<string, string[]> = {
      ethereum: [
        '0xb47e3cd837dDF8e4c57F05d70Ab865de6e193BBB', // CryptoPunks
        '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D', // BAYC
        '0x23581767a106ae21c074b2276D25e5C3e136a68b', // Moonbirds
      ],
      polygon: [
        '0x47AdAB12D1DA54d2d0948dA63056EEf7f20d3F23',
      ],
      arbitrum: [
        '0x912CE59144191C1204E64559FE8253a0e49E6548', // TREATS
      ],
    };
    
    return nftContracts[chain] || [];
  }

  private determineBehaviorPattern(metrics: BehaviorMetrics, transactions: any[], chain: string): BehaviorPattern {
    const scores: { pattern: PatternType; score: number; description: string }[] = [];
    
    // Trader: high frequency, short holding, moderate transaction size
    if (metrics.transactionFrequency > 5 && metrics.averageHoldingPeriod < 2) {
      scores.push({
        pattern: 'trader',
        score: 85,
        description: 'High transaction frequency with short holding periods suggests active trading behavior',
      });
    }
    
    // HODLer: low frequency, long holding, no DeFi/NFT activity
    if (metrics.transactionFrequency < 0.5 && metrics.averageHoldingPeriod > 30 && 
        metrics.defiInteractionRatio < 0.1 && metrics.nftActivityRatio < 0.1) {
      scores.push({
        pattern: 'hodler',
        score: 90,
        description: 'Low activity with long holding periods indicates a HODLer strategy',
      });
    }
    
    // Whale: large transaction size
    if (metrics.averageTransactionSize > 10) { // >10 ETH equivalent
      scores.push({
        pattern: 'whale',
        score: 80,
        description: 'Large transaction volumes indicate whale-level activity',
      });
    }
    
    // DeFi User
    if (metrics.defiInteractionRatio > 0.3) {
      scores.push({
        pattern: 'defi_user',
        score: 85,
        description: 'Frequent DeFi protocol interactions',
      });
    }
    
    // NFT Trader
    if (metrics.nftActivityRatio > 0.2) {
      scores.push({
        pattern: 'nft_trader',
        score: 80,
        description: 'Active NFT trading behavior detected',
      });
    }
    
    // Bot detection: extremely high frequency
    if (metrics.transactionFrequency > 50) {
      scores.push({
        pattern: 'bot',
        score: 95,
        description: 'Automated transaction pattern detected',
      });
    }
    
    // Yield Farmer
    if (metrics.defiInteractionRatio > 0.4 && metrics.transactionFrequency > 1 && metrics.transactionFrequency < 10) {
      scores.push({
        pattern: 'yield_farmer',
        score: 75,
        description: 'Regular DeFi interactions with moderate frequency suggests yield farming',
      });
    }
    
    // Airdrop Hunter: many small transactions to different contracts
    if (metrics.diversityScore > 50 && metrics.averageTransactionSize < 0.1 && metrics.transactionFrequency > 1) {
      scores.push({
        pattern: 'airdrop_hunter',
        score: 70,
        description: 'High contract diversity with small transactions suggests airdrop hunting',
      });
    }
    
    // Social Actor: governance participation (simplified)
    if (metrics.governanceParticipation > 0.5) {
      scores.push({
        pattern: 'social_actor',
        score: 80,
        description: 'Active governance participation detected',
      });
    }
    
    // Sort by score and get the primary pattern
    scores.sort((a, b) => b.score - a.score);
    
    if (scores.length === 0) {
      return {
        primary: 'unknown',
        description: 'Unable to determine behavior pattern from available data',
        score: 50,
      };
    }
    
    const primary = scores[0];
    const secondary = scores.length > 1 ? scores[1] : undefined;
    
    return {
      primary: primary.pattern,
      secondary: secondary?.pattern,
      description: primary.description,
      score: primary.score,
    };
  }

  private calculateRiskAssessment(metrics: BehaviorMetrics, transactions: any[]): RiskAssessment {
    const factors: RiskFactor[] = [];
    let riskScore = 50; // Base risk score
    
    // High frequency trading can indicate higher risk
    if (metrics.transactionFrequency > 20) {
      riskScore += 20;
      factors.push({
        name: 'High Transaction Frequency',
        impact: 'negative',
        description: 'Very high transaction frequency may indicate automated trading or high-risk strategy',
      });
    } else if (metrics.transactionFrequency > 5) {
      riskScore += 10;
      factors.push({
        name: 'Active Trading',
        impact: 'neutral',
        description: 'Active trading pattern detected',
      });
    }
    
    // Low diversity can indicate concentration risk
    if (metrics.diversityScore < 20) {
      riskScore += 15;
      factors.push({
        name: 'Low Diversity',
        impact: 'negative',
        description: 'Low interaction diversity may indicate concentrated risk',
      });
    } else {
      factors.push({
        name: 'Good Diversity',
        impact: 'positive',
        description: 'Good interaction diversity across protocols',
      });
    }
    
    // High transaction size can indicate whale activity
    if (metrics.averageTransactionSize > 10) {
      riskScore += 10;
      factors.push({
        name: 'Large Transaction Size',
        impact: 'neutral',
        description: 'Large transaction values detected',
      });
    }
    
    // DeFi usage is generally positive
    if (metrics.defiInteractionRatio > 0.2) {
      riskScore -= 10;
      factors.push({
        name: 'DeFi Activity',
        impact: 'positive',
        description: 'DeFi protocol usage shows sophisticated DeFi engagement',
      });
    }
    
    // NFT activity is neutral
    if (metrics.nftActivityRatio > 0.3) {
      factors.push({
        name: 'NFT Activity',
        impact: 'neutral',
        description: 'Active NFT trading detected',
      });
    }
    
    // Clamp risk score
    riskScore = Math.max(0, Math.min(100, riskScore));
    
    let overall: 'low' | 'medium' | 'high' | 'critical';
    if (riskScore < 30) {
      overall = 'low';
    } else if (riskScore < 50) {
      overall = 'medium';
    } else if (riskScore < 75) {
      overall = 'high';
    } else {
      overall = 'critical';
    }
    
    return {
      overall,
      score: riskScore,
      factors,
    };
  }

  private async findSimilarWallets(address: string, pattern: PatternType, chain: string): Promise<SimilarWallet[]> {
    // In a real implementation, this would query a database of wallet patterns
    // For now, return mock data
    const mockSimilarWallets: SimilarWallet[] = [
      {
        address: '0x742d35Cc6634C0532925a3b844Bc9e7595f8fE00',
        similarity: 0.92,
        pattern: pattern,
      },
      {
        address: '0x8ba1f109551bD432803012645Ac136ddd64DBA72',
        similarity: 0.87,
        pattern: pattern,
      },
      {
        address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', // vitalik.eth
        similarity: 0.75,
        pattern: 'hodler',
      },
    ];
    
    return mockSimilarWallets;
  }

  private analyzeHistoricalBehavior(transactions: any[]): HistoricalBehavior[] {
    if (transactions.length < 10) {
      return [];
    }
    
    // Divide transactions into periods and analyze
    const periods: HistoricalBehavior[] = [];
    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
    const sixtyDaysAgo = now - 60 * 24 * 60 * 60 * 1000;
    
    // Recent period (last 30 days)
    const recentTxs = transactions.filter((tx: any) => 
      parseInt(tx.timeStamp) * 1000 > thirtyDaysAgo
    );
    
    // Middle period (30-60 days ago)
    const middleTxs = transactions.filter((tx: any) => {
      const ts = parseInt(tx.timeStamp) * 1000;
      return ts > sixtyDaysAgo && ts <= thirtyDaysAgo;
    });
    
    // Older period (>60 days)
    const olderTxs = transactions.filter((tx: any) => 
      parseInt(tx.timeStamp) * 1000 <= sixtyDaysAgo
    );
    
    if (recentTxs.length > 0) {
      periods.push({
        period: 'last_30_days',
        pattern: this.determinePeriodPattern(recentTxs),
        confidence: Math.min(90, recentTxs.length * 5),
      });
    }
    
    if (middleTxs.length > 0) {
      periods.push({
        period: '30_to_60_days',
        pattern: this.determinePeriodPattern(middleTxs),
        confidence: Math.min(80, middleTxs.length * 4),
      });
    }
    
    if (olderTxs.length > 0) {
      periods.push({
        period: 'over_60_days',
        pattern: this.determinePeriodPattern(olderTxs),
        confidence: Math.min(70, olderTxs.length * 3),
      });
    }
    
    return periods;
  }

  private determinePeriodPattern(transactions: any[]): PatternType {
    if (transactions.length === 0) return 'unknown';
    
    const firstTx = Math.min(...transactions.map((tx: any) => parseInt(tx.timeStamp) * 1000));
    const lastTx = Math.max(...transactions.map((tx: any) => parseInt(tx.timeStamp) * 1000));
    const daysActive = Math.max(1, (lastTx - firstTx) / (1000 * 60 * 60 * 24));
    const frequency = transactions.length / daysActive;
    
    const totalValue = transactions.reduce((sum: number, tx: any) => {
      return sum + parseFloat(tx.value || '0') / 1e18;
    }, 0);
    const avgValue = totalValue / transactions.length;
    
    if (frequency > 10) return 'trader';
    if (avgValue > 10) return 'whale';
    if (frequency < 0.1) return 'hodler';
    
    return 'unknown';
  }

  private calculateConfidence(metrics: BehaviorMetrics): number {
    let confidence = 50; // Base confidence
    
    // More transactions = higher confidence
    if (metrics.transactionFrequency > 0) {
      confidence += Math.min(30, metrics.transactionFrequency * 3);
    }
    
    // Longer history = higher confidence
    confidence += Math.min(20, metrics.averageHoldingPeriod * 0.5);
    
    return Math.min(95, Math.max(10, confidence));
  }

  private generateRecommendations(
    pattern: BehaviorPattern, 
    metrics: BehaviorMetrics, 
    risk: RiskAssessment
  ): string[] {
    const recommendations: string[] = [];
    
    switch (pattern.primary) {
      case 'trader':
        recommendations.push('Consider setting stop-loss orders to manage risk');
        recommendations.push('Monitor gas costs carefully - high frequency trades can accumulate significant fees');
        if (risk.overall !== 'low') {
          recommendations.push('Consider diversifying across more asset classes');
        }
        break;
        
      case 'hodler':
        recommendations.push('Consider yield-generating strategies for idle assets');
        recommendations.push('Monitor for rebalancing opportunities');
        break;
        
      case 'whale':
        recommendations.push('Consider splitting large transactions to reduce market impact');
        recommendations.push('Use privacy solutions to reduce on-chain visibility');
        break;
        
      case 'defi_user':
        recommendations.push('Regularly review protocol allocations and TVL');
        recommendations.push('Monitor for impermanent loss in liquidity positions');
        break;
        
      case 'nft_trader':
        recommendations.push('Track portfolio value closely given NFT market volatility');
        recommendations.push('Consider floor price protection strategies');
        break;
        
      case 'bot':
        recommendations.push('Ensure gas settings are optimized for automation');
        recommendations.push('Monitor for MEV sandwich attacks');
        break;
        
      case 'yield_farmer':
        recommendations.push('Regularly compound yields for maximum returns');
        recommendations.push('Monitor for new yield opportunities');
        break;
        
      case 'airdrop_hunter':
        recommendations.push('Document interactions for potential tax purposes');
        recommendations.push('Track upcoming airdrops to maximize claims');
        break;
    }
    
    // Add risk-based recommendations
    if (risk.overall === 'high' || risk.overall === 'critical') {
      recommendations.push('Consider reducing risk exposure');
      recommendations.push('Review asset allocation strategy');
    }
    
    // Add diversity recommendations
    if (metrics.diversityScore < 30) {
      recommendations.push('Increase protocol diversity to reduce concentration risk');
    }
    
    return recommendations;
  }

  // Batch analysis for multiple wallets
  async analyzeMultipleWallets(
    addresses: string[], 
    chain: string = 'ethereum'
  ): Promise<WalletBehaviorProfile[]> {
    const results: WalletBehaviorProfile[] = [];
    
    for (const address of addresses.slice(0, 10)) { // Limit to 10 addresses
      try {
        const profile = await this.analyzeWalletBehavior(address, chain);
        results.push(profile);
      } catch (error) {
        console.error(`Error analyzing ${address}:`, error);
      }
    }
    
    return results;
  }

  // Compare two wallets
  async compareWallets(
    address1: string, 
    address2: string, 
    chain: string = 'ethereum'
  ): Promise<{
    wallet1: WalletBehaviorProfile;
    wallet2: WalletBehaviorProfile;
    comparison: {
      similarity: number;
      differences: string[];
      commonPatterns: string[];
    };
  }> {
    const [profile1, profile2] = await Promise.all([
      this.analyzeWalletBehavior(address1, chain),
      this.analyzeWalletBehavior(address2, chain),
    ]);
    
    const differences: string[] = [];
    const commonPatterns: string[] = [];
    
    // Compare patterns
    if (profile1.behaviorPattern.primary === profile2.behaviorPattern.primary) {
      commonPatterns.push(`Both are ${profile1.behaviorPattern.primary} type`);
    } else {
      differences.push(`Different primary behavior: ${profile1.behaviorPattern.primary} vs ${profile2.behaviorPattern.primary}`);
    }
    
    // Compare metrics
    const freqDiff = Math.abs(profile1.metrics.transactionFrequency - profile2.metrics.transactionFrequency);
    if (freqDiff > 5) {
      differences.push(`Transaction frequency differs by ${freqDiff.toFixed(2)}/day`);
    }
    
    const valueDiff = Math.abs(profile1.metrics.averageTransactionSize - profile2.metrics.averageTransactionSize);
    if (valueDiff > 1) {
      differences.push(`Average transaction size differs by ${valueDiff.toFixed(2)} ETH`);
    }
    
    // Calculate similarity score
    let similarity = 0;
    if (profile1.behaviorPattern.primary === profile2.behaviorPattern.primary) similarity += 30;
    if (profile1.riskAssessment.overall === profile2.riskAssessment.overall) similarity += 20;
    similarity += Math.max(0, 50 - freqDiff * 5);
    similarity = Math.min(100, similarity);
    
    return {
      wallet1: profile1,
      wallet2: profile2,
      comparison: {
        similarity,
        differences,
        commonPatterns,
      },
    };
  }
}
