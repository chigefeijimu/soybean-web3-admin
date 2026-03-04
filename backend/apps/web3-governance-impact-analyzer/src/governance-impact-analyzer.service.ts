import { Injectable } from '@nestjs/common';

interface ProposalImpact {
  proposalId: string;
  daoId: string;
  daoName: string;
  title: string;
  description: string;
  status: string;
  type: string;
  impactScore: number;
  impactLevel: 'bullish' | 'neutral' | 'bearish';
  priceImpact: {
    shortTerm: { min: number; max: number; confidence: number };
    mediumTerm: { min: number; max: number; confidence: number };
    longTerm: { min: number; max: number; confidence: number };
  };
  factors: ImpactFactor[];
  riskAssessment: RiskAssessment;
  portfolioImplications: PortfolioImplication[];
  comparableProposals: ComparableProposal[];
  sentiment: SentimentAnalysis;
  marketReaction: MarketReaction;
}

interface ImpactFactor {
  factor: string;
  impact: 'positive' | 'negative' | 'neutral';
  weight: number;
  description: string;
}

interface RiskAssessment {
  overall: number;
  level: 'low' | 'medium' | 'high' | 'critical';
  factors: { category: string; score: number; description: string }[];
}

interface PortfolioImplication {
  position: string;
  action: 'increase' | 'decrease' | 'hold' | 'monitor';
  reasoning: string;
  confidence: number;
}

interface ComparableProposal {
  id: string;
  daoName: string;
  title: string;
  outcome: 'passed' | 'failed';
  priceChange7d: number;
  similarity: number;
}

interface SentimentAnalysis {
  overall: number;
  social: number;
  onchain: number;
  market: number;
  trend: 'improving' | 'stable' | 'declining';
}

interface MarketReaction {
  historicalSimilar: number;
  whaleActivity: 'accumulating' | 'distributing' | 'neutral';
  fundingRate: number;
  openInterest: number;
}

interface AggregatedStats {
  totalAnalyzed: number;
  avgImpactScore: number;
  bullishCount: number;
  bearishCount: number;
  neutralCount: number;
  highRiskCount: number;
  upcomingVotes: ProposalImpact[];
  recentlyPassed: ProposalImpact[];
  marketSentiment: number;
}

@Injectable()
export class GovernanceImpactAnalyzerService {
  private proposals: any[] = [
    {
      id: 'uni-156',
      daoId: 'uniswap',
      daoName: 'Uniswap',
      title: 'Deploy Uniswap V4 on Arbitrum and Optimism',
      description: 'Proposal to deploy the latest version of Uniswap protocol on Layer 2 networks to reduce gas costs and improve throughput.',
      status: 'active',
      type: 'upgrade',
      forVotes: 4500000,
      againstVotes: 1200000,
      totalVotes: 6000000,
      quorum: 4000000,
      startTime: '2026-02-28T00:00:00Z',
      endTime: '2026-03-05T00:00:00Z',
    },
    {
      id: 'aave-90',
      daoId: 'aave',
      daoName: 'Aave',
      title: 'Add wstETH as Collateral on V3',
      description: 'Enable wrapped stETH as collateral on Aave V3 Ethereum pool.',
      status: 'active',
      type: 'parameter',
      forVotes: 125000,
      againstVotes: 15000,
      totalVotes: 145000,
      quorum: 80000,
      startTime: '2026-03-01T00:00:00Z',
      endTime: '2026-03-04T00:00:00Z',
    },
    {
      id: 'mkr-235',
      daoId: 'makerdao',
      daoName: 'MakerDAO',
      title: 'Adjust DSR to 4.5%',
      description: 'Proposal to increase the Dai Savings Rate to 4.5% to improve DAI adoption.',
      status: 'active',
      type: 'parameter',
      forVotes: 45000,
      againstVotes: 18000,
      totalVotes: 70000,
      quorum: 30000,
      startTime: '2026-03-01T12:00:00Z',
      endTime: '2026-03-08T12:00:00Z',
    },
    {
      id: 'op-46',
      daoId: 'optimism',
      daoName: 'Optimism',
      title: 'Retroactive Public Goods Funding Round 19',
      description: 'Allocate 30M OP tokens to Retroactive Public Goods Funding.',
      status: 'active',
      type: 'treasury',
      forVotes: 28000000,
      againstVotes: 5000000,
      totalVotes: 35000000,
      quorum: 20000000,
      startTime: '2026-02-26T00:00:00Z',
      endTime: '2026-03-05T00:00:00Z',
    },
    {
      id: 'arb-39',
      daoId: 'arbitrum',
      daoName: 'Arbitrum',
      title: 'Security Council Renewal - March 2026',
      description: 'Renew the Security Council members for the next term.',
      status: 'active',
      type: 'parameter',
      forVotes: 150000000,
      againstVotes: 25000000,
      totalVotes: 190000000,
      quorum: 100000000,
      startTime: '2026-02-28T00:00:00Z',
      endTime: '2026-03-07T00:00:00Z',
    },
    {
      id: 'lido-35',
      daoId: 'lido',
      daoName: 'Lido',
      title: 'Enable wstETH/ETH Gauge on Curve',
      description: 'Enable the wstETH/ETH pool on Curve Finance with 2% cap.',
      status: 'active',
      type: 'parameter',
      forVotes: 8500000,
      againstVotes: 1200000,
      totalVotes: 10000000,
      quorum: 5000000,
      startTime: '2026-03-01T00:00:00Z',
      endTime: '2026-03-04T00:00:00Z',
    },
    {
      id: 'ens-29',
      daoId: 'ens',
      daoName: 'ENS DAO',
      title: 'Extend Registrar Grace Period',
      description: 'Extend the grace period for expired domain names from 90 to 180 days.',
      status: 'active',
      type: 'parameter',
      forVotes: 185000,
      againstVotes: 42000,
      totalVotes: 240000,
      quorum: 100000,
      startTime: '2026-02-27T00:00:00Z',
      endTime: '2026-03-06T00:00:00Z',
    },
    // Recently passed proposals
    {
      id: 'uni-155',
      daoId: 'uniswap',
      daoName: 'Uniswap',
      title: 'Allocate Treasury for Developer Grants',
      description: 'Request 5M UNI tokens from treasury to fund developer grants program.',
      status: 'passed',
      type: 'treasury',
      forVotes: 8500000,
      againstVotes: 2100000,
      totalVotes: 11000000,
      quorum: 4000000,
      startTime: '2026-02-15T00:00:00Z',
      endTime: '2026-02-22T00:00:00Z',
    },
    {
      id: 'aave-89',
      daoId: 'aave',
      daoName: 'Aave',
      title: 'Adjust USDC Risk Parameters',
      description: 'Increase USDC liquidation threshold from 87% to 89%.',
      status: 'passed',
      type: 'parameter',
      forVotes: 95000,
      againstVotes: 12000,
      totalVotes: 110000,
      quorum: 80000,
      startTime: '2026-02-20T00:00:00Z',
      endTime: '2026-02-25T00:00:00Z',
    },
    {
      id: 'op-45',
      daoId: 'optimism',
      daoName: 'Optimism',
      title: 'Upgrade Gas Price Oracle',
      description: 'Update the L1 gas price oracle to use a more efficient pricing mechanism.',
      status: 'passed',
      type: 'upgrade',
      forVotes: 45000000,
      againstVotes: 8000000,
      totalVotes: 60000000,
      quorum: 20000000,
      startTime: '2026-02-10T00:00:00Z',
      endTime: '2026-02-17T00:00:00Z',
    },
  ];

  private generateImpactAnalysis(proposal: any): ProposalImpact {
    const forPercentage = (proposal.forVotes / proposal.totalVotes) * 100;
    const againstPercentage = (proposal.againstVotes / proposal.totalVotes) * 100;
    const passProbability = forPercentage / (forPercentage + againstPercentage + 1);
    
    // Calculate base impact score based on proposal type
    const typeImpact: { [key: string]: number } = {
      upgrade: 15,
      parameter: 10,
      treasury: 20,
      text: 5,
      emergency: 25,
    };
    
    const baseImpact = typeImpact[proposal.type] || 10;
    const passBonus = passProbability > 0.6 ? 10 : 0;
    const quorumMet = proposal.totalVotes >= proposal.quorum ? 5 : -10;
    
    const impactScore = Math.min(100, Math.max(0, baseImpact + passBonus + quorumMet + (Math.random() * 20 - 10)));
    
    let impactLevel: 'bullish' | 'neutral' | 'bearish';
    if (impactScore >= 60) impactLevel = 'bullish';
    else if (impactScore <= 40) impactLevel = 'bearish';
    else impactLevel = 'neutral';
    
    // Generate price impact estimates
    const priceImpact = {
      shortTerm: {
        min: Math.round((impactScore - 50) * 0.3 * 10) / 10,
        max: Math.round((impactScore - 50) * 0.5 * 10) / 10,
        confidence: Math.round(70 + Math.random() * 20),
      },
      mediumTerm: {
        min: Math.round((impactScore - 50) * 0.5 * 10) / 10,
        max: Math.round((impactScore - 50) * 0.8 * 10) / 10,
        confidence: Math.round(60 + Math.random() * 20),
      },
      longTerm: {
        min: Math.round((impactScore - 50) * 0.8 * 10) / 10,
        max: Math.round((impactScore - 50) * 1.2 * 10) / 10,
        confidence: Math.round(50 + Math.random() * 20),
      },
    };
    
    // Generate impact factors
    const factors: ImpactFactor[] = [
      {
        factor: 'Pass Probability',
        impact: passProbability > 0.6 ? 'positive' : passProbability < 0.4 ? 'negative' : 'neutral',
        weight: 0.25,
        description: `Based on current voting, probability of passing is ${(passProbability * 100).toFixed(1)}%`,
      },
      {
        factor: 'Quorum Participation',
        impact: proposal.totalVotes >= proposal.quorum ? 'positive' : 'negative',
        weight: 0.2,
        description: `${((proposal.totalVotes / proposal.quorum) * 100).toFixed(1)}% of required quorum reached`,
      },
      {
        factor: 'Proposal Type',
        impact: proposal.type === 'treasury' ? 'positive' : proposal.type === 'upgrade' ? 'positive' : 'neutral',
        weight: 0.15,
        description: `${proposal.type} proposals typically have ${proposal.type === 'treasury' ? 'high' : 'moderate'} market impact`,
      },
      {
        factor: 'Community Sentiment',
        impact: Math.random() > 0.5 ? 'positive' : 'neutral',
        weight: 0.2,
        description: 'Social media sentiment is currently ' + (Math.random() > 0.5 ? 'positive' : 'mixed'),
      },
      {
        factor: 'Whale Activity',
        impact: Math.random() > 0.6 ? 'positive' : Math.random() > 0.3 ? 'neutral' : 'negative',
        weight: 0.2,
        description: 'Large token holders showing ' + (Math.random() > 0.5 ? 'accumulation' : 'neutral') + ' patterns',
      },
    ];
    
    // Risk assessment
    const riskFactors = [
      { category: 'Execution Risk', score: Math.round(20 + Math.random() * 30), description: 'Technical implementation complexity' },
      { category: 'Market Risk', score: Math.round(15 + Math.random() * 35), description: 'Potential market volatility around vote' },
      { category: 'Regulatory Risk', score: Math.round(10 + Math.random() * 25), description: 'Regulatory uncertainty in jurisdiction' },
      { category: 'Social Risk', score: Math.round(15 + Math.random() * 30), description: 'Community disagreement potential' },
    ];
    const overallRisk = riskFactors.reduce((sum, f) => sum + f.score, 0) / riskFactors.length;
    
    const riskAssessment: RiskAssessment = {
      overall: Math.round(overallRisk),
      level: overallRisk < 25 ? 'low' : overallRisk < 45 ? 'medium' : overallRisk < 65 ? 'high' : 'critical',
      factors: riskFactors,
    };
    
    // Portfolio implications
    const portfolioImplications: PortfolioImplication[] = [
      {
        position: proposal.daoName + ' Token',
        action: impactScore > 60 ? 'increase' : impactScore < 40 ? 'decrease' : 'hold',
        reasoning: impactScore > 60 
          ? 'High impact score suggests positive outcome likely' 
          : impactScore < 40 
            ? 'Lower impact score and passing probability'
            : 'Wait for clearer voting trends',
        confidence: Math.round(60 + Math.random() * 30),
      },
      {
        position: 'Related DeFi Tokens',
        action: impactScore > 55 ? 'increase' : 'monitor',
        reasoning: 'Cross-protocol synergies may drive adjacent token movements',
        confidence: Math.round(50 + Math.random() * 25),
      },
      {
        position: 'Stablecoin Allocation',
        action: riskAssessment.level === 'high' ? 'increase' : 'hold',
        reasoning: riskAssessment.level === 'high' 
          ? 'Increase hedging given elevated risk levels' 
          : 'Maintain current allocation',
        confidence: Math.round(70 + Math.random() * 20),
      },
    ];
    
    // Comparable proposals
    const comparableProposals: ComparableProposal[] = [
      {
        id: 'uni-154',
        daoName: 'Uniswap',
        title: 'Update Protocol Fee from 0.05% to 0.08%',
        outcome: 'failed',
        priceChange7d: -2.5,
        similarity: 0.75,
      },
      {
        id: 'uni-153',
        daoName: 'Uniswap',
        title: 'Add New Fee Tier',
        outcome: 'passed',
        priceChange7d: 5.2,
        similarity: 0.65,
      },
      {
        id: 'aave-85',
        daoName: 'Aave',
        title: 'Add CRV Collateral',
        outcome: 'passed',
        priceChange7d: 8.3,
        similarity: 0.7,
      },
    ];
    
    // Sentiment analysis
    const sentiment: SentimentAnalysis = {
      overall: Math.round(50 + Math.random() * 40),
      social: Math.round(50 + Math.random() * 40),
      onchain: Math.round(50 + Math.random() * 40),
      market: Math.round(50 + Math.random() * 40),
      trend: Math.random() > 0.6 ? 'improving' : Math.random() > 0.3 ? 'stable' : 'declining',
    };
    
    // Market reaction
    const marketReaction: MarketReaction = {
      historicalSimilar: Math.round(60 + Math.random() * 30),
      whaleActivity: Math.random() > 0.5 ? 'accumulating' : Math.random() > 0.3 ? 'neutral' : 'distributing',
      fundingRate: Math.round((Math.random() * 0.1 - 0.02) * 10000) / 10000,
      openInterest: Math.round(Math.random() * 100000000),
    };
    
    return {
      proposalId: proposal.id,
      daoId: proposal.daoId,
      daoName: proposal.daoName,
      title: proposal.title,
      description: proposal.description,
      status: proposal.status,
      type: proposal.type,
      impactScore: Math.round(impactScore),
      impactLevel,
      priceImpact,
      factors,
      riskAssessment,
      portfolioImplications,
      comparableProposals,
      sentiment,
      marketReaction,
    };
  }

  getProposalImpacts(dao?: string, status?: string, limit: number = 20): ProposalImpact[] {
    let filtered = this.proposals;
    
    if (dao) {
      filtered = filtered.filter(p => p.daoId === dao);
    }
    
    if (status) {
      filtered = filtered.filter(p => p.status === status);
    }
    
    return filtered.map(p => this.generateImpactAnalysis(p)).slice(0, limit);
  }

  getProposalImpactDetails(id: string): ProposalImpact | null {
    const proposal = this.proposals.find(p => p.id === id);
    if (!proposal) return null;
    
    return this.generateImpactAnalysis(proposal);
  }

  getAggregatedStats(): AggregatedStats {
    const impacts = this.proposals.map(p => this.generateImpactAnalysis(p));
    
    const activeImpacts = impacts.filter(i => i.status === 'active');
    const passedImpacts = impacts.filter(i => i.status === 'passed');
    
    return {
      totalAnalyzed: this.proposals.length,
      avgImpactScore: Math.round(impacts.reduce((sum, i) => sum + i.impactScore, 0) / impacts.length),
      bullishCount: impacts.filter(i => i.impactLevel === 'bullish').length,
      bearishCount: impacts.filter(i => i.impactLevel === 'bearish').length,
      neutralCount: impacts.filter(i => i.impactLevel === 'neutral').length,
      highRiskCount: impacts.filter(i => i.riskAssessment.level === 'high' || i.riskAssessment.level === 'critical').length,
      upcomingVotes: activeImpacts.sort((a, b) => b.impactScore - a.impactScore).slice(0, 5),
      recentlyPassed: passedImpacts.slice(0, 5),
      marketSentiment: Math.round(50 + Math.random() * 30),
    };
  }

  getDaoImpactSummary(daoId: string) {
    const daoProposals = this.proposals.filter(p => p.daoId === daoId);
    const impacts = daoProposals.map(p => this.generateImpactAnalysis(p));
    
    return {
      daoId,
      totalProposals: daoProposals.length,
      avgImpactScore: Math.round(impacts.reduce((sum, i) => sum + i.impactScore, 0) / impacts.length),
      bullishProposals: impacts.filter(i => i.impactLevel === 'bullish').length,
      bearishProposals: impacts.filter(i => i.impactLevel === 'bearish').length,
      highRiskProposals: impacts.filter(i => i.riskAssessment.level === 'high' || i.riskAssessment.level === 'critical').length,
      proposals: impacts,
    };
  }

  getImpactComparison(proposalIds: string[]) {
    return proposalIds.map(id => {
      const proposal = this.proposals.find(p => p.id === id);
      if (!proposal) return null;
      return this.generateImpactAnalysis(proposal);
    }).filter(Boolean);
  }

  simulateScenario(proposalId: string, scenario: 'optimistic' | 'realistic' | 'pessimistic') {
    const proposal = this.proposals.find(p => p.id === proposalId);
    if (!proposal) return null;
    
    const base = this.generateImpactAnalysis(proposal);
    
    const scenarioModifiers = {
      optimistic: { priceMod: 1.3, confidenceMod: -15, riskMod: -10 },
      realistic: { priceMod: 1.0, confidenceMod: 0, riskMod: 0 },
      pessimistic: { priceMod: 0.7, confidenceMod: 10, riskMod: 15 },
    };
    
    const mod = scenarioModifiers[scenario];
    
    return {
      ...base,
      impactScore: Math.round(base.impactScore * mod.priceMod),
      priceImpact: {
        shortTerm: {
          min: Math.round(base.priceImpact.shortTerm.min * mod.priceMod * 10) / 10,
          max: Math.round(base.priceImpact.shortTerm.max * mod.priceMod * 10) / 10,
          confidence: Math.max(0, Math.min(100, base.priceImpact.shortTerm.confidence + mod.confidenceMod)),
        },
        mediumTerm: {
          min: Math.round(base.priceImpact.mediumTerm.min * mod.priceMod * 10) / 10,
          max: Math.round(base.priceImpact.mediumTerm.max * mod.priceMod * 10) / 10,
          confidence: Math.max(0, Math.min(100, base.priceImpact.mediumTerm.confidence + mod.confidenceMod)),
        },
        longTerm: {
          min: Math.round(base.priceImpact.longTerm.min * mod.priceMod * 10) / 10,
          max: Math.round(base.priceImpact.longTerm.max * mod.priceMod * 10) / 10,
          confidence: Math.max(0, Math.min(100, base.priceImpact.longTerm.confidence + mod.confidenceMod)),
        },
      },
      riskAssessment: {
        ...base.riskAssessment,
        overall: Math.min(100, Math.max(0, base.riskAssessment.overall + mod.riskMod)),
        level: base.riskAssessment.overall + mod.riskMod < 25 ? 'low' : base.riskAssessment.overall + mod.riskMod < 45 ? 'medium' : base.riskAssessment.overall + mod.riskMod < 65 ? 'high' : 'critical',
      },
      scenario,
    };
  }
}
