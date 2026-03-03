import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface TxPattern {
  address: string;
  chain: string;
  totalTransactions: number;
  uniqueContracts: number;
  totalVolume: number;
  avgTransactionValue: number;
  mostUsedContracts: { contract: string; count: number }[];
  transactionTypes: {
    type: string;
    count: number;
    percentage: number;
  }[];
  timeDistribution: {
    hour: number;
    count: number;
    percentage: number;
  }[];
  dayDistribution: {
    day: string;
    count: number;
    percentage: number;
  }[];
  activityScore: number;
  behaviorProfile: string;
  riskLevel: 'low' | 'medium' | 'high';
  patterns: string[];
  recommendations: string[];
}

export interface CrossChainPatternSummary {
  address: string;
  chains: string[];
  totalTransactions: number;
  totalVolume: number;
  crossChainActivity: {
    chain: string;
    txCount: number;
    volume: number;
  }[];
  unifiedProfile: string;
  dominantChain: string;
  activityConsistency: number;
  complexity: number;
}

@Injectable()
export class TxPatternAnalyzerService {
  private readonly supportedChains = [
    'ethereum',
    'polygon',
    'arbitrum',
    'optimism',
    'bsc',
    'base',
    'avalanche',
    'solana',
  ];

  private readonly contractTypeSignatures: Record<string, string> = {
    '0xa9059cbb': 'ERC20 Transfer',
    '0x23b872dd': 'ERC20 Transfer From',
    '0x095ea7b3': 'ERC20 Approve',
    '0x': 'ETH Transfer',
    '0x4e71d92d': 'Contract Deployment',
    '0x38ed1739': 'Uniswap V3 Swap',
    '0x7ff36ab5': 'Uniswap V2 Swap',
    '0x8803dbee': 'SushiSwap Swap',
  };

  constructor(private readonly httpService: HttpService) {}

  async analyzeAddressPattern(
    address: string,
    chain: string,
  ): Promise<TxPattern> {
    const isValidChain = this.supportedChains.includes(chain.toLowerCase());
    if (!isValidChain) {
      throw new Error(`Unsupported chain: ${chain}`);
    }

    // Simulate fetching transaction data
    const txData = await this.fetchTxData(address, chain);
    
    // Analyze patterns
    const analysis = this.performAnalysis(address, chain, txData);
    
    return analysis;
  }

  async analyzeCrossChainPattern(address: string): Promise<CrossChainPatternSummary> {
    const chainResults = await Promise.all(
      this.supportedChains.map(async (chain) => {
        try {
          const pattern = await this.analyzeAddressPattern(address, chain);
          return {
            chain,
            txCount: pattern.totalTransactions,
            volume: pattern.totalVolume,
          };
        } catch {
          return { chain, txCount: 0, volume: 0 };
        }
      }),
    );

    const activeChains = chainResults.filter((r) => r.txCount > 0);
    const totalTx = chainResults.reduce((sum, r) => sum + r.txCount, 0);
    const totalVolume = chainResults.reduce((sum, r) => sum + r.volume, 0);

    // Determine dominant chain
    const dominant = chainResults.reduce(
      (max, r) => (r.txCount > max.txCount ? r : max),
      { chain: 'ethereum', txCount: 0, volume: 0 },
    );

    // Calculate activity consistency (how evenly distributed across chains)
    const activityConsistency =
      activeChains.length > 0
        ? 1 -
          this.calculateVariance(
            activeChains.map((r) => r.txCount),
          )
        : 0;

    // Determine unified profile
    const profiles: string[] = [];
    if (activeChains.length >= 5) profiles.push('Multi-chain Active');
    if (totalTx > 1000) profiles.push('High Frequency');
    if (totalVolume > 10000000) profiles.push('High Volume');
    if (activeChains.length === 1) profiles.push('Single Chain Focus');

    return {
      address,
      chains: activeChains.map((r) => r.chain),
      totalTransactions: totalTx,
      totalVolume,
      crossChainActivity: chainResults,
      unifiedProfile: profiles.join(' + ') || 'Casual User',
      dominantChain: dominant.chain,
      activityConsistency: Math.max(0, activityConsistency),
      complexity: this.calculateComplexity(chainResults),
    };
  }

  private async fetchTxData(address: string, chain: string): Promise<any[]> {
    // Generate realistic mock transaction data based on address
    const hash = this.hashCode(address);
    const txCount = Math.abs(hash % 500) + 10;
    const txs = [];

    for (let i = 0; i < txCount; i++) {
      const txHash = this.generateTxHash(hash + i);
      const timestamp = Date.now() - Math.abs((hash + i * 1000) % (365 * 24 * 60 * 60 * 1000));
      const hour = new Date(timestamp).getHours();
      const day = new Date(timestamp).getDay();
      
      txs.push({
        hash: txHash,
        from: address,
        to: this.generateContractAddress(hash + i),
        value: Math.abs((hash * (i + 1)) % 100000) / 1000,
        timestamp,
        hour,
        day,
        methodId: this.getRandomMethod(),
        blockNumber: Math.abs(hash + i) % 20000000,
      });
    }

    return txs;
  }

  private performAnalysis(
    address: string,
    chain: string,
    txs: any[],
  ): TxPattern {
    const uniqueContracts = new Set(txs.map((tx) => tx.to)).size;
    const totalVolume = txs.reduce((sum, tx) => sum + tx.value, 0);
    const avgTransactionValue = totalVolume / txs.length;

    // Count contract usage
    const contractCounts: Record<string, number> = {};
    txs.forEach((tx) => {
      const contract = tx.to;
      contractCounts[contract] = (contractCounts[contract] || 0) + 1;
    });

    const mostUsedContracts = Object.entries(contractCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([contract, count]) => ({ contract, count }));

    // Transaction type distribution
    const typeCounts: Record<string, number> = {};
    txs.forEach((tx) => {
      const type = this.contractTypeSignatures[tx.methodId] || 'Unknown';
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });

    const transactionTypes = Object.entries(typeCounts)
      .map(([type, count]) => ({
        type,
        count,
        percentage: (count / txs.length) * 100,
      }))
      .sort((a, b) => b.count - a.count);

    // Time distribution (hour)
    const hourCounts: Record<number, number> = {};
    txs.forEach((tx) => {
      hourCounts[tx.hour] = (hourCounts[tx.hour] || 0) + 1;
    });

    const timeDistribution = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      count: hourCounts[hour] || 0,
      percentage: ((hourCounts[hour] || 0) / txs.length) * 100,
    }));

    // Day distribution
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayCounts: Record<number, number> = {};
    txs.forEach((tx) => {
      dayCounts[tx.day] = (dayCounts[tx.day] || 0) + 1;
    });

    const dayDistribution = dayNames.map((name, index) => ({
      day: name,
      count: dayCounts[index] || 0,
      percentage: ((dayCounts[index] || 0) / txs.length) * 100,
    }));

    // Calculate activity score (0-100)
    const activityScore = this.calculateActivityScore(txs, uniqueContracts, totalVolume);

    // Determine behavior profile
    const behaviorProfile = this.determineBehaviorProfile(
      txs,
      uniqueContracts,
      transactionTypes,
    );

    // Risk assessment
    const riskLevel = this.assessRisk(txs, uniqueContracts, totalVolume);

    // Identify patterns
    const patterns = this.identifyPatterns(
      txs,
      timeDistribution,
      transactionTypes,
    );

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      behaviorProfile,
      riskLevel,
      transactionTypes,
    );

    return {
      address,
      chain,
      totalTransactions: txs.length,
      uniqueContracts,
      totalVolume,
      avgTransactionValue,
      mostUsedContracts,
      transactionTypes,
      timeDistribution,
      dayDistribution,
      activityScore,
      behaviorProfile,
      riskLevel,
      patterns,
      recommendations,
    };
  }

  private calculateActivityScore(
    txs: any[],
    uniqueContracts: number,
    totalVolume: number,
  ): number {
    // Frequency score
    const frequencyScore = Math.min(30, (txs.length / 100) * 30);
    
    // Diversity score
    const diversityScore = Math.min(30, (uniqueContracts / 50) * 30);
    
    // Volume score
    const volumeScore = Math.min(40, (totalVolume / 100000) * 40);
    
    return Math.round(frequencyScore + diversityScore + volumeScore);
  }

  private determineBehaviorProfile(
    txs: any[],
    uniqueContracts: number,
    transactionTypes: { type: string; count: number; percentage: number }[],
  ): string {
    const profiles: string[] = [];
    
    const erc20Transfers = transactionTypes.find(t => t.type === 'ERC20 Transfer');
    const swaps = transactionTypes.find(t => t.type.includes('Swap'));
    
    if (txs.length > 200) profiles.push('Active Trader');
    if (erc20Transfers && erc20Transfers.percentage > 50) profiles.push('Token Mover');
    if (swaps && swaps.percentage > 30) profiles.push('DEX User');
    if (uniqueContracts > 30) profiles.push('DApp Explorer');
    if (txs.length < 50) profiles.push('Occasional User');
    
    return profiles.join(' + ') || 'General User';
  }

  private assessRisk(
    txs: any[],
    uniqueContracts: number,
    totalVolume: number,
  ): 'low' | 'medium' | 'high' {
    let riskScore = 0;
    
    // High transaction count to unknown contracts increases risk
    if (uniqueContracts > 50) riskScore += 30;
    else if (uniqueContracts > 30) riskScore += 15;
    
    // Very high volume can indicate risk
    if (totalVolume > 10000000) riskScore += 30;
    else if (totalVolume > 1000000) riskScore += 15;
    
    // Very frequent trading
    if (txs.length > 500) riskScore += 20;
    
    if (riskScore >= 50) return 'high';
    if (riskScore >= 25) return 'medium';
    return 'low';
  }

  private identifyPatterns(
    txs: any[],
    timeDistribution: { hour: number; count: number; percentage: number }[],
    transactionTypes: { type: string; count: number; percentage: number }[],
  ): string[] {
    const patterns: string[] = [];
    
    // Check for time patterns
    const peakHour = timeDistribution.reduce((max, t) => 
      t.count > max.count ? t : max, timeDistribution[0]);
    
    if (peakHour.hour >= 0 && peakHour.hour < 6) {
      patterns.push('Night Owl - Most active during night hours');
    } else if (peakHour.hour >= 9 && peakHour.hour < 18) {
      patterns.push('Day Trader - Most active during business hours');
    }
    
    // Check for day patterns
    const weekdays = timeDistribution.slice(1, 6);
    const weekend = [timeDistribution[0], timeDistribution[6]];
    const weekdayActivity = weekdays.reduce((sum, d) => sum + d.count, 0);
    const weekendActivity = weekend.reduce((sum, d) => sum + d.count, 0);
    
    if (weekdayActivity > weekendActivity * 3) {
      patterns.push('Weekday Focused - More active on weekdays');
    } else if (weekendActivity > weekdayActivity * 0.5) {
      patterns.push('Flexible Schedule - Active on weekends too');
    }
    
    // Check for transaction type patterns
    if (transactionTypes.length === 1) {
      patterns.push('Single Purpose - Focused on one type of activity');
    } else if (transactionTypes.length > 5) {
      patterns.push('Multi-faceted - Diverse DeFi interactions');
    }
    
    return patterns;
  }

  private generateRecommendations(
    behaviorProfile: string,
    riskLevel: 'low' | 'medium' | 'high',
    transactionTypes: { type: string; count: number; percentage: number }[],
  ): string[] {
    const recommendations: string[] = [];
    
    if (riskLevel === 'high') {
      recommendations.push('Consider reviewing your contract interactions');
      recommendations.push('Enable additional security measures for high-value transactions');
    }
    
    if (behaviorProfile.includes('DEX User')) {
      recommendations.push('Monitor gas costs for optimal trading times');
      recommendations.push('Consider using limit orders to avoid slippage');
    }
    
    if (transactionTypes.some(t => t.type === 'ERC20 Approve' && t.percentage > 30)) {
      recommendations.push('Review and revoke unused token approvals regularly');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Continue monitoring your wallet activity');
      recommendations.push('Keep your seed phrase secure');
    }
    
    return recommendations;
  }

  private calculateVariance(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
    const squaredDiffs = numbers.map((n) => Math.pow(n - mean, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / numbers.length;
    const maxVariance = Math.pow(Math.max(...numbers), 2);
    return maxVariance > 0 ? Math.min(1, variance / maxVariance) : 0;
  }

  private calculateComplexity(chainResults: { txCount: number; volume: number }[]): number {
    const activeChains = chainResults.filter(r => r.txCount > 0).length;
    const totalVolume = chainResults.reduce((sum, r) => sum + r.volume, 0);
    
    let complexity = (activeChains / this.supportedChains.length) * 50;
    complexity += Math.min(50, Math.log10(totalVolume + 1) / 8 * 50);
    
    return Math.round(complexity);
  }

  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash;
  }

  private generateTxHash(seed: number): string {
    const chars = '0123456789abcdef';
    let hash = '0x';
    for (let i = 0; i < 64; i++) {
      hash += chars[Math.abs((seed * (i + 1)) % 16)];
    }
    return hash;
  }

  private generateContractAddress(seed: number): string {
    const chars = '0123456789abcdef';
    let address = '0x';
    for (let i = 0; i < 40; i++) {
      address += chars[Math.abs((seed * (i + 1) * 7) % 16)];
    }
    return address;
  }

  private getRandomMethod(): string {
    const methods = Object.keys(this.contractTypeSignatures);
    return methods[Math.floor(Math.random() * methods.length)];
  }
}
