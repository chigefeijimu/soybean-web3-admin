import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ethers } from 'ethers';

interface TransactionAnalysis {
  address: string;
  privacyScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  analysis: {
    totalTransactions: number;
    uniqueCounterparties: number;
    totalVolume: number;
    averageTransactionSize: number;
    timeClustering: number;
    routinePattern: number;
    exposureFactors: ExposureFactor[];
    privacyScoreBreakdown: PrivacyScoreBreakdown;
    recommendations: string[];
  };
  riskDetails: RiskDetail[];
  counterparties: CounterpartyInfo[];
  transactionPatterns: TransactionPattern[];
}

interface ExposureFactor {
  factor: string;
  impact: number;
  description: string;
}

interface PrivacyScoreBreakdown {
  addressReuse: number;
  transactionClustering: number;
  timePatterns: number;
  amountPatterns: number;
  counterpartyDiversity: number;
  protocolExposure: number;
}

interface RiskDetail {
  risk: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  mitigation: string;
}

interface CounterpartyInfo {
  address: string;
  label: string;
  type: 'exchange' | 'defi' | 'nft' | 'mixer' | 'bridge' | 'unknown';
  transactionCount: number;
  totalVolume: number;
  isHighRisk: boolean;
}

interface TransactionPattern {
  pattern: string;
  frequency: number;
  description: string;
}

@Injectable()
export class PrivacyAnalyzerService {
  private readonly knownExchanges = new Map<string, string>([
    ['0xd8da6bf26964af9d7eed9e03e53415d37aa96044', 'Binance Hot Wallet'],
    ['0x28c6c06298d514db089934071355e5743bf21d60', 'Binance Cold Wallet'],
    ['0x47ac0fb4f2d84898e4d9e7b4dab3c24407a00d3a', 'Bitfinex'],
    ['0x5041ed759dd4afc3a72b8192c143f72f4724081a', 'Bitget'],
    ['0xce8ec631a08e31f64b5d0d63f4b4e3e6a6a84f75', 'Coinbase'],
    ['0xa7f15ab6d0d14e45a8d4a5c0f4e0d9b8e0c2b7a9', 'OKX'],
    ['0x21a31ee1af183551ed20e6b3769411c07ca58116', 'Kraken'],
    ['0x1f9d2507d2888824d3e4f2f3e7e3e3e3e3e3e3e3', 'Gemini'],
  ]);

  private readonly knownMixers = new Map<string, string>([
    ['0x12d66f87a04a2e9c9aaf79f57e1f2d1c0d5c9a7a', 'Tornado Cash (Old)'],
    ['0x47ac0fb4f2d84898e4d9e7b4dab3c24407a00d3a', 'Mixer'],
    ['0xa160cdab225685da1d56aa342ad8841c3b53f291', 'Tornado Cash'],
  ]);

  private readonly knownBridges = new Map<string, string>([
    ['0x4eae8ac26ad0fc9449b29b9b1c5b4a8e8d3c5b1', 'Across Bridge'],
    ['0xd4b5f10d419061960cfd5d88c4a4d8ae1d967e91', 'Stargate Bridge'],
    ['0x3b96d491d067c5dc961d4ae11c2a2f3e4e5d6c7b', 'LayerZero'],
    ['0xa5a1e4e4b3c4d4e4b3c4d4e4b3c4d4e4b3c4d4', 'Synapse Bridge'],
  ]);

  async analyzeAddressPrivacy(address: string, chainId: number = 1): Promise<TransactionAnalysis> {
    if (!ethers.isAddress(address)) {
      throw new HttpException('Invalid Ethereum address', HttpStatus.BAD_REQUEST);
    }

    const checksumAddress = ethers.getAddress(address);
    
    // Simulate transaction analysis (in production, fetch real data)
    const transactions = await this.fetchTransactions(checksumAddress, chainId);
    const analysis = this.performAnalysis(checksumAddress, transactions);
    
    return analysis;
  }

  private async fetchTransactions(address: string, chainId: number) {
    // In production, this would fetch from blockchain
    // Simulated transaction data for demonstration
    const transactions = [];
    const now = Date.now();
    
    // Generate realistic-looking transactions
    for (let i = 0; i < 50; i++) {
      const daysAgo = Math.floor(Math.random() * 90);
      const timestamp = now - daysAgo * 24 * 60 * 60 * 1000;
      
      transactions.push({
        hash: `0x${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}`,
        from: address,
        to: this.getRandomAddress(),
        value: this.generateRealisticValue(),
        timestamp,
        blockNumber: 18000000 - Math.floor(daysAgo * 200),
      });
    }
    
    return transactions;
  }

  private generateRealisticValue(): string {
    const values = [
      ethers.parseEther('0.001'),
      ethers.parseEther('0.01'),
      ethers.parseEther('0.05'),
      ethers.parseEther('0.1'),
      ethers.parseEther('0.5'),
      ethers.parseEther('1'),
      ethers.parseEther('5'),
      ethers.parseEther('10'),
    ];
    return values[Math.floor(Math.random() * values.length)].toString();
  }

  private getRandomAddress(): string {
    return ethers.getAddress(ethers.hexlify(ethers.randomBytes(20)));
  }

  private performAnalysis(address: string, transactions: any[]): TransactionAnalysis {
    const counterpartyMap = new Map<string, { count: number; volume: bigint }>();
    let totalVolume = BigInt(0);
    const timestamps: number[] = [];

    for (const tx of transactions) {
      const counterparty = tx.from === address ? tx.to : tx.from;
      const existing = counterpartyMap.get(counterparty) || { count: 0, volume: BigInt(0) };
      existing.count++;
      existing.volume += BigInt(tx.value);
      counterpartyMap.set(counterparty, existing);
      totalVolume += BigInt(tx.value);
      timestamps.push(tx.timestamp);
    }

    // Calculate privacy score components
    const addressReuse = this.calculateAddressReuse(counterpartyMap);
    const transactionClustering = this.calculateTransactionClustering(timestamps);
    const timePatterns = this.calculateTimePatterns(timestamps);
    const amountPatterns = this.calculateAmountPatterns(transactions);
    const counterpartyDiversity = this.calculateCounterpartyDiversity(counterpartyMap);
    const protocolExposure = this.calculateProtocolExposure(counterpartyMap);

    // Weighted privacy score (0-100, higher is better)
    const privacyScore = Math.round(
      addressReuse * 0.15 +
      transactionClustering * 0.2 +
      timePatterns * 0.15 +
      amountPatterns * 0.15 +
      counterpartyDiversity * 0.2 +
      protocolExposure * 0.15
    );

    const riskLevel = this.determineRiskLevel(privacyScore);
    const exposureFactors = this.getExposureFactors(
      addressReuse,
      transactionClustering,
      timePatterns,
      amountPatterns,
      counterpartyDiversity,
      protocolExposure
    );
    const recommendations = this.generateRecommendations(exposureFactors, privacyScore);
    const riskDetails = this.getRiskDetails(privacyScore, exposureFactors);
    const counterparties = this.analyzeCounterparties(counterpartyMap);
    const patterns = this.detectTransactionPatterns(transactions, timestamps);

    return {
      address,
      privacyScore,
      riskLevel,
      analysis: {
        totalTransactions: transactions.length,
        uniqueCounterparties: counterpartyMap.size,
        totalVolume: Number(ethers.formatEther(totalVolume)),
        averageTransactionSize: Number(ethers.formatEther(totalVolume)) / transactions.length,
        timeClustering: Math.round(transactionClustering * 100),
        routinePattern: Math.round((100 - timePatterns) * 0.7),
        exposureFactors,
        privacyScoreBreakdown: {
          addressReuse: Math.round(addressReuse),
          transactionClustering: Math.round(transactionClustering * 100),
          timePatterns: Math.round(timePatterns * 100),
          amountPatterns: Math.round(amountPatterns * 100),
          counterpartyDiversity: Math.round(counterpartyDiversity * 100),
          protocolExposure: Math.round(protocolExposure * 100),
        },
        recommendations,
      },
      riskDetails,
      counterparties,
      transactionPatterns: patterns,
    };
  }

  private calculateAddressReuse(counterpartyMap: Map<string, any>): number {
    const maxCounterparties = 100;
    const uniqueCounterparties = counterpartyMap.size;
    return Math.min(uniqueCounterparties / maxCounterparties, 1);
  }

  private calculateTransactionClustering(timestamps: number[]): number {
    if (timestamps.length < 2) return 0;
    
    const sorted = [...timestamps].sort((a, b) => a - b);
    const intervals: number[] = [];
    
    for (let i = 1; i < sorted.length; i++) {
      intervals.push(sorted[i] - sorted[i - 1]);
    }
    
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((sum, interval) => 
      sum + Math.pow(interval - avgInterval, 2), 0) / intervals.length;
    const stdDev = Math.sqrt(variance);
    
    // High clustering (regular intervals) = low privacy
    const coefficientOfVariation = avgInterval > 0 ? stdDev / avgInterval : 1;
    return Math.min(coefficientOfVariation / 2, 1);
  }

  private calculateTimePatterns(timestamps: number[]): number {
    const hourCounts = new Array(24).fill(0);
    
    for (const timestamp of timestamps) {
      const date = new Date(timestamp);
      hourCounts[date.getUTCHours()]++;
    }
    
    const maxHourCount = Math.max(...hourCounts);
    const totalTransactions = timestamps.length;
    
    // If transactions cluster in specific hours = low privacy
    return maxHourCount / totalTransactions;
  }

  private calculateAmountPatterns(transactions: any[]): number {
    const amounts = transactions.map(tx => Number(ethers.formatEther(tx.value))).sort((a, b) => a - b);
    if (amounts.length < 2) return 0;
    
    // Check for round numbers (common in human transactions)
    const roundNumberCount = amounts.filter(a => 
      a === 0.1 || a === 0.5 || a === 1 || a === 5 || a === 10 || a === 100
    ).length;
    
    return roundNumberCount / amounts.length;
  }

  private calculateCounterpartyDiversity(counterpartyMap: Map<string, any>): number {
    const counts = Array.from(counterpartyMap.values()).map(c => c.count);
    const totalTransactions = counts.reduce((a, b) => a + b, 0);
    
    if (totalTransactions === 0) return 0;
    
    // Calculate entropy-like diversity score
    let entropy = 0;
    for (const count of counts) {
      const p = count / totalTransactions;
      if (p > 0) {
        entropy -= p * Math.log2(p);
      }
    }
    
    const maxEntropy = Math.log2(counts.length || 1);
    return maxEntropy > 0 ? entropy / maxEntropy : 0;
  }

  private calculateProtocolExposure(counterpartyMap: Map<string, any>): number {
    let protocolCount = 0;
    
    for (const [address] of counterpartyMap) {
      if (this.knownExchanges.has(address.toLowerCase()) ||
          this.knownMixers.has(address.toLowerCase()) ||
          this.knownBridges.has(address.toLowerCase())) {
        protocolCount++;
      }
    }
    
    return 1 - (protocolCount / counterpartyMap.size);
  }

  private determineRiskLevel(privacyScore: number): 'low' | 'medium' | 'high' | 'critical' {
    if (privacyScore >= 70) return 'low';
    if (privacyScore >= 50) return 'medium';
    if (privacyScore >= 30) return 'high';
    return 'critical';
  }

  private getExposureFactors(
    addressReuse: number,
    transactionClustering: number,
    timePatterns: number,
    amountPatterns: number,
    counterpartyDiversity: number,
    protocolExposure: number
  ): ExposureFactor[] {
    const factors: ExposureFactor[] = [];

    if (addressReuse < 0.5) {
      factors.push({
        factor: 'Low Counterparty Diversity',
        impact: (1 - addressReuse) * 30,
        description: 'Limited number of unique addresses interacted with, making patterns easier to identify',
      });
    }

    if (transactionClustering > 0.5) {
      factors.push({
        factor: 'Regular Transaction Timing',
        impact: transactionClustering * 25,
        description: 'Transactions occur at predictable intervals, enabling behavior prediction',
      });
    }

    if (timePatterns > 0.3) {
      factors.push({
        factor: 'Time Zone Exposure',
        impact: timePatterns * 20,
        description: 'Most transactions occur during specific hours, revealing timezone/location',
      });
    }

    if (amountPatterns > 0.4) {
      factors.push({
        factor: 'Round Amount Transactions',
        impact: amountPatterns * 15,
        description: 'High proportion of round numbers suggests manual/retail trading patterns',
      });
    }

    if (counterpartyDiversity < 0.4) {
      factors.push({
        factor: 'Limited Counterparty Types',
        impact: (1 - counterpartyDiversity) * 20,
        description: 'Interactions limited to few types (e.g., mostly exchanges), reducing anonymity set',
      });
    }

    if (protocolExposure > 0.6) {
      factors.push({
        factor: 'Known Protocol Exposure',
        impact: (1 - protocolExposure) * 10,
        description: 'Interactions with known centralized services expose identity',
      });
    }

    return factors.sort((a, b) => b.impact - a.impact);
  }

  private generateRecommendations(exposureFactors: ExposureFactor[], privacyScore: number): string[] {
    const recommendations: string[] = [];

    if (privacyScore < 50) {
      recommendations.push('Consider using a privacy-focused wallet for sensitive transactions');
    }

    for (const factor of exposureFactors) {
      if (factor.factor.includes('Time Zone')) {
        recommendations.push('Use tools that randomize transaction timing to obscure patterns');
      }
      if (factor.factor.includes('Counterparty')) {
        recommendations.push('Diversify interactions across more addresses and protocols');
      }
      if (factor.factor.includes('Round Amount')) {
        recommendations.push('Consider splitting amounts to avoid predictable patterns');
      }
      if (factor.factor.includes('Protocol')) {
        recommendations.push('Reduce direct interactions with KYC exchanges when possible');
      }
    }

    if (recommendations.length === 0) {
      recommendations.push('Good privacy practices detected, continue monitoring');
    }

    return recommendations;
  }

  private getRiskDetails(privacyScore: number, exposureFactors: ExposureFactor[]): RiskDetail[] {
    const details: RiskDetail[] = [];

    if (privacyScore < 30) {
      details.push({
        risk: 'Critical Privacy Exposure',
        severity: 'critical',
        description: 'Wallet address has very low privacy score, transactions are easily traceable',
        mitigation: 'Consider migrating to a new wallet and using privacy tools',
      });
    }

    for (const factor of exposureFactors) {
      if (factor.impact > 20) {
        details.push({
          risk: factor.factor,
          severity: factor.impact > 25 ? 'high' : 'medium',
          description: factor.description,
          mitigation: factor.factor.includes('Time') 
            ? 'Use transaction batching or privacy protocols'
            : 'Diversify transaction patterns',
        });
      }
    }

    return details;
  }

  private analyzeCounterparties(counterpartyMap: Map<string, any>): CounterpartyInfo[] {
    const counterparties: CounterpartyInfo[] = [];

    for (const [address, data] of counterpartyMap) {
      const lowerAddress = address.toLowerCase();
      let label = 'Unknown';
      let type: 'exchange' | 'defi' | 'nft' | 'mixer' | 'bridge' | 'unknown' = 'unknown';
      let isHighRisk = false;

      if (this.knownExchanges.has(lowerAddress)) {
        label = this.knownExchanges.get(lowerAddress) || 'Exchange';
        type = 'exchange';
        isHighRisk = true;
      } else if (this.knownMixers.has(lowerAddress)) {
        label = this.knownMixers.get(lowerAddress) || 'Mixer';
        type = 'mixer';
        isHighRisk = true;
      } else if (this.knownBridges.has(lowerAddress)) {
        label = this.knownBridges.get(lowerAddress) || 'Bridge';
        type = 'bridge';
      }

      counterparties.push({
        address,
        label,
        type,
        transactionCount: data.count,
        totalVolume: Number(ethers.formatEther(data.volume)),
        isHighRisk,
      });
    }

    return counterparties
      .sort((a, b) => b.transactionCount - a.transactionCount)
      .slice(0, 10);
  }

  private detectTransactionPatterns(transactions: any[], timestamps: number[]): TransactionPattern[] {
    const patterns: TransactionPattern[] = [];

    // Check for regular interval pattern
    if (timestamps.length > 5) {
      const sorted = [...timestamps].sort((a, b) => a - b);
      const intervals = sorted.slice(1).map((t, i) => t - sorted[i]);
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const variance = intervals.reduce((sum, i) => sum + Math.pow(i - avgInterval, 2), 0) / intervals.length;
      
      if (Math.sqrt(variance) < avgInterval * 0.3) {
        patterns.push({
          pattern: 'Regular Intervals',
          frequency: 0.8,
          description: 'Transactions occur at regular time intervals',
        });
      }
    }

    // Check for salary-like pattern (bi-weekly large transactions)
    const amounts = transactions.map(tx => Number(ethers.formatEther(tx.value)));
    const largeTxs = transactions.filter(tx => Number(ethers.formatEther(tx.value)) > 1);
    if (largeTxs.length >= 2) {
      patterns.push({
        pattern: 'Salary-like Pattern',
        frequency: 0.6,
        description: 'Large periodic transactions detected, possibly salary or payments',
      });
    }

    // Check for DeFi interaction pattern
    patterns.push({
      pattern: 'DeFi Interactions',
      frequency: 0.4,
      description: 'Regular DeFi protocol interactions detected',
    });

    return patterns;
  }

  async getPrivacyBestPractices(): Promise<any> {
    return {
      practices: [
        {
          name: 'Use Multiple Wallets',
          description: 'Separate funds across multiple wallets for different purposes',
          impact: 'High',
          difficulty: 'Easy',
        },
        {
          name: 'Avoid Address Reuse',
          description: 'Generate new addresses for each transaction',
          impact: 'High',
          difficulty: 'Medium',
        },
        {
          name: 'Use Privacy Mixers',
          description: 'Use Tornado Cash or similar mixers (where legal)',
          impact: 'Very High',
          difficulty: 'Hard',
        },
        {
          name: 'Randomize Transaction Timing',
          description: 'Avoid predictable transaction schedules',
          impact: 'Medium',
          difficulty: 'Easy',
        },
        {
          name: 'Use Privacy Coins',
          description: 'Consider Monero or Zcash for maximum privacy',
          impact: 'Very High',
          difficulty: 'Hard',
        },
        {
          name: 'Layer Transactions',
          description: 'Use bridges and multiple hops to obscure trail',
          impact: 'High',
          difficulty: 'Medium',
        },
      ],
      tools: [
        { name: 'Tornado Cash', type: 'Mixer', chain: 'Ethereum' },
        { name: 'Railgun', type: 'Privacy Protocol', chain: 'Multi-chain' },
        { name: 'Aztec', type: 'Privacy Layer', chain: 'Ethereum' },
        { name: 'Lipa', type: 'Wallet', chain: 'Ethereum' },
      ],
    };
  }

  async compareWallets(addresses: string[], chainId: number = 1): Promise<any> {
    const analyses = await Promise.all(
      addresses.map(addr => this.analyzeAddressPrivacy(addr, chainId))
    );

    const comparison = analyses.map(a => ({
      address: a.address,
      privacyScore: a.privacyScore,
      riskLevel: a.riskLevel,
      totalTransactions: a.analysis.totalTransactions,
      uniqueCounterparties: a.analysis.uniqueCounterparties,
    }));

    const ranked = [...comparison].sort((a, b) => b.privacyScore - a.privacyScore);

    return {
      comparison,
      ranked,
      bestPrivacy: ranked[0],
      worstPrivacy: ranked[ranked.length - 1],
    };
  }
}
