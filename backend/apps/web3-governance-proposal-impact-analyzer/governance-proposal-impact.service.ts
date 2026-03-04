import { Injectable } from '@nestjs/common';

export interface ProposalImpact {
  proposalId: string;
  dao: string;
  chain: string;
  title: string;
  description: string;
  status: 'pending' | 'active' | 'passed' | 'failed' | 'executed';
  impactScore: number;
  impactLevel: 'bullish' | 'neutral' | 'bearish';
  priceImpact: {
    shortTerm: { min: number; max: number; confidence: number };
    mediumTerm: { min: number; max: number; confidence: number };
    longTerm: { min: number; max: number; confidence: number };
  };
  riskAssessment: {
    level: 'low' | 'medium' | 'high' | 'critical';
    factors: string[];
  };
  affectedTokens: Array<{
    symbol: string;
    address: string;
    impact: number;
    direction: 'positive' | 'negative' | 'neutral';
  }>;
  affectedProtocols: Array<{
    name: string;
    impact: number;
    category: string;
  }>;
  sentimentAnalysis: {
    community: number;
    whale: number;
    overall: number;
  };
  votingPattern: {
    for: number;
    against: number;
    abstain: number;
  };
  quorumRequired: number;
  quorumReached: number;
  endTime: string;
  executionTime?: string;
  confidence: number;
  recommendations: string[];
  comparableProposals: Array<{
    id: string;
    title: string;
    outcome: 'passed' | 'failed';
    priceChange: number;
  }>;
}

export interface DaoProposalQuery {
  dao?: string;
  chain?: string;
  status?: string;
  limit?: number;
  offset?: number;
}

@Injectable()
export class GovernanceProposalImpactService {
  private readonly supportedDAOs = [
    'Uniswap', 'Aave', 'Compound', 'MakerDAO', 'Curve', 'Lido', 'ENS',
    'Balancer', 'Optimism', 'Arbitrum', 'Polygon', 'GMX', 'Rocket Pool', 
    'Synthetix', 'Connext', '1inch', 'ENS', 'Maple', 'Goldfinch', 'Radiant'
  ];

  private readonly supportedChains = [
    'ethereum', 'polygon', 'arbitrum', 'optimism', 'base', 'avalanche', 'bsc'
  ];

  async analyzeProposal(proposalId: string, dao?: string): Promise<ProposalImpact> {
    const mockDao = dao || this.supportedDAOs[Math.floor(Math.random() * this.supportedDAOs.length)];
    
    const proposalImpact = this.generateMockProposalImpact(proposalId, mockDao);
    return proposalImpact;
  }

  async getProposals(query: DaoProposalQuery): Promise<ProposalImpact[]> {
    const limit = query.limit || 20;
    const offset = query.offset || 0;
    const proposals: ProposalImpact[] = [];
    
    const daos = query.dao ? [query.dao] : this.supportedDAOs.slice(0, 10);
    
    for (let i = 0; i < limit; i++) {
      const dao = daos[Math.floor(Math.random() * daos.length)];
      const proposalId = `prop-${offset + i + 1}`;
      proposals.push(this.generateMockProposalImpact(proposalId, dao));
    }
    
    return proposals;
  }

  async getDaos(): Promise<Array<{name: string; chain: string; proposals: number; tvl: number}>> {
    return this.supportedDAOs.map(dao => ({
      name: dao,
      chain: this.getDaoChain(dao),
      proposals: Math.floor(Math.random() * 100) + 10,
      tvl: Math.floor(Math.random() * 10000000000) + 100000000
    }));
  }

  async getProposalDetails(proposalId: string, dao: string): Promise<ProposalImpact> {
    return this.generateMockProposalImpact(proposalId, dao);
  }

  async compareProposals(proposalIds: string[], dao: string): Promise<ProposalImpact[]> {
    return proposalIds.map(id => this.generateMockProposalImpact(id, dao));
  }

  async getHistoricalAnalysis(dao: string, days: number = 30): Promise<{
    totalProposals: number;
    passedProposals: number;
    failedProposals: number;
    averageImpact: number;
    topGainers: Array<{ token: string; avgChange: number }>;
    topLosers: Array<{ token: string; avgChange: number }>;
  }> {
    return {
      totalProposals: Math.floor(Math.random() * 50) + 10,
      passedProposals: Math.floor(Math.random() * 40) + 5,
      failedProposals: Math.floor(Math.random() * 15) + 1,
      averageImpact: Math.floor(Math.random() * 40) + 10,
      topGainers: [
        { token: 'UNI', avgChange: Math.random() * 15 + 5 },
        { token: 'AAVE', avgChange: Math.random() * 12 + 3 },
        { token: 'CRV', avgChange: Math.random() * 10 + 2 }
      ],
      topLosers: [
        { token: 'MKR', avgChange: -(Math.random() * 10 + 2) },
        { token: 'COMP', avgChange: -(Math.random() * 8 + 1) }
      ]
    };
  }

  private generateMockProposalImpact(proposalId: string, dao: string): ProposalImpact {
    const impactScore = Math.floor(Math.random() * 100);
    const statusOptions: Array<'pending' | 'active' | 'passed' | 'failed' | 'executed'> = 
      ['pending', 'active', 'passed', 'failed', 'executed'];
    const status = statusOptions[Math.floor(Math.random() * statusOptions.length)];
    
    const affectedTokens = this.getAffectedTokens(dao);
    
    return {
      proposalId,
      dao,
      chain: this.getDaoChain(dao),
      title: this.generateProposalTitle(dao),
      description: this.generateProposalDescription(dao),
      status,
      impactScore,
      impactLevel: impactScore > 60 ? 'bullish' : impactScore > 40 ? 'neutral' : 'bearish',
      priceImpact: {
        shortTerm: {
          min: Math.floor(Math.random() * 10) - 5,
          max: Math.floor(Math.random() * 15) + 5,
          confidence: Math.floor(Math.random() * 30) + 60
        },
        mediumTerm: {
          min: Math.floor(Math.random() * 20) - 10,
          max: Math.floor(Math.random() * 30) + 10,
          confidence: Math.floor(Math.random() * 25) + 50
        },
        longTerm: {
          min: Math.floor(Math.random() * 40) - 20,
          max: Math.floor(Math.random() * 50) + 20,
          confidence: Math.floor(Math.random() * 20) + 40
        }
      },
      riskAssessment: {
        level: this.getRandomRiskLevel(),
        factors: this.generateRiskFactors()
      },
      affectedTokens,
      affectedProtocols: this.getAffectedProtocols(dao),
      sentimentAnalysis: {
        community: Math.floor(Math.random() * 40) + 30,
        whale: Math.floor(Math.random() * 40) + 30,
        overall: Math.floor(Math.random() * 40) + 30
      },
      votingPattern: {
        for: Math.floor(Math.random() * 60) + 20,
        against: Math.floor(Math.random() * 30) + 5,
        abstain: Math.floor(Math.random() * 20) + 1
      },
      quorumRequired: 4000000 + Math.floor(Math.random() * 2000000),
      quorumReached: 3500000 + Math.floor(Math.random() * 3000000),
      endTime: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      executionTime: status === 'executed' ? new Date().toISOString() : undefined,
      confidence: Math.floor(Math.random() * 30) + 60,
      recommendations: this.generateRecommendations(dao, impactScore),
      comparableProposals: this.generateComparableProposals()
    };
  }

  private getDaoChain(dao: string): string {
    const chainMap: Record<string, string> = {
      'Uniswap': 'ethereum',
      'Aave': 'ethereum',
      'Compound': 'ethereum',
      'MakerDAO': 'ethereum',
      'Curve': 'ethereum',
      'Lido': 'ethereum',
      'ENS': 'ethereum',
      'Balancer': 'ethereum',
      'Optimism': 'optimism',
      'Arbitrum': 'arbitrum',
      'Polygon': 'polygon',
      'GMX': 'arbitrum',
      'Rocket Pool': 'ethereum',
      'Synthetix': 'ethereum',
      'Connext': 'ethereum'
    };
    return chainMap[dao] || 'ethereum';
  }

  private generateProposalTitle(dao: string): string {
    const titles = [
      `Add ${dao} as collateral type`,
      `Adjust risk parameters for ${dao}`,
      `Upgrade ${dao} protocol governance`,
      `Allocate treasury funds for ${dao} development`,
      `Integrate new oracle for ${dao}`,
      `Change ${dao} emission rate`,
      `Add new reward distribution for ${dao}`,
      `Update ${dao} fee structure`
    ];
    return titles[Math.floor(Math.random() * titles.length)];
  }

  private generateProposalDescription(dao: string): string {
    return `This proposal seeks to modify the ${dao} protocol parameters to improve overall efficiency and risk management. The changes include adjustments to collateral factors, interest rate models, and oracle configurations.`;
  }

  private getAffectedTokens(dao: string): Array<{symbol: string; address: string; impact: number; direction: 'positive' | 'negative' | 'neutral'}> {
    const tokenMap: Record<string, Array<{symbol: string; address: string}>> = {
      'Uniswap': [{symbol: 'UNI', address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984'}, {symbol: 'ETH', address: '0x0000000000000000000000000000000000000000'}],
      'Aave': [{symbol: 'AAVE', address: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9'}, {symbol: 'ETH', address: '0x0000000000000000000000000000000000000000'}],
      'Compound': [{symbol: 'COMP', address: '0xc00e94Cb662C3520282E6f5717214004A7f26888'}, {symbol: 'ETH', address: '0x0000000000000000000000000000000000000000'}],
      'MakerDAO': [{symbol: 'MKR', address: '0x9f8F72aA9304c8B593d555F12eF6589cC3A76A90'}, {symbol: 'DAI', address: '0x6B175474E89094C44Da98b954EesadcdEF9ce66CC'}],
      'Curve': [{symbol: 'CRV', address: '0xD533a949740bb3306d119CC777fa900bA034cd52'}, {symbol: 'ETH', address: '0x0000000000000000000000000000000000000000'}]
    };
    
    const tokens = tokenMap[dao] || [{symbol: 'TOKEN', address: '0x...'}, {symbol: 'ETH', address: '0x...'}];
    
    return tokens.map(token => ({
      ...token,
      impact: Math.floor(Math.random() * 20) - 10,
      direction: Math.random() > 0.5 ? 'positive' : Math.random() > 0.5 ? 'negative' : 'neutral' as const
    }));
  }

  private getAffectedProtocols(dao: string): Array<{name: string; impact: number; category: string}> {
    return [
      { name: dao, impact: Math.floor(Math.random() * 30) + 10, category: 'core' },
      { name: 'Uniswap', impact: Math.floor(Math.random() * 15), category: 'dex' },
      { name: 'Aave', impact: Math.floor(Math.random() * 10), category: 'lending' }
    ];
  }

  private getRandomRiskLevel(): 'low' | 'medium' | 'high' | 'critical' {
    const levels: Array<'low' | 'medium' | 'high' | 'critical'> = ['low', 'medium', 'high', 'critical'];
    return levels[Math.floor(Math.random() * levels.length)];
  }

  private generateRiskFactors(): string[] {
    const factors = [
      'Smart contract risk',
      'Liquidity risk',
      'Oracle manipulation risk',
      'Governance centralization',
      'Regulatory uncertainty',
      'Market volatility',
      'Protocol complexity',
      'Integration risk'
    ];
    const numFactors = Math.floor(Math.random() * 4) + 2;
    const selected = [...factors].sort(() => 0.5 - Math.random()).slice(0, numFactors);
    return selected;
  }

  private generateRecommendations(dao: string, impactScore: number): string[] {
    const recommendations = [
      `Monitor ${dao} governance discussions closely`,
      'Consider diversifying exposure based on proposal outcome',
      'Review smart contract implications before voting',
      'Assess impact on related DeFi protocols',
      'Track whale voting patterns for early signals',
      'Evaluate risk-adjusted returns post-execution'
    ];
    const numRecs = Math.floor(Math.random() * 3) + 2;
    return recommendations.slice(0, numRecs);
  }

  private generateComparableProposals(): Array<{id: string; title: string; outcome: 'passed' | 'failed'; priceChange: number}> {
    return [
      { id: 'prop-101', title: 'Add collateral type', outcome: 'passed', priceChange: Math.random() * 10 + 2 },
      { id: 'prop-98', title: 'Parameter adjustment', outcome: 'passed', priceChange: Math.random() * 8 - 2 },
      { id: 'prop-95', title: 'Treasury allocation', outcome: 'failed', priceChange: Math.random() * 5 - 3 }
    ];
  }
}
