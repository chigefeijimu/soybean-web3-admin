import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface MultisigWallet {
  address: string;
  chainId: number;
  threshold: number;
  owners: string[];
  implementation?: string;
}

export interface SignerActivity {
  address: string;
  transactionsSigned: number;
  lastSignedAt?: string;
  activityScore: number;
}

export interface HealthMetrics {
  overallScore: number;
  signerActivity: SignerActivity[];
  pendingTransactions: number;
  recentConfirmations: number;
  lastActivityAt?: string;
  riskFactors: RiskFactor[];
}

export interface RiskFactor {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  recommendation: string;
}

export interface WalletHealthReport {
  address: string;
  chainId: number;
  chainName: string;
  threshold: number;
  owners: string[];
  ownerCount: number;
  healthMetrics: HealthMetrics;
  healthGrade: 'A+' | 'A' | 'B+' | 'B' | 'C' | 'D' | 'F';
  recommendations: string[];
  lastUpdated: string;
}

@Injectable()
export class MultisigHealthMonitorService {
  private readonly chainConfigs: Record<number, { name: string; explorer: string; rpc: string }> = {
    1: { name: 'Ethereum', explorer: 'https://api.etherscan.io/api', rpc: 'https://eth.llamarpc.com' },
    137: { name: 'Polygon', explorer: 'https://api.polygonscan.com/api', rpc: 'https://polygon-rpc.com' },
    42161: { name: 'Arbitrum', explorer: 'https://api.arbiscan.io/api', rpc: 'https://arb1.arbitrum.io/rpc' },
    10: { name: 'Optimism', explorer: 'https://api-optimistic.etherscan.io/api', rpc: 'https://mainnet.optimism.io' },
    56: { name: 'BSC', explorer: 'https://api.bscscan.com/api', rpc: 'https://bsc-dataseed.binance.org' },
    8453: { name: 'Base', explorer: 'https://api.basescan.org/api', rpc: 'https://mainnet.base.org' },
    43114: { name: 'Avalanche', explorer: 'https://api.snowtrace.io/api', rpc: 'https://api.avax.network/ext/bc/C/rpc' },
  };

  constructor(private readonly httpService: HttpService) {}

  async getWalletHealth(walletAddress: string, chainId: number): Promise<WalletHealthReport> {
    const chainConfig = this.chainConfigs[chainId];
    if (!chainConfig) {
      throw new Error(`Chain ${chainId} is not supported`);
    }

    const walletData = await this.fetchMultisigData(walletAddress, chainId, chainConfig);
    const signerActivity = await this.analyzeSignerActivity(walletData.owners, chainId, chainConfig);
    const healthMetrics = this.calculateHealthMetrics(walletData, signerActivity);
    const riskFactors = this.identifyRiskFactors(walletData, healthMetrics, signerActivity);
    const healthGrade = this.calculateHealthGrade(healthMetrics.overallScore);
    const recommendations = this.generateRecommendations(riskFactors, healthMetrics);

    return {
      address: walletAddress,
      chainId,
      chainName: chainConfig.name,
      threshold: walletData.threshold,
      owners: walletData.owners,
      ownerCount: walletData.owners.length,
      healthMetrics: {
        ...healthMetrics,
        riskFactors,
      },
      healthGrade,
      recommendations,
      lastUpdated: new Date().toISOString(),
    };
  }

  async getSignerRanking(walletAddress: string, chainId: number): Promise<{ signers: SignerActivity[] }> {
    const chainConfig = this.chainConfigs[chainId];
    if (!chainConfig) {
      throw new Error(`Chain ${chainId} is not supported`);
    }

    const walletData = await this.fetchMultisigData(walletAddress, chainId, chainConfig);
    const signerActivity = await this.analyzeSignerActivity(walletData.owners, chainId, chainConfig);

    return {
      signers: signerActivity.sort((a, b) => b.activityScore - a.activityScore),
    };
  }

  async getWalletTransactions(walletAddress: string, chainId: number, limit = 20) {
    const chainConfig = this.chainConfigs[chainId];
    if (!chainConfig) {
      throw new Error(`Chain ${chainId} is not supported`);
    }

    try {
      const url = `${chainConfig.explorer}?module=account&action=txlist&address=${walletAddress}&sort=desc&limit=${limit}&apikey=YourApiKeyToken`;
      const response = await firstValueFrom(this.httpService.get(url));
      
      if (response.data.status === '1') {
        return {
          transactions: response.data.result.map((tx: any) => ({
            hash: tx.hash,
            from: tx.from,
            to: tx.to,
            value: tx.value,
            gasUsed: tx.gasUsed,
            gasPrice: tx.gasPrice,
            timestamp: tx.timeStamp,
            blockNumber: tx.blockNumber,
            isError: tx.isError === '1',
            confirmations: tx.confirmations,
          })),
          total: response.data.result.length,
        };
      }
      return { transactions: [], total: 0 };
    } catch (error) {
      return { transactions: [], total: 0, error: error.message };
    }
  }

  async getPendingTransactions(walletAddress: string, chainId: number) {
    return {
      pending: [],
      count: 0,
      oldestPendingAt: null,
    };
  }

  async compareWallets(addresses: string[], chainId: number) {
    const reports = await Promise.all(
      addresses.map(addr => this.getWalletHealth(addr, chainId))
    );

    return {
      wallets: reports.sort((a, b) => b.healthMetrics.overallScore - a.healthMetrics.overallScore),
      comparison: {
        averageScore: reports.reduce((sum, r) => sum + r.healthMetrics.overallScore, 0) / reports.length,
        highestScore: Math.max(...reports.map(r => r.healthMetrics.overallScore)),
        lowestScore: Math.min(...reports.map(r => r.healthMetrics.overallScore)),
      },
    };
  }

  async getHealthTrends(walletAddress: string, chainId: number, days = 30) {
    const trends: { date: string; score: number; pendingTx: number; signersActive: number }[] = [];
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;

    for (let i = days; i >= 0; i--) {
      const date = new Date(now - i * dayMs);
      const baseScore = 70 + Math.random() * 25;
      trends.push({
        date: date.toISOString().split('T')[0],
        score: Math.round(baseScore),
        pendingTx: Math.floor(Math.random() * 3),
        signersActive: Math.floor(Math.random() * 5) + 1,
      });
    }

    return {
      walletAddress,
      chainId,
      trends,
      summary: {
        averageScore: Math.round(trends.reduce((sum, t) => sum + t.score, 0) / trends.length),
        trend: trends[trends.length - 1].score > trends[0].score ? 'improving' : 'declining',
        volatility: Math.round(this.calculateVolatility(trends.map(t => t.score))),
      },
    };
  }

  private async fetchMultisigData(walletAddress: string, chainId: number, chainConfig: any) {
    const mockOwners = [
      walletAddress.slice(0, 42).toLowerCase(),
      '0x' + Math.random().toString(16).slice(2, 42),
      '0x' + Math.random().toString(16).slice(2, 42),
    ];

    return {
      address: walletAddress.toLowerCase(),
      threshold: 2,
      owners: mockOwners,
      nonce: Math.floor(Math.random() * 100),
      transactionCount: Math.floor(Math.random() * 50),
    };
  }

  private async analyzeSignerActivity(owners: string[], chainId: number, chainConfig: any): Promise<SignerActivity[]> {
    return owners.map(owner => ({
      address: owner,
      transactionsSigned: Math.floor(Math.random() * 30) + 1,
      lastSignedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      activityScore: Math.floor(Math.random() * 100),
    }));
  }

  private calculateHealthMetrics(walletData: any, signerActivity: SignerActivity[]): HealthMetrics {
    const avgActivity = signerActivity.reduce((sum, s) => sum + s.activityScore, 0) / signerActivity.length;
    
    let score = 70;
    const ratio = walletData.threshold / walletData.owners.length;
    if (ratio >= 0.5) score += 10;
    else if (ratio >= 0.33) score += 5;
    
    if (avgActivity > 50) score += 10;
    else if (avgActivity > 30) score += 5;
    
    if (walletData.owners.length >= 3) score += 5;
    if (walletData.owners.length >= 5) score += 5;
    
    score = Math.min(100, score);

    return {
      overallScore: score,
      signerActivity,
      pendingTransactions: Math.floor(Math.random() * 3),
      recentConfirmations: Math.floor(Math.random() * 10) + 1,
      lastActivityAt: signerActivity[0]?.lastSignedAt,
      riskFactors: [],
    };
  }

  private identifyRiskFactors(walletData: any, healthMetrics: HealthMetrics, signerActivity: SignerActivity[]): RiskFactor[] {
    const factors: RiskFactor[] = [];
    
    if (walletData.threshold === 1) {
      factors.push({
        type: 'single_point_of_failure',
        severity: 'critical',
        description: 'Wallet uses single signature (1-of-N), creating a single point of failure',
        recommendation: 'Increase threshold to at least 2 to improve security',
      });
    }
    
    const inactiveSigners = signerActivity.filter(s => s.activityScore < 10).length;
    if (inactiveSigners > 0) {
      factors.push({
        type: 'inactive_signers',
        severity: 'medium',
        description: `${inactiveSigners} signer(s) have been inactive`,
        recommendation: 'Contact inactive signers and ensure they can participate in transactions',
      });
    }
    
    if (walletData.owners.length < 3) {
      factors.push({
        type: 'low_diversity',
        severity: 'high',
        description: 'Limited owner diversity increases risk',
        recommendation: 'Consider adding more owners to distribute control',
      });
    }
    
    if (healthMetrics.pendingTransactions > 2) {
      factors.push({
        type: 'stale_transactions',
        severity: 'low',
        description: 'Multiple pending transactions waiting for confirmation',
        recommendation: 'Review and process pending transactions',
      });
    }
    
    return factors;
  }

  private calculateHealthGrade(score: number): 'A+' | 'A' | 'B+' | 'B' | 'C' | 'D' | 'F' {
    if (score >= 95) return 'A+';
    if (score >= 85) return 'A';
    if (score >= 75) return 'B+';
    if (score >= 65) return 'B';
    if (score >= 50) return 'C';
    if (score >= 30) return 'D';
    return 'F';
  }

  private generateRecommendations(riskFactors: RiskFactor[], healthMetrics: HealthMetrics): string[] {
    const recommendations: string[] = [];
    
    riskFactors.forEach(factor => {
      if (!recommendations.includes(factor.recommendation)) {
        recommendations.push(factor.recommendation);
      }
    });
    
    if (healthMetrics.overallScore < 70) {
      recommendations.push('Consider reviewing your multi-sig configuration for potential improvements');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Your multi-sig wallet is in good health');
    }
    
    return recommendations;
  }

  private calculateVolatility(values: number[]): number {
    if (values.length < 2) return 0;
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  getSupportedChains() {
    return Object.entries(this.chainConfigs).map(([id, config]) => ({
      chainId: parseInt(id),
      name: config.name,
    }));
  }
}
