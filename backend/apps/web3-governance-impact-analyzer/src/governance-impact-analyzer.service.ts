import { Injectable } from '@nestjs/common';

interface ImpactScore {
  overall: number;
  bullish: number;
  neutral: number;
  bearish: number;
  confidence: number;
}

interface RiskAssessment {
  level: 'low' | 'medium' | 'high' | 'critical';
  factors: string[];
  score: number;
}

interface MarketPrediction {
  passProbability: number;
  failProbability: number;
  priceImpact: {
    shortTerm: { direction: string; percentage: number };
    mediumTerm: { direction: string; percentage: number };
    longTerm: { direction: string; percentage: number };
  };
  affectedTokens: Array<{
    token: string;
    impact: string;
    confidence: number;
  }>;
}

interface ProposalImpact {
  dao: string;
  proposalId: string;
  title: string;
  description: string;
  status: string;
  impactScore: ImpactScore;
  riskAssessment: RiskAssessment;
  marketPrediction: MarketPrediction;
  sentiment: {
    overall: string;
    community: number;
    whale: number;
  };
  affectedProtocols: string[];
  recommendation: string;
  createdAt: string;
}

const SUPPORTED_DAOS = [
  { name: 'Uniswap', chain: 'Ethereum', category: 'DEX' },
  { name: 'Aave', chain: 'Ethereum', category: 'Lending' },
  { name: 'MakerDAO', chain: 'Ethereum', category: 'Stablecoin' },
  { name: 'Compound', chain: 'Ethereum', category: 'Lending' },
  { name: 'Curve', chain: 'Ethereum', category: 'DEX' },
  { name: 'Lido', chain: 'Ethereum', category: 'Staking' },
  { name: 'ENS', chain: 'Ethereum', category: 'Infrastructure' },
  { name: 'Balancer', chain: 'Ethereum', category: 'DEX' },
  { name: 'Optimism', chain: 'Optimism', category: 'Layer2' },
  { name: 'Arbitrum', chain: 'Arbitrum', category: 'Layer2' },
  { name: 'Polygon', chain: 'Polygon', category: 'Layer2' },
  { name: 'GMX', chain: 'Arbitrum', category: 'DEX' },
  { name: 'Rocket Pool', chain: 'Ethereum', category: 'Staking' },
  { name: 'Synthetix', chain: 'Ethereum', category: 'Derivatives' },
  { name: 'Connext', chain: 'Ethereum', category: 'Bridge' },
];

@Injectable()
export class GovernanceImpactAnalyzerService {
  private proposals: Map<string, ProposalImpact> = new Map();

  constructor() {
    this.initializeSampleData();
  }

  private initializeSampleData() {
    const sampleProposals: ProposalImpact[] = [
      {
        dao: 'Uniswap',
        proposalId: '1',
        title: 'Deploy Uniswap V4 on Arbitrum',
        description: 'Proposal to deploy Uniswap V4 on Arbitrum network with new hook mechanisms',
        status: 'active',
        impactScore: { overall: 75, bullish: 70, neutral: 20, bearish: 10, confidence: 85 },
        riskAssessment: { level: 'medium', factors: ['Technical risk', 'Liquidity migration'], score: 45 },
        marketPrediction: {
          passProbability: 75,
          failProbability: 25,
          priceImpact: {
            shortTerm: { direction: 'bullish', percentage: 3.5 },
            mediumTerm: { direction: 'bullish', percentage: 8.2 },
            longTerm: { direction: 'bullish', percentage: 12.5 },
          },
          affectedTokens: [
            { token: 'UNI', impact: 'positive', confidence: 90 },
            { token: 'ARB', impact: 'positive', confidence: 75 },
          ],
        },
        sentiment: { overall: 'bullish', community: 72, whale: 80 },
        affectedProtocols: ['Uniswap', 'SushiSwap', 'Curve'],
        recommendation: 'Consider increasing UNI exposure before proposal passes',
        createdAt: new Date().toISOString(),
      },
      {
        dao: 'Aave',
        proposalId: '2',
        title: 'Add ETH Liquid Staking Tokens as Collateral',
        description: 'Proposal to add rETH and stETH as collateral types on Aave V3',
        status: 'pending',
        impactScore: { overall: 82, bullish: 78, neutral: 15, bearish: 7, confidence: 92 },
        riskAssessment: { level: 'low', factors: ['Smart contract risk', 'Liquidation risk'], score: 28 },
        marketPrediction: {
          passProbability: 85,
          failProbability: 15,
          priceImpact: {
            shortTerm: { direction: 'bullish', percentage: 2.1 },
            mediumTerm: { direction: 'bullish', percentage: 5.8 },
            longTerm: { direction: 'bullish', percentage: 9.3 },
          },
          affectedTokens: [
            { token: 'AAVE', impact: 'positive', confidence: 88 },
            { token: 'rETH', impact: 'positive', confidence: 82 },
            { token: 'stETH', impact: 'positive', confidence: 80 },
          ],
        },
        sentiment: { overall: 'bullish', community: 78, whale: 85 },
        affectedProtocols: ['Aave', 'Lido', 'Rocket Pool'],
        recommendation: 'Positive for LST adoption - consider accumulation strategy',
        createdAt: new Date().toISOString(),
      },
      {
        dao: 'MakerDAO',
        proposalId: '3',
        title: 'Adjust DSR to 4.5%',
        description: 'Proposal to increase the DAI Savings Rate to 4.5% from current 3.5%',
        status: 'active',
        impactScore: { overall: 68, bullish: 45, neutral: 35, bearish: 20, confidence: 78 },
        riskAssessment: { level: 'medium', factors: ['Interest rate risk', 'Liquidity risk'], score: 52 },
        marketPrediction: {
          passProbability: 60,
          failProbability: 40,
          priceImpact: {
            shortTerm: { direction: 'neutral', percentage: 0.8 },
            mediumTerm: { direction: 'bullish', percentage: 2.5 },
            longTerm: { direction: 'neutral', percentage: 1.2 },
          },
          affectedTokens: [
            { token: 'MKR', impact: 'positive', confidence: 70 },
            { token: 'DAI', impact: 'neutral', confidence: 85 },
          ],
        },
        sentiment: { overall: 'neutral', community: 55, whale: 60 },
        affectedProtocols: ['MakerDAO', 'Aave', 'Compound'],
        recommendation: 'Monitor proposal outcome - minimal DAI impact expected',
        createdAt: new Date().toISOString(),
      },
      {
        dao: 'Curve',
        proposalId: '4',
        title: 'CRV Token Buyback Program',
        description: 'Implement weekly CRV buyback program using protocol revenues',
        status: 'passed',
        impactScore: { overall: 88, bullish: 85, neutral: 10, bearish: 5, confidence: 95 },
        riskAssessment: { level: 'low', factors: ['Execution risk'], score: 18 },
        marketPrediction: {
          passProbability: 95,
          failProbability: 5,
          priceImpact: {
            shortTerm: { direction: 'bullish', percentage: 5.2 },
            mediumTerm: { direction: 'bullish', percentage: 12.8 },
            longTerm: { direction: 'bullish', percentage: 18.5 },
          },
          affectedTokens: [
            { token: 'CRV', impact: 'positive', confidence: 95 },
            { token: 'cvxCRV', impact: 'positive', confidence: 88 },
          ],
        },
        sentiment: { overall: 'bullish', community: 88, whale: 92 },
        affectedProtocols: ['Curve', 'Convex'],
        recommendation: 'Bullish for CRV - maintain exposure',
        createdAt: new Date().toISOString(),
      },
      {
        dao: 'Lido',
        proposalId: '5',
        title: 'LDO Staking Rewards Distribution',
        description: 'Launch LDO staking rewards distribution program for early participants',
        status: 'active',
        impactScore: { overall: 72, bullish: 68, neutral: 22, bearish: 10, confidence: 80 },
        riskAssessment: { level: 'low', factors: ['Inflation risk'], score: 25 },
        marketPrediction: {
          passProbability: 70,
          failProbability: 30,
          priceImpact: {
            shortTerm: { direction: 'bullish', percentage: 2.8 },
            mediumTerm: { direction: 'bullish', percentage: 6.5 },
            longTerm: { direction: 'bullish', percentage: 10.2 },
          },
          affectedTokens: [
            { token: 'LDO', impact: 'positive', confidence: 85 },
            { token: 'stETH', impact: 'positive', confidence: 72 },
          ],
        },
        sentiment: { overall: 'bullish', community: 75, whale: 78 },
        affectedProtocols: ['Lido', 'Rocket Pool'],
        recommendation: 'Positive for LDO ecosystem growth',
        createdAt: new Date().toISOString(),
      },
    ];

    sampleProposals.forEach(p => {
      this.proposals.set(`${p.dao.toLowerCase()}-${p.proposalId}`, p);
    });
  }

  async analyzeProposal(
    dao: string,
    proposalId: string,
    title?: string,
    description?: string,
  ): Promise<ProposalImpact> {
    const existing = this.proposals.get(`${dao.toLowerCase()}-${proposalId}`);
    if (existing) return existing;

    const impactScore = this.calculateImpactScore(dao, title || '', description || '');
    const riskAssessment = this.assessRisk(dao, title || '', description || '');
    const marketPrediction = this.predictMarket(dao, title || '', description || '');
    
    const proposal: ProposalImpact = {
      dao,
      proposalId,
      title: title || `Proposal ${proposalId}`,
      description: description || 'Impact analysis pending',
      status: 'analyzed',
      impactScore,
      riskAssessment,
      marketPrediction,
      sentiment: {
        overall: impactScore.bullish > impactScore.bearish ? 'bullish' : 'bearish',
        community: Math.floor(50 + Math.random() * 40),
        whale: Math.floor(50 + Math.random() * 40),
      },
      affectedProtocols: this.identifyAffectedProtocols(dao),
      recommendation: this.generateRecommendation(impactScore, riskAssessment),
      createdAt: new Date().toISOString(),
    };

    this.proposals.set(`${dao.toLowerCase()}-${proposalId}`, proposal);
    return proposal;
  }

  async getProposalImpact(dao: string, proposalId: string): Promise<ProposalImpact | null> {
    return this.proposals.get(`${dao.toLowerCase()}-${proposalId}`) || null;
  }

  async getDaoImpactSummary(chainId?: string, dao?: string) {
    const allProposals = Array.from(this.proposals.values());
    const filtered = dao 
      ? allProposals.filter(p => p.dao.toLowerCase() === dao.toLowerCase())
      : allProposals;

    const summary = {
      totalProposals: filtered.length,
      activeProposals: filtered.filter(p => p.status === 'active').length,
      passedProposals: filtered.filter(p => p.status === 'passed').length,
      pendingProposals: filtered.filter(p => p.status === 'pending').length,
      averageImpactScore: filtered.length > 0
        ? Math.round(filtered.reduce((sum, p) => sum + p.impactScore.overall, 0) / filtered.length)
        : 0,
      bullishCount: filtered.filter(p => p.impactScore.overall > 60).length,
      bearishCount: filtered.filter(p => p.impactScore.overall < 40).length,
      highRiskProposals: filtered.filter(p => p.riskAssessment.level === 'high' || p.riskAssessment.level === 'critical').length,
      proposals: filtered.slice(0, 20),
    };

    return summary;
  }

  async getTrendingProposals(limit: number = 10) {
    const allProposals = Array.from(this.proposals.values());
    return allProposals
      .sort((a, b) => b.impactScore.confidence - a.impactScore.confidence)
      .slice(0, limit);
  }

  async getRiskAssessment(dao: string, proposalId: string): Promise<RiskAssessment | null> {
    const proposal = this.proposals.get(`${dao.toLowerCase()}-${proposalId}`);
    return proposal?.riskAssessment || null;
  }

  async getMarketPrediction(dao: string, proposalId: string): Promise<MarketPrediction | null> {
    const proposal = this.proposals.get(`${dao.toLowerCase()}-${proposalId}`);
    return proposal?.marketPrediction || null;
  }

  async getSupportedDaos() {
    return SUPPORTED_DAOS;
  }

  private calculateImpactScore(dao: string, title: string, description: string): ImpactScore {
    const text = `${dao} ${title} ${description}`.toLowerCase();
    let bullish = 30 + Math.random() * 40;
    let bearish = Math.random() * 30;
    let neutral = 100 - bullish - bearish;
    
    if (text.includes('upgrade') || text.includes('deploy')) bullish += 10;
    if (text.includes('risk') || text.includes('adjust')) bearish += 15;
    if (text.includes('reward') || text.includes('incentive')) bullish += 15;
    if (text.includes('fee') || text.includes('treasury')) neutral += 10;
    
    bullish = Math.min(bullish, 90);
    bearish = Math.min(bearish, 40);
    neutral = Math.max(neutral, 5);
    
    const total = bullish + bearish + neutral;
    bullish = (bullish / total) * 100;
    bearish = (bearish / total) * 100;
    neutral = (neutral / total) * 100;
    
    const overall = Math.round(bullish - bearish * 0.5 + 50);
    const confidence = 70 + Math.floor(Math.random() * 25);
    
    return {
      overall: Math.min(100, Math.max(0, overall)),
      bullish: Math.round(bullish),
      neutral: Math.round(neutral),
      bearish: Math.round(bearish),
      confidence,
    };
  }

  private assessRisk(dao: string, title: string, description: string): RiskAssessment {
    const text = `${dao} ${title} ${description}`.toLowerCase();
    const factors: string[] = [];
    let score = 20;
    
    if (text.includes('technical') || text.includes('upgrade')) {
      factors.push('Technical complexity');
      score += 20;
    }
    if (text.includes('collateral') || text.includes('asset')) {
      factors.push('Asset risk');
      score += 15;
    }
    if (text.includes('governance') || text.includes('vote')) {
      factors.push('Governance uncertainty');
      score += 10;
    }
    if (text.includes('smart contract')) {
      factors.push('Smart contract risk');
      score += 25;
    }
    if (text.includes('liquidity')) {
      factors.push('Liquidity risk');
      score += 15;
    }
    if (factors.length === 0) {
      factors.push('General market risk');
    }
    
    score = Math.min(score, 100);
    let level: 'low' | 'medium' | 'high' | 'critical';
    if (score < 25) level = 'low';
    else if (score < 50) level = 'medium';
    else if (score < 75) level = 'high';
    else level = 'critical';
    
    return { level, factors, score };
  }

  private predictMarket(dao: string, title: string, description: string): MarketPrediction {
    const text = `${dao} ${title} ${description}`.toLowerCase();
    let passProb = 50 + Math.random() * 40;
    const failProb = 100 - passProb;
    
    const shortTerm = (Math.random() * 8 - 2);
    const mediumTerm = shortTerm * 1.8;
    const longTerm = shortTerm * 2.5;
    
    const affectedTokens: Array<{ token: string; impact: string; confidence: number }> = [];
    
    const tokenMap: Record<string, string[]> = {
      'Uniswap': ['UNI', 'USDC', 'ETH'],
      'Aave': ['AAVE', 'USDC', 'ETH'],
      'MakerDAO': ['MKR', 'DAI', 'ETH'],
      'Compound': ['COMP', 'USDC', 'ETH'],
      'Curve': ['CRV', 'USDC', 'ETH'],
      'Lido': ['LDO', 'stETH', 'ETH'],
    };
    
    const tokens = tokenMap[dao] || ['TOKEN'];
    tokens.forEach(t => {
      affectedTokens.push({
        token: t,
        impact: Math.random() > 0.3 ? 'positive' : 'neutral',
        confidence: 70 + Math.floor(Math.random() * 25),
      });
    });
    
    return {
      passProbability: Math.round(passProb),
      failProbability: Math.round(failProb),
      priceImpact: {
        shortTerm: { direction: shortTerm > 0 ? 'bullish' : 'bearish', percentage: Math.abs(Math.round(shortTerm * 10) / 10) },
        mediumTerm: { direction: mediumTerm > 0 ? 'bullish' : 'bearish', percentage: Math.abs(Math.round(mediumTerm * 10) / 10) },
        longTerm: { direction: longTerm > 0 ? 'bullish' : 'bearish', percentage: Math.abs(Math.round(longTerm * 10) / 10) },
      },
      affectedTokens,
    };
  }

  private identifyAffectedProtocols(dao: string): string[] {
    const protocolMap: Record<string, string[]> = {
      'Uniswap': ['Uniswap', 'SushiSwap', 'Curve', 'Balancer'],
      'Aave': ['Aave', 'Compound', 'Liquity'],
      'MakerDAO': ['MakerDAO', 'Aave', 'Spark'],
      'Curve': ['Curve', 'Convex', 'Yearn'],
      'Lido': ['Lido', 'Rocket Pool', 'Stakewise'],
    };
    return protocolMap[dao] || [dao];
  }

  private generateRecommendation(impactScore: ImpactScore, riskAssessment: RiskAssessment): string {
    if (impactScore.overall > 70 && riskAssessment.level === 'low') {
      return 'Strong bullish signal - favorable risk/reward opportunity';
    } else if (impactScore.overall > 60 && riskAssessment.level === 'medium') {
      return 'Moderate bullish signal - consider position with risk management';
    } else if (impactScore.overall < 40) {
      return 'Bearish signal - caution advised';
    } else if (riskAssessment.level === 'high' || riskAssessment.level === 'critical') {
      return 'High risk - await more clarity before action';
    }
    return 'Neutral - monitor for developments';
  }
}
