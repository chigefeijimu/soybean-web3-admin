import { Injectable, Logger } from '@nestjs/common';

// Known scam token patterns (simplified list)
const SCAM_TOKEN_PATTERNS = [
  'honeypot',
  'scam',
  'fake',
  'airdrop',
  'free',
  'gift',
  'claim',
  'reward',
  'bonus',
  'presale',
  'ico',
  'yield',
  'farm',
];

// High risk approval targets
const HIGH_RISK_CONTRACTS = [
  '0x0000000000000000000000000000000000000000', // Null address
  '0xe592427a0aece92de3edf1c2d2a44d1c7e8f7e4a', // Uniswap V3
  '0x7a250d5630b4cf539739df2c5dacb4c659f2488d', // Uniswap V2
];

interface ApprovalRisk {
  token: string;
  spender: string;
  allowance: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskReason: string;
}

interface DefiPosition {
  protocol: string;
  type: string;
  tvl: number;
  risk: string;
}

interface TokenHolding {
  symbol: string;
  balance: number;
  value: number;
  isScamRisk: boolean;
}

interface HealthScore {
  overall: number;
  breakdown: {
    approvals: number;
    scamExposure: number;
    defiRisk: number;
    activity: number;
  };
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
}

interface WalletHealth {
  address: string;
  chainId: number;
  timestamp: string;
  healthScore: HealthScore;
  approvalRisks: ApprovalRisk[];
  defiExposure: DefiPosition[];
  tokenHoldings: TokenHolding[];
  recommendations: string[];
}

@Injectable()
export class Web3HealthService {
  private readonly logger = new Logger(Web3HealthService.name);

  // Simulated historical data
  private scoreHistory: Map<string, { date: string; score: number }[]> = new Map();

  async analyzeWalletHealth(address: string, chainId: number): Promise<WalletHealth> {
    this.logger.log(`Analyzing health for ${address} on chain ${chainId}`);

    // Generate mock data for demonstration
    // In production, this would query on-chain data
    
    const approvalRisks = await this.getApprovalRisks(address, chainId);
    const defiExposure = await this.getDefiExposure(address, chainId);
    const tokenHoldings = await this.getTokenHoldings(address, chainId);

    // Calculate health score
    const healthScore = this.calculateHealthScore(approvalRisks, defiExposure, tokenHoldings);

    // Generate recommendations
    const recommendations = this.generateRecommendations(approvalRisks, defiExposure, healthScore);

    // Save to history
    this.updateScoreHistory(address, healthScore.overall);

    return {
      address: address.toLowerCase(),
      chainId,
      timestamp: new Date().toISOString(),
      healthScore,
      approvalRisks,
      defiExposure,
      tokenHoldings,
      recommendations,
    };
  }

  async getApprovalRisks(address: string, chainId: number): Promise<ApprovalRisk[]> {
    // Mock approval data - in production, query Etherscan/API
    const approvals: ApprovalRisk[] = [
      {
        token: 'USDC',
        spender: '0x7a250d5630b4cf539739df2c5dacb4c659f2488d',
        allowance: 'unlimited',
        riskLevel: 'medium',
        riskReason: 'Unlimited approval to DEX',
      },
      {
        token: 'USDT',
        spender: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        allowance: '5000',
        riskLevel: 'low',
        riskReason: 'Limited approval',
      },
      {
        token: 'ETH',
        spender: '0xE592427A0AEce92De3eD1C2D2A44D1c7e8F7e4a',
        allowance: 'unlimited',
        riskLevel: 'high',
        riskReason: 'Unlimited approval to unknown contract',
      },
      {
        token: 'DAI',
        spender: '0x000000000000000000000000000000000000dead',
        allowance: 'unlimited',
        riskLevel: 'critical',
        riskReason: 'Approval to burn address - possible scam',
      },
    ];

    return approvals;
  }

  async getDefiExposure(address: string, chainId: number): Promise<DefiPosition[]> {
    // Mock DeFi positions
    const positions: DefiPosition[] = [
      {
        protocol: 'Uniswap V3',
        type: 'Liquidity Pool',
        tvl: 2500,
        risk: 'medium',
      },
      {
        protocol: 'Aave',
        type: 'Lending',
        tvl: 5000,
        risk: 'low',
      },
      {
        protocol: 'Compound',
        type: 'Yield Farming',
        tvl: 1200,
        risk: 'medium',
      },
    ];

    return positions;
  }

  async getTokenHoldings(address: string, chainId: number): Promise<TokenHolding[]> {
    // Mock token holdings with scam detection
    const holdings: TokenHolding[] = [
      { symbol: 'ETH', balance: 2.5, value: 6250, isScamRisk: false },
      { symbol: 'USDC', balance: 5000, value: 5000, isScamRisk: false },
      { symbol: 'USDT', balance: 2000, value: 2000, isScamRisk: false },
      { symbol: 'UNI', balance: 100, value: 450, isScamRisk: false },
      { symbol: 'SCAMTOKEN', balance: 1000000, value: 10, isScamRisk: true },
    ];

    return holdings;
  }

  private calculateHealthScore(
    approvals: ApprovalRisk[],
    defi: DefiPosition[],
    holdings: TokenHolding[],
  ): HealthScore {
    // Approval score (40% weight)
    const criticalApprovals = approvals.filter(a => a.riskLevel === 'critical').length;
    const highApprovals = approvals.filter(a => a.riskLevel === 'high').length;
    const mediumApprovals = approvals.filter(a => a.riskLevel === 'medium').length;
    
    let approvalScore = 100;
    approvalScore -= criticalApprovals * 30;
    approvalScore -= highApprovals * 15;
    approvalScore -= mediumApprovals * 5;
    approvalScore = Math.max(0, approvalScore);

    // Scam exposure score (30% weight)
    const scamTokens = holdings.filter(h => h.isScamRisk).length;
    let scamScore = 100 - (scamTokens * 25);
    scamScore = Math.max(0, scamScore);

    // DeFi risk score (20% weight)
    const highRiskDefi = defi.filter(d => d.risk === 'high').length;
    const mediumRiskDefi = defi.filter(d => d.risk === 'medium').length;
    let defiScore = 100 - (highRiskDefi * 20) - (mediumRiskDefi * 10);
    defiScore = Math.max(0, defiScore);

    // Activity score (10% weight) - based on number of interactions
    const totalValue = holdings.reduce((sum, h) => sum + h.value, 0);
    let activityScore = Math.min(100, totalValue / 100);

    // Calculate overall
    const overall = Math.round(
      approvalScore * 0.4 +
      scamScore * 0.3 +
      defiScore * 0.2 +
      activityScore * 0.1
    );

    // Determine grade
    let grade: 'A' | 'B' | 'C' | 'D' | 'F';
    if (overall >= 90) grade = 'A';
    else if (overall >= 80) grade = 'B';
    else if (overall >= 70) grade = 'C';
    else if (overall >= 60) grade = 'D';
    else grade = 'F';

    return {
      overall,
      breakdown: {
        approvals: approvalScore,
        scamExposure: scamScore,
        defiRisk: defiScore,
        activity: Math.round(activityScore),
      },
      grade,
    };
  }

  private generateRecommendations(
    approvals: ApprovalRisk[],
    defi: DefiPosition[],
    score: HealthScore,
  ): string[] {
    const recommendations: string[] = [];

    // Approval recommendations
    const criticalApprovals = approvals.filter(a => a.riskLevel === 'critical');
    if (criticalApprovals.length > 0) {
      recommendations.push(`⚠️ Revoke ${criticalApprovals.length} critical-level token approval(s) immediately`);
    }

    const highApprovals = approvals.filter(a => a.riskLevel === 'high');
    if (highApprovals.length > 0) {
      recommendations.push(`🔐 Consider revoking ${highApprovals.length} high-risk approval(s) after use`);
    }

    // Scam token recommendations
    if (score.breakdown.scamExposure < 70) {
      recommendations.push('🛡️ You hold tokens with potential scam risk - review and consider removing');
    }

    // DeFi recommendations
    const highRiskDefi = defi.filter(d => d.risk === 'high');
    if (highRiskDefi.length > 0) {
      recommendations.push(`🌊 Review ${highRiskDefi.length} high-risk DeFi position(s)`);
    }

    // General recommendations
    if (score.overall >= 90) {
      recommendations.push('✅ Your wallet health is excellent! Keep up the good practices.');
    } else if (score.overall >= 70) {
      recommendations.push('💡 Consider reviewing the warnings above to improve your security.');
    } else {
      recommendations.push('🚨 Your wallet has significant risks. Take immediate action on warnings above.');
    }

    return recommendations;
  }

  private updateScoreHistory(address: string, score: number): void {
    const key = address.toLowerCase();
    if (!this.scoreHistory.has(key)) {
      this.scoreHistory.set(key, []);
    }
    
    const history = this.scoreHistory.get(key)!;
    const today = new Date().toISOString().split('T')[0];
    
    // Only add one entry per day
    if (history.length === 0 || history[history.length - 1].date !== today) {
      history.push({ date: today, score });
      // Keep only last 30 days
      if (history.length > 30) {
        history.shift();
      }
    }
  }

  async getScoreHistory(address: string): Promise<{ date: string; score: number }[]> {
    const key = address.toLowerCase();
    return this.scoreHistory.get(key) || [];
  }
}
