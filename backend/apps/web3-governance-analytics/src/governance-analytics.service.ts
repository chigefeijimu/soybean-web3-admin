import { Injectable } from '@nestjs/common';

export interface DAOInfo {
  id: string;
  name: string;
  chain: string;
  tokenSymbol: string;
  tokenAddress: string;
  treasuryValue: number;
  memberCount: number;
  proposalCount: number;
  activeProposals: number;
  passedProposals: number;
  failedProposals: number;
  participationRate: number;
  averageVoteDuration: number;
  quorum: number;
  logo: string;
}

export interface Proposal {
  id: string;
  daoId: string;
  daoName: string;
  title: string;
  description: string;
  status: 'pending' | 'active' | 'passed' | 'failed' | 'executed' | 'cancelled';
  category: 'treasury' | 'parameter' | 'upgrade' | 'governance' | 'grant' | 'security' | 'other';
  votesFor: number;
  votesAgainst: number;
  votesAbstain: number;
  totalVotes: number;
  quorum: number;
  startTime: string;
  endTime: string;
  proposer: string;
  executionData?: string;
}

export interface Delegate {
  id: string;
  address: string;
  daoId: string;
  daoName: string;
  votingPower: number;
  votingPowerPercentage: number;
  delegators: number;
  proposalsVoted: number;
  votesFor: number;
  votesAgainst: number;
  votesAbstain: number;
  participationRate: number;
  rank: number;
  reputation: 'legend' | 'veteran' | 'expert' | 'trusted' | 'new';
}

export interface GovernanceMetrics {
  totalDAOs: number;
  totalProposals: number;
  activeProposals: number;
  totalTreasury: number;
  averageParticipation: number;
  chainDistribution: { chain: string; count: number; treasury: number }[];
  categoryDistribution: { category: string; count: number }[];
  topDAOs: DAOInfo[];
  recentProposals: Proposal[];
  topDelegates: Delegate[];
}

export interface DAOProposalsResponse {
  dao: DAOInfo;
  proposals: Proposal[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

@Injectable()
export class GovernanceAnalyticsService {
  private readonly supportedChains = [
    'ethereum',
    'arbitrum',
    'optimism',
    'polygon',
    'base',
    'avalanche',
    'bsc',
  ];

  private readonly supportedDAOs: DAOInfo[] = [
    {
      id: 'uniswap',
      name: 'Uniswap',
      chain: 'ethereum',
      tokenSymbol: 'UNI',
      tokenAddress: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
      treasuryValue: 2450000000,
      memberCount: 125000,
      proposalCount: 156,
      activeProposals: 3,
      passedProposals: 112,
      failedProposals: 41,
      participationRate: 68.5,
      averageVoteDuration:  7,
      quorum: 40,
      logo: '🦄',
    },
    {
      id: 'aave',
      name: 'Aave',
      chain: 'ethereum',
      tokenSymbol: 'AAVE',
      tokenAddress: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9',
      treasuryValue: 1850000000,
      memberCount: 89000,
      proposalCount: 234,
      activeProposals: 2,
      passedProposals: 189,
      failedProposals: 43,
      participationRate: 72.3,
      averageVoteDuration: 5,
      quorum: 32,
      logo: '🦁',
    },
    {
      id: 'compound',
      name: 'Compound',
      chain: 'ethereum',
      tokenSymbol: 'COMP',
      tokenAddress: '0xc00e94Cb662C3520282E6f5717214004A7f26888',
      treasuryValue: 450000000,
      memberCount: 67000,
      proposalCount: 189,
      activeProposals: 1,
      passedProposals: 145,
      failedProposals: 43,
      participationRate: 65.2,
      averageVoteDuration: 7,
      quorum: 40,
      logo: '📊',
    },
    {
      id: 'makerdao',
      name: 'MakerDAO',
      chain: 'ethereum',
      tokenSymbol: 'MKR',
      tokenAddress: '0x9f8F72aA9304c8B593d555F12eF6589cC3BBd56',
      treasuryValue: 3200000000,
      memberCount: 95000,
      proposalCount: 567,
      activeProposals: 4,
      passedProposals: 423,
      failedProposals: 140,
      participationRate: 58.7,
      averageVoteDuration: 14,
      quorum: 10,
      logo: '🎩',
    },
    {
      id: 'curve',
      name: 'Curve DAO',
      chain: 'ethereum',
      tokenSymbol: 'CRV',
      tokenAddress: '0xD533a949740bb3306d119CC777fa900bA034cd52',
      treasuryValue: 890000000,
      memberCount: 78000,
      proposalCount: 145,
      activeProposals: 2,
      passedProposals: 98,
      failedProposals: 45,
      participationRate: 62.1,
      averageVoteDuration: 7,
      quorum: 30,
      logo: '📈',
    },
    {
      id: 'lido',
      name: 'Lido',
      chain: 'ethereum',
      tokenSymbol: 'LDO',
      tokenAddress: '0x5A98FcBEA4Cf1B823F8F0e9DD80f3450cB4fE5d4',
      treasuryValue: 1580000000,
      memberCount: 45000,
      proposalCount: 89,
      activeProposals: 1,
      passedProposals: 72,
      failedProposals: 16,
      participationRate: 75.4,
      averageVoteDuration: 5,
      quorum: 50,
      logo: '💧',
    },
    {
      id: 'ens',
      name: 'ENS DAO',
      chain: 'ethereum',
      tokenSymbol: 'ENS',
      tokenAddress: '0xC18360217D8F7Ab5e3c2330bB8D8109bFF815E51',
      treasuryValue: 320000000,
      memberCount: 23000,
      proposalCount: 67,
      activeProposals: 1,
      passedProposals: 52,
      failedProposals: 14,
      participationRate: 69.8,
      averageVoteDuration: 7,
      quorum: 50,
      logo: '🌐',
    },
    {
      id: 'balancer',
      name: 'Balancer',
      chain: 'ethereum',
      tokenSymbol: 'BAL',
      tokenAddress: '0xba100000625a3754423978a60c9317c58a424e3D',
      treasuryValue: 180000000,
      memberCount: 34000,
      proposalCount: 98,
      activeProposals: 1,
      passedProposals: 78,
      failedProposals: 19,
      participationRate: 64.5,
      averageVoteDuration: 7,
      quorum: 35,
      logo: '⚖️',
    },
    {
      id: 'optimism',
      name: 'Optimism',
      chain: 'optimism',
      tokenSymbol: 'OP',
      tokenAddress: '0x4200000000000000000000000000000000000042',
      treasuryValue: 2100000000,
      memberCount: 125000,
      proposalCount: 78,
      activeProposals: 2,
      passedProposals: 62,
      failedProposals: 14,
      participationRate: 71.2,
      averageVoteDuration: 7,
      quorum: 30,
      logo: '🔴',
    },
    {
      id: 'arbitrum',
      name: 'Arbitrum',
      chain: 'arbitrum',
      tokenSymbol: 'ARB',
      tokenAddress: '0x912CE59144191C1204E64559FE8253a0e49E6548',
      treasuryValue: 1900000000,
      memberCount: 145000,
      proposalCount: 45,
      activeProposals: 1,
      passedProposals: 38,
      failedProposals: 6,
      participationRate: 68.9,
      averageVoteDuration: 7,
      quorum: 30,
      logo: '🔵',
    },
    {
      id: 'polygon',
      name: 'Polygon',
      chain: 'polygon',
      tokenSymbol: 'MATIC',
      tokenAddress: '0x0000000000000000000000000000000000000000',
      treasuryValue: 890000000,
      memberCount: 67000,
      proposalCount: 34,
      activeProposals: 1,
      passedProposals: 28,
      failedProposals: 5,
      participationRate: 72.1,
      averageVoteDuration: 5,
      quorum: 25,
      logo: '🟣',
    },
    {
      id: 'gmx',
      name: 'GMX',
      chain: 'arbitrum',
      tokenSymbol: 'GMX',
      tokenAddress: '0xfc5A1A6EB076a2C7adD06E22DC90Dea84040cXml',
      treasuryValue: 450000000,
      memberCount: 28000,
      proposalCount: 56,
      activeProposals: 0,
      passedProposals: 45,
      failedProposals: 11,
      participationRate: 58.3,
      averageVoteDuration: 5,
      quorum: 40,
      logo: '🦊',
    },
    {
      id: 'rocket-pool',
      name: 'Rocket Pool',
      chain: 'ethereum',
      tokenSymbol: 'RPL',
      tokenAddress: '0xD33526068D116cE69F19A9EE46F0bd304F21A51f',
      treasuryValue: 380000000,
      memberCount: 18000,
      proposalCount: 78,
      activeProposals: 1,
      passedProposals: 62,
      failedProposals: 15,
      participationRate: 66.7,
      averageVoteDuration: 7,
      quorum: 35,
      logo: '🚀',
    },
    {
      id: 'synthetix',
      name: 'Synthetix',
      chain: 'ethereum',
      tokenSymbol: 'SNX',
      tokenAddress: '0xC011a73ee8576Fb46F5E1c5751cA3B9Fe0af2a6F',
      treasuryValue: 520000000,
      memberCount: 42000,
      proposalCount: 145,
      activeProposals: 1,
      passedProposals: 112,
      failedProposals: 32,
      participationRate: 70.1,
      averageVoteDuration: 7,
      quorum: 30,
      logo: '⚡',
    },
    {
      id: 'connext',
      name: 'Connext',
      chain: 'ethereum',
      tokenSymbol: 'NEXT',
      tokenAddress: '0x4A1E81C6C636f4C8E7Eab3FAc4e89b2e6A8E8e9F',
      treasuryValue: 85000000,
      memberCount: 12000,
      proposalCount: 45,
      activeProposals: 0,
      passedProposals: 38,
      failedProposals: 7,
      participationRate: 63.4,
      averageVoteDuration: 5,
      quorum: 40,
      logo: '🔗',
    },
  ];

  private generateProposals(daoId: string, count: number): Proposal[] {
    const statuses: Proposal['status'][] = ['pending', 'active', 'passed', 'failed', 'executed', 'cancelled'];
    const categories: Proposal['category'][] = ['treasury', 'parameter', 'upgrade', 'governance', 'grant', 'security', 'other'];
    const proposals: Proposal[] = [];
    
    const titles = [
      'Treasury Diversification Proposal',
      'Parameter Adjustment: Risk Parameter Update',
      'Protocol Upgrade Implementation',
      'Governance Structure Reform',
      'Grant Program Expansion',
      'Security Enhancement Initiative',
      'Partnership with External Protocol',
      'Incentive Program Modification',
      'Community Pool Funding',
      'Emergency Response Framework',
    ];

    for (let i = 0; i < count; i++) {
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const category = categories[Math.floor(Math.random() * categories.length)];
      const votesFor = Math.floor(Math.random() * 5000000) + 100000;
      const votesAgainst = Math.floor(Math.random() * 2000000);
      const votesAbstain = Math.floor(Math.random() * 500000);
      
      const startTime = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);
      const endTime = new Date(startTime.getTime() + 7 * 24 * 60 * 60 * 1000);

      proposals.push({
        id: `${daoId}-proposal-${i + 1}`,
        daoId,
        daoName: this.supportedDAOs.find(d => d.id === daoId)?.name || daoId,
        title: titles[Math.floor(Math.random() * titles.length)],
        description: `This proposal aims to implement significant changes to the ${daoId} protocol. The proposal includes detailed specifications for technical implementation, risk assessment, and community impact analysis.`,
        status,
        category,
        votesFor,
        votesAgainst,
        votesAbstain,
        totalVotes: votesFor + votesAgainst + votesAbstain,
        quorum: 1000000,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        proposer: `0x${Math.random().toString(16).substr(2, 40)}`,
        executionData: status === 'executed' ? '0x' + Math.random().toString(16).substr(2, 8) : undefined,
      });
    }
    
    return proposals.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  }

  private generateDelegates(daoId: string, count: number): Delegate[] {
    const reputations: Delegate['reputation'][] = ['legend', 'veteran', 'expert', 'trusted', 'new'];
    const delegates: Delegate[] = [];
    
    for (let i = 0; i < count; i++) {
      const votingPower = Math.floor(Math.random() * 5000000) + 10000;
      const totalVotingPower = 10000000; // Simulated total
      const proposalsVoted = Math.floor(Math.random() * 150) + 10;
      const votesFor = Math.floor(proposalsVoted * (0.5 + Math.random() * 0.4));
      const votesAgainst = Math.floor(proposalsVoted * Math.random() * 0.3);
      const votesAbstain = proposalsVoted - votesFor - votesAgainst;
      
      delegates.push({
        id: `${daoId}-delegate-${i + 1}`,
        address: `0x${Math.random().toString(16).substr(2, 40)}`,
        daoId,
        daoName: this.supportedDAOs.find(d => d.id === daoId)?.name || daoId,
        votingPower,
        votingPowerPercentage: (votingPower / totalVotingPower) * 100,
        delegators: Math.floor(Math.random() * 100) + 1,
        proposalsVoted,
        votesFor,
        votesAgainst,
        votesAbstain,
        participationRate: 60 + Math.random() * 35,
        rank: i + 1,
        reputation: reputations[Math.floor(Math.random() * reputations.length)],
      });
    }
    
    return delegates.sort((a, b) => b.votingPower - a.votingPower);
  }

  async getDashboardMetrics(): Promise<GovernanceMetrics> {
    const chainDistribution = this.supportedChains.map(chain => ({
      chain,
      count: this.supportedDAOs.filter(d => d.chain === chain).length,
      treasury: this.supportedDAOs
        .filter(d => d.chain === chain)
        .reduce((sum, d) => sum + d.treasuryValue, 0),
    }));

    const allProposals = this.supportedDAOs.flatMap(dao => 
      this.generateProposals(dao.id, Math.floor(Math.random() * 10) + 5)
    );

    const categoryDistribution = [
      { category: 'treasury', count: Math.floor(allProposals.filter(p => p.category === 'treasury').length) },
      { category: 'parameter', count: Math.floor(allProposals.filter(p => p.category === 'parameter').length) },
      { category: 'upgrade', count: Math.floor(allProposals.filter(p => p.category === 'upgrade').length) },
      { category: 'governance', count: Math.floor(allProposals.filter(p => p.category === 'governance').length) },
      { category: 'grant', count: Math.floor(allProposals.filter(p => p.category === 'grant').length) },
      { category: 'security', count: Math.floor(allProposals.filter(p => p.category === 'security').length) },
      { category: 'other', count: Math.floor(allProposals.filter(p => p.category === 'other').length) },
    ];

    return {
      totalDAOs: this.supportedDAOs.length,
      totalProposals: allProposals.length,
      activeProposals: allProposals.filter(p => p.status === 'active').length,
      totalTreasury: this.supportedDAOs.reduce((sum, d) => sum + d.treasuryValue, 0),
      averageParticipation: this.supportedDAOs.reduce((sum, d) => sum + d.participationRate, 0) / this.supportedDAOs.length,
      chainDistribution,
      categoryDistribution,
      topDAOs: [...this.supportedDAOs].sort((a, b) => b.treasuryValue - a.treasuryValue).slice(0, 10),
      recentProposals: allProposals.sort((a, b) => 
        new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
      ).slice(0, 20),
      topDelegates: this.generateDelegates('uniswap', 10),
    };
  }

  async getDAOList(chain?: string, sortBy: string = 'treasury'): Promise<DAOInfo[]> {
    let daos = [...this.supportedDAOs];
    
    if (chain && chain !== 'all') {
      daos = daos.filter(d => d.chain === chain);
    }

    switch (sortBy) {
      case 'treasury':
        daos.sort((a, b) => b.treasuryValue - a.treasuryValue);
        break;
      case 'members':
        daos.sort((a, b) => b.memberCount - a.memberCount);
        break;
      case 'proposals':
        daos.sort((a, b) => b.proposalCount - a.proposalCount);
        break;
      case 'participation':
        daos.sort((a, b) => b.participationRate - a.participationRate);
        break;
    }

    return daos;
  }

  async getDAODetails(daoId: string): Promise<DAOInfo & { proposals: Proposal[]; delegates: Delegate[] }> {
    const dao = this.supportedDAOs.find(d => d.id === daoId);
    if (!dao) {
      throw new Error(`DAO not found: ${daoId}`);
    }

    return {
      ...dao,
      proposals: this.generateProposals(daoId, 20),
      delegates: this.generateDelegates(daoId, 20),
    };
  }

  async getDAOProposals(
    daoId: string,
    status?: string,
    category?: string,
    page: number = 1,
    pageSize: number = 20,
  ): Promise<DAOProposalsResponse> {
    const dao = this.supportedDAOs.find(d => d.id === daoId);
    if (!dao) {
      throw new Error(`DAO not found: ${daoId}`);
    }

    let proposals = this.generateProposals(daoId, 50);

    if (status && status !== 'all') {
      proposals = proposals.filter(p => p.status === status);
    }

    if (category && category !== 'all') {
      proposals = proposals.filter(p => p.category === category);
    }

    const total = proposals.length;
    const totalPages = Math.ceil(total / pageSize);
    const startIndex = (page - 1) * pageSize;

    return {
      dao,
      proposals: proposals.slice(startIndex, startIndex + pageSize),
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
      },
    };
  }

  async getDAODelegates(
    daoId: string,
    sortBy: string = 'votingPower',
    page: number = 1,
    pageSize: number = 20,
  ): Promise<{ delegates: Delegate[]; pagination: any }> {
    const dao = this.supportedDAOs.find(d => d.id === daoId);
    if (!dao) {
      throw new Error(`DAO not found: ${daoId}`);
    }

    let delegates = this.generateDelegates(daoId, 50);

    switch (sortBy) {
      case 'votingPower':
        delegates.sort((a, b) => b.votingPower - a.votingPower);
        break;
      case 'delegators':
        delegates.sort((a, b) => b.delegators - a.delegators);
        break;
      case 'participation':
        delegates.sort((a, b) => b.participationRate - a.participationRate);
        break;
    }

    const total = delegates.length;
    const totalPages = Math.ceil(total / pageSize);
    const startIndex = (page - 1) * pageSize;

    return {
      delegates: delegates.slice(startIndex, startIndex + pageSize).map((d, i) => ({
        ...d,
        rank: startIndex + i + 1,
      })),
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
      },
    };
  }

  async getProposalDetails(daoId: string, proposalId: string): Promise<Proposal> {
    const proposals = this.generateProposals(daoId, 50);
    const proposal = proposals.find(p => p.id === proposalId);
    
    if (!proposal) {
      throw new Error(`Proposal not found: ${proposalId}`);
    }

    return proposal;
  }

  async getDelegateDetails(daoId: string, delegateAddress: string): Promise<Delegate> {
    const delegates = this.generateDelegates(daoId, 50);
    const delegate = delegates.find(d => d.address.toLowerCase() === delegateAddress.toLowerCase());
    
    if (!delegate) {
      throw new Error(`Delegate not found: ${delegateAddress}`);
    }

    return delegate;
  }

  async searchDAOs(query: string): Promise<DAOInfo[]> {
    const lowerQuery = query.toLowerCase();
    return this.supportedDAOs.filter(
      d => d.name.toLowerCase().includes(lowerQuery) || 
           d.tokenSymbol.toLowerCase().includes(lowerQuery) ||
           d.id.toLowerCase().includes(lowerQuery)
    );
  }

  async getGovernanceStats(daoId?: string): Promise<any> {
    if (daoId) {
      const dao = this.supportedDAOs.find(d => d.id === daoId);
      if (!dao) {
        throw new Error(`DAO not found: ${daoId}`);
      }
      const proposals = this.generateProposals(daoId, 50);
      
      return {
        dao,
        stats: {
          totalProposals: proposals.length,
          passedRate: (proposals.filter(p => p.status === 'passed').length / proposals.length) * 100,
          averageVotes: proposals.reduce((sum, p) => sum + p.totalVotes, 0) / proposals.length,
          participationRate: dao.participationRate,
          activeProposals: proposals.filter(p => p.status === 'active').length,
        },
      };
    }

    return {
      totalDAOs: this.supportedDAOs.length,
      totalTreasury: this.supportedDAOs.reduce((sum, d) => sum + d.treasuryValue, 0),
      totalMembers: this.supportedDAOs.reduce((sum, d) => sum + d.memberCount, 0),
      averageParticipation: this.supportedDAOs.reduce((sum, d) => sum + d.participationRate, 0) / this.supportedDAOs.length,
    };
  }
}
