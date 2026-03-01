import { Injectable } from '@nestjs/common';

interface TransactionPattern {
  swapFrequency: number;
  nftActivity: number;
  defiInteractions: number;
  transferVolume: number;
  timeDistribution: { hour: number; count: number }[];
}

interface WalletAnalysis {
  address: string;
  summary: {
    totalTransactions: number;
    walletAge: number;
    totalVolume: number;
    uniqueTokens: number;
    uniqueContracts: number;
  };
  classification: {
    type: 'bot' | 'human' | 'whale' | 'defi-protocol' | 'exchange';
    confidence: number;
    labels: string[];
  };
  patterns: {
    trading: {
      swapCount: number;
      avgSwapInterval: number;
      preferredDex: string[];
      tokensTraded: string[];
    };
    defi: {
      protocols: string[];
      positions: number;
      totalDeposited: number;
    };
    nft: {
      collections: string[];
      totalNfts: number;
      floorValue: number;
    };
    timing: {
      activeHours: number[];
      dayDistribution: number[];
      avgTxPerDay: number;
    };
  };
  risk: {
    score: number;
    factors: string[];
    flags: string[];
  };
  insights: string[];
  recommendations: string[];
}

@Injectable()
export class AppService {
  private readonly ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || '';
  private readonly ALCHEMY_KEY = process.env.ALCHEMY_KEY || '';

  async analyzeWallet(address: string): Promise<WalletAnalysis> {
    const isValidAddress = /^0x[a-fA-F0-9]{40}$/.test(address);
    if (!isValidAddress) {
      throw new Error('Invalid Ethereum address');
    }

    // Fetch data from APIs (simulated for demo)
    const txData = await this.fetchTransactionData(address);
    const tokenTransfers = await this.fetchTokenTransfers(address);
    const nftTransfers = await this.fetchNftTransfers(address);

    // Analyze the data
    const summary = this.calculateSummary(txData, tokenTransfers, nftTransfers);
    const classification = this.classifyWallet(txData, tokenTransfers, nftTransfers);
    const patterns = this.analyzePatterns(txData, tokenTransfers, nftTransfers);
    const risk = this.calculateRisk(txData, tokenTransfers, classification);
    const insights = this.generateInsights(summary, classification, patterns);
    const recommendations = this.generateRecommendations(classification, risk);

    return {
      address,
      summary,
      classification,
      patterns,
      risk,
      insights,
      recommendations,
    };
  }

  async getTransactionPatterns(address: string) {
    const txData = await this.fetchTransactionData(address);
    return this.analyzePatterns(txData, [], []);
  }

  async getWalletBehavior(address: string) {
    const analysis = await this.analyzeWallet(address);
    return {
      behavior: analysis.patterns.timing,
      classification: analysis.classification,
      risk: analysis.risk,
    };
  }

  async classifyWallet(address: string) {
    const txData = await this.fetchTransactionData(address);
    const tokenTransfers = await this.fetchTokenTransfers(address);
    const nftTransfers = await this.fetchNftTransfers(address);
    return this.classifyWallet(txData, tokenTransfers, nftTransfers);
  }

  private async fetchTransactionData(address: string) {
    // Simulated transaction data - in production, fetch from Etherscan/Alchemy
    const txCount = Math.floor(Math.random() * 500) + 10;
    const txs = [];
    const now = Date.now();
    
    for (let i = 0; i < Math.min(txCount, 100); i++) {
      const daysAgo = Math.floor(Math.random() * 365);
      txs.push({
        hash: `0x${Math.random().toString(16).substr(2, 64)}`,
        from: Math.random() > 0.5 ? address : `0x${Math.random().toString(16).substr(2, 40)}`,
        to: Math.random() > 0.5 ? address : `0x${Math.random().toString(16).substr(2, 40)}`,
        value: (Math.random() * 10).toFixed(4),
        timestamp: now - daysAgo * 24 * 60 * 60 * 1000,
        gasPrice: Math.floor(Math.random() * 100) + 20,
        methodId: ['0xa9059cbb', '0x23b872dd', '0x095ea7b3', '0x'][Math.floor(Math.random() * 4)],
      });
    }
    
    return txs.sort((a, b) => b.timestamp - a.timestamp);
  }

  private async fetchTokenTransfers(address: string) {
    const count = Math.floor(Math.random() * 50);
    const transfers = [];
    const tokens = ['USDT', 'USDC', 'WBTC', 'UNI', 'LINK', 'AAVE', 'CRV', 'MATIC'];
    
    for (let i = 0; i < count; i++) {
      transfers.push({
        token: tokens[Math.floor(Math.random() * tokens.length)],
        from: Math.random() > 0.5 ? address : `0x${Math.random().toString(16).substr(2, 40)}`,
        to: Math.random() > 0.5 ? address : `0x${Math.random().toString(16).substr(2, 40)}`,
        value: (Math.random() * 10000).toFixed(2),
        timestamp: Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000,
      });
    }
    return transfers;
  }

  private async fetchNftTransfers(address: string) {
    const count = Math.floor(Math.random() * 20);
    const collections = ['Bored Ape Yacht Club', 'CryptoPunks', 'Azuki', 'Otherdeed', 'CloneX'];
    const transfers = [];
    
    for (let i = 0; i < count; i++) {
      transfers.push({
        collection: collections[Math.floor(Math.random() * collections.length)],
        tokenId: Math.floor(Math.random() * 10000),
        from: Math.random() > 0.5 ? address : `0x${Math.random().toString(16).substr(2, 40)}`,
        to: Math.random() > 0.5 ? address : `0x${Math.random().toString(16).substr(2, 40)}`,
        price: (Math.random() * 100).toFixed(2),
        timestamp: Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000,
      });
    }
    return transfers;
  }

  private calculateSummary(txs: any[], tokenTransfers: any[], nftTransfers: any[]) {
    const now = Date.now();
    const firstTx = txs[txs.length - 1];
    const walletAge = firstTx ? Math.floor((now - firstTx.timestamp) / (1000 * 60 * 60 * 24)) : 0;
    
    const totalVolume = txs.reduce((sum, tx) => sum + parseFloat(tx.value), 0);
    const uniqueTokens = new Set(tokenTransfers.map(t => t.token)).size;
    const uniqueContracts = new Set(txs.map(tx => tx.to).filter(Boolean)).size;

    return {
      totalTransactions: txs.length,
      walletAge,
      totalVolume: totalVolume.toFixed(2),
      uniqueTokens,
      uniqueContracts,
    };
  }

  private classifyWallet(txs: any[], tokenTransfers: any[], nftTransfers: any[]) {
    const swapCount = tokenTransfers.length;
    const nftCount = nftTransfers.length;
    const totalVolume = txs.reduce((sum, tx) => sum + parseFloat(tx.value), 0);
    
    let type: string;
    let confidence: number;
    const labels: string[] = [];

    if (nftCount > 5) {
      type = 'whale';
      confidence = 0.85;
      labels.push('NFT Collector');
    } else if (swapCount > 30 && totalVolume > 100) {
      type = 'whale';
      confidence = 0.8;
      labels.push('Active Trader');
    } else if (swapCount > 10 && tokenTransfers.length > 0) {
      type = 'human';
      confidence = 0.75;
      labels.push('DeFi User');
    } else if (txs.length > 0 && swapCount === 0 && nftCount === 0) {
      // Check for bot-like behavior
      const avgInterval = this.calculateAvgInterval(txs);
      if (avgInterval < 60) { // Less than 1 minute average
        type = 'bot';
        confidence = 0.7;
        labels.push('High Frequency');
      } else {
        type = 'human';
        confidence = 0.65;
        labels.push('Occasional User');
      }
    } else {
      type = 'human';
      confidence = 0.6;
      labels.push('Casual User');
    }

    if (totalVolume > 1000) {
      labels.push('Large Volume');
    }

    return { type, confidence, labels };
  }

  private calculateAvgInterval(txs: any[]): number {
    if (txs.length < 2) return 0;
    const intervals = [];
    for (let i = 0; i < txs.length - 1; i++) {
      intervals.push((txs[i].timestamp - txs[i + 1].timestamp) / (1000 * 60)); // minutes
    }
    return intervals.reduce((a, b) => a + b, 0) / intervals.length;
  }

  private analyzePatterns(txs: any[], tokenTransfers: any[], nftTransfers: any[]) {
    // Trading patterns
    const swapCount = tokenTransfers.length;
    const tokens = [...new Set(tokenTransfers.map(t => t.token))];
    const avgSwapInterval = txs.length > 1 ? this.calculateAvgInterval(txs) : 0;
    
    // DeFi patterns
    const defiProtocols = ['Uniswap', 'Aave', 'Compound', 'Curve', 'SushiSwap'];
    const usedProtocols = defiProtocols.filter(() => Math.random() > 0.5);
    
    // NFT patterns
    const collections = [...new Set(nftTransfers.map(n => n.collection))];
    
    // Timing patterns
    const hourCounts = new Array(24).fill(0);
    const dayCounts = new Array(7).fill(0);
    
    txs.forEach(tx => {
      const date = new Date(tx.timestamp);
      hourCounts[date.getHours()]++;
      dayCounts[date.getDay()]++;
    });

    const activeHours = hourCounts
      .map((count, hour) => ({ hour, count }))
      .filter(h => h.count > 0)
      .map(h => h.hour);

    const totalDays = Math.max(1, txs.length / 10);
    
    return {
      trading: {
        swapCount,
        avgSwapInterval: Math.round(avgSwapInterval),
        preferredDex: usedProtocols.slice(0, 3),
        tokensTraded: tokens.slice(0, 10),
      },
      defi: {
        protocols: usedProtocols,
        positions: usedProtocols.length,
        totalDeposited: (Math.random() * 100).toFixed(2),
      },
      nft: {
        collections,
        totalNfts: nftTransfers.length,
        floorValue: (Math.random() * 50).toFixed(2),
      },
      timing: {
        activeHours,
        dayDistribution: dayCounts,
        avgTxPerDay: (txs.length / totalDays).toFixed(2),
      },
    };
  }

  private calculateRisk(txs: any[], tokenTransfers: any[], classification: any) {
    let score = 30; // Base score (lower = riskier)
    const factors: string[] = [];
    const flags: string[] = [];

    // Wallet age factor
    const firstTx = txs[txs.length - 1];
    if (firstTx) {
      const age = (Date.now() - firstTx.timestamp) / (1000 * 60 * 60 * 24);
      if (age < 7) {
        score -= 20;
        factors.push('New wallet (< 7 days)');
        flags.push('New Wallet');
      } else if (age > 365) {
        score += 20;
        factors.push('Established wallet (> 1 year)');
      }
    }

    // Transaction count
    if (txs.length < 5) {
      score -= 15;
      factors.push('Low transaction count');
      flags.push('Low Activity');
    } else if (txs.length > 100) {
      score += 15;
      factors.push('High transaction count');
    }

    // Volume factor
    const volume = txs.reduce((sum, tx) => sum + parseFloat(tx.value), 0);
    if (volume > 100) {
      score += 10;
      factors.push('Significant volume');
    }

    // Classification-based risk
    if (classification.type === 'bot') {
      score -= 25;
      flags.push('Automated Activity');
    } else if (classification.type === 'whale') {
      score += 10;
    }

    // Token transfer patterns
    const uniqueTokens = new Set(tokenTransfers.map(t => t.token)).size;
    if (uniqueTokens > 20) {
      score += 10;
      factors.push('Diversified portfolio');
    } else if (uniqueTokens === 1) {
      score -= 10;
      factors.push('Single token focus');
    }

    // Clamp score
    score = Math.max(0, Math.min(100, score));

    return {
      score,
      factors,
      flags,
    };
  }

  private generateInsights(summary: any, classification: any, patterns: any): string[] {
    const insights: string[] = [];

    if (summary.walletAge > 365) {
      insights.push(`This is an established wallet with ${summary.walletAge} days of history`);
    }

    if (classification.type === 'whale') {
      insights.push(' whale with significant trading activity');
    }

    if (patterns.trading.swapCount > 20) {
      insights.push(`Active DeFi trader with ${patterns.trading.swapCount} token swaps`);
    }

    if (patterns.nft.totalNfts > 0) {
      insights.push(`NFT collector with ${patterns.nft.totalNfts} NFT transactions`);
    }

    if (patterns.timing.avgTxPerDay > 5) {
      insights.push(`High activity: ~${patterns.timing.avgTxPerDay} transactions per day`);
    }

    if (patterns.defi.protocols.length > 2) {
      insights.push(`Multi-protocol user: ${patterns.defi.protocols.join(', ')}`);
    }

    return insights;
  }

  private generateRecommendations(classification: any, risk: any): string[] {
    const recommendations: string[] = [];

    if (risk.score < 50) {
      recommendations.push('Consider verifying this wallet before transactions');
      recommendations.push('Check transaction history for suspicious patterns');
    } else {
      recommendations.push('Wallet appears trustworthy based on activity patterns');
    }

    if (classification.type === 'human' && classification.labels.includes('DeFi User')) {
      recommendations.push('Active DeFi participant - good for partnerships');
    }

    if (risk.flags.includes('New Wallet')) {
      recommendations.push('Exercise caution with new wallets - verify source of funds');
    }

    return recommendations;
  }
}
