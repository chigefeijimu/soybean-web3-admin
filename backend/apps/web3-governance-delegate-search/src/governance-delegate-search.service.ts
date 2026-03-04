import { Injectable } from '@nestjs/common';

export interface Delegate {
  id: string;
  address: string;
  name: string;
  ens?: string;
  avatar?: string;
  dao: string;
  chain: string;
  votingPower: number;
  delegators: number;
  votesReceived: number;
  participation: number;
  proposalsVoted: number;
  proposalsCreated?: number;
  forVotes: number;
  againstVotes: number;
  abstainVotes: number;
  lastActive: string;
  reputation: 'legend' | 'veteran' | 'expert' | 'trusted' | 'new';
  reputationScore: number;
  expertise: string[];
  socialLinks?: {
    twitter?: string;
    discord?: string;
    github?: string;
  };
  performance: {
    accuracy: number;
    consistency: number;
    timeliness: number;
  };
}

export interface DelegateSearchParams {
  query?: string;
  dao?: string;
  chain?: string;
  minVotingPower?: number;
  minDelegators?: number;
  reputation?: string;
  expertise?: string;
  sortBy?: 'votingPower' | 'delegators' | 'reputation' | 'participation' | 'lastActive';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export interface DelegateComparisonParams {
  addresses: string[];
}

export interface DAO {
  id: string;
  name: string;
  chain: string;
  token: string;
  totalDelegates: number;
  totalVotingPower: number;
  activeProposals: number;
}

@Injectable()
export class GovernanceDelegateSearchService {
  private readonly supportedDAOs: DAO[] = [
    { id: 'uniswap', name: 'Uniswap', chain: 'Ethereum', token: 'UNI', totalDelegates: 156, totalVotingPower: 45000000, activeProposals: 8 },
    { id: 'aave', name: 'Aave', chain: 'Ethereum', token: 'AAVE', totalDelegates: 89, totalVotingPower: 28000000, activeProposals: 5 },
    { id: 'compound', name: 'Compound', chain: 'Ethereum', token: 'COMP', totalDelegates: 124, totalVotingPower: 18000000, activeProposals: 3 },
    { id: 'makerdao', name: 'MakerDAO', chain: 'Ethereum', token: 'MKR', totalDelegates: 210, totalVotingPower: 52000000, activeProposals: 12 },
    { id: 'curve', name: 'Curve', chain: 'Ethereum', token: 'CRV', totalDelegates: 178, totalVotingPower: 35000000, activeProposals: 7 },
    { id: 'lido', name: 'Lido', chain: 'Ethereum', token: 'LDO', totalDelegates: 145, totalVotingPower: 28000000, activeProposals: 6 },
    { id: 'ens', name: 'ENS', chain: 'Ethereum', token: 'ENS', totalDelegates: 98, totalVotingPower: 15000000, activeProposals: 4 },
    { id: 'balancer', name: 'Balancer', chain: 'Ethereum', token: 'BAL', totalDelegates: 76, totalVotingPower: 12000000, activeProposals: 3 },
    { id: 'optimism', name: 'Optimism', chain: 'Optimism', token: 'OP', totalDelegates: 165, totalVotingPower: 42000000, activeProposals: 9 },
    { id: 'arbitrum', name: 'Arbitrum', chain: 'Arbitrum', token: 'ARB', totalDelegates: 142, totalVotingPower: 38000000, activeProposals: 7 },
    { id: 'polygon', name: 'Polygon', chain: 'Polygon', token: 'MATIC', totalDelegates: 88, totalVotingPower: 18000000, activeProposals: 4 },
    { id: 'gmx', name: 'GMX', chain: 'Arbitrum', token: 'GMX', totalDelegates: 56, totalVotingPower: 8000000, activeProposals: 2 },
    { id: 'rocket-pool', name: 'Rocket Pool', chain: 'Ethereum', token: 'RPL', totalDelegates: 67, totalVotingPower: 5500000, activeProposals: 3 },
    { id: 'synthetix', name: 'Synthetix', chain: 'Ethereum', token: 'SNX', totalDelegates: 94, totalVotingPower: 11000000, activeProposals: 5 },
    { id: 'connext', name: 'Connext', chain: 'Ethereum', token: 'NEXT', totalDelegates: 45, totalVotingPower: 3200000, activeProposals: 2 },
  ];

  private readonly delegates: Delegate[] = this.generateMockDelegates();

  private generateMockDelegates(): Delegate[] {
    const delegates: Delegate[] = [];
    const names = [
      'CryptoVanguard', 'DeFiWizard', 'GovernanceGuru', 'TokenTitan', 'YieldYogi',
      'ChainChampion', 'ProtocolPro', 'StakeSlayer', 'VaultVeteran', 'LiquidityLord',
      'BridgeBuilder', 'SwapSpecialist', 'PoolPioneer', 'FarmFinder', 'YieldHunter',
      'AlphaSeeker', 'BetaBuilder', 'GammaGuru', 'DeltaDeFi', 'OmegaOracle',
      'SatoshiSuccessor', 'VitalikVisionary', 'GavinGuru', 'JosephInnovator', 'AdaAdvocate',
      'PolkadotPro', 'CosmosCrafter', 'SolanaSage', 'AvalancheArchitect', 'NearNinja',
      'ChainlinkChief', 'UniswapUniversity', 'AaveAuthority', 'CompoundCaptain', 'CurveCaptain',
      'LidoLegend', 'EnsEmissary', 'BalancerBoss', 'OptimismOracle', 'ArbitrumAce',
    ];

    const expertises = [
      'Risk Management', 'DeFi Strategy', 'Protocol Development', 'Tokenomics', 'Governance',
      'Smart Contracts', 'Security', 'Liquidity', 'Yield Farming', 'Cross-chain',
      'NFT', 'DAOs', 'Staking', 'Lending', 'Borrowing',
    ];

    const socials = [
      { twitter: 'twitter.com/delegate1', discord: 'discord.gg/delegate1' },
      { twitter: 'twitter.com/cryptodelegate', github: 'github.com/devdelegate' },
      { twitter: 'twitter.com/govpro', discord: 'discord.gg/govpro' },
      { twitter: 'twitter.com/defiwizard', github: 'github.com/defiwiz' },
      { twitter: 'twitter.com/yieldmaster', discord: 'discord.gg/yield' },
    ];

    for (let i = 0; i < 300; i++) {
      const dao = this.supportedDAOs[Math.floor(Math.random() * this.supportedDAOs.length)];
      const name = names[Math.floor(Math.random() * names.length)];
      const reputationScores = [95, 88, 82, 76, 65, 58, 45];
      const reputations: Delegate['reputation'][] = ['legend', 'veteran', 'expert', 'trusted', 'new'];
      
      const votingPower = Math.floor(Math.random() * 5000000) + 10000;
      const delegators = Math.floor(Math.random() * 500) + 1;
      const proposalsVoted = Math.floor(Math.random() * 200) + 10;
      const participation = Math.floor(Math.random() * 30) + 70;
      const reputationScore = reputationScores[Math.floor(Math.random() * reputationScores.length)];
      const reputationIndex = Math.floor((100 - reputationScore) / 15);

      const forVotes = Math.floor(proposalsVoted * (0.4 + Math.random() * 0.4));
      const againstVotes = Math.floor(proposalsVoted * (0.1 + Math.random() * 0.3));
      const abstainVotes = proposalsVoted - forVotes - againstVotes;

      const selectedExpertise = expertises
        .sort(() => Math.random() - 0.5)
        .slice(0, Math.floor(Math.random() * 4) + 1);

      delegates.push({
        id: `delegate-${i + 1}`,
        address: `0x${Math.random().toString(16).substr(2, 40)}`,
        name: `${name}${i > 39 ? ` ${i + 1}` : ''}`,
        ens: Math.random() > 0.7 ? `${name.toLowerCase()}.eth` : undefined,
        avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${name}${i}`,
        dao: dao.id,
        chain: dao.chain,
        votingPower,
        delegators,
        votesReceived: Math.floor(votingPower * (0.8 + Math.random() * 0.4)),
        participation,
        proposalsVoted,
        proposalsCreated: Math.floor(Math.random() * 30),
        forVotes,
        againstVotes,
        abstainVotes,
        lastActive: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString(),
        reputation: reputations[Math.min(reputationIndex, 4)],
        reputationScore,
        expertise: selectedExpertise,
        socialLinks: Math.random() > 0.5 ? socials[Math.floor(Math.random() * socials.length)] : undefined,
        performance: {
          accuracy: Math.floor(Math.random() * 25) + 75,
          consistency: Math.floor(Math.random() * 30) + 70,
          timeliness: Math.floor(Math.random() * 20) + 80,
        },
      });
    }

    return delegates;
  }

  async searchDelegates(params: DelegateSearchParams): Promise<{ data: Delegate[]; total: number; page: number; pageSize: number; totalPages: number }> {
    let filtered = [...this.delegates];

    if (params.query) {
      const query = params.query.toLowerCase();
      filtered = filtered.filter(
        d =>
          d.name.toLowerCase().includes(query) ||
          d.address.toLowerCase().includes(query) ||
          d.ens?.toLowerCase().includes(query) ||
          d.dao.toLowerCase().includes(query)
      );
    }

    if (params.dao) {
      filtered = filtered.filter(d => d.dao === params.dao);
    }

    if (params.chain) {
      filtered = filtered.filter(d => d.chain.toLowerCase() === params.chain.toLowerCase());
    }

    if (params.minVotingPower) {
      filtered = filtered.filter(d => d.votingPower >= params.minVotingPower!);
    }

    if (params.minDelegators) {
      filtered = filtered.filter(d => d.delegators >= params.minDelegators!);
    }

    if (params.reputation) {
      filtered = filtered.filter(d => d.reputation === params.reputation);
    }

    if (params.expertise) {
      filtered = filtered.filter(d => d.expertise.some(e => e.toLowerCase().includes(params.expertise!.toLowerCase())));
    }

    const sortBy = params.sortBy || 'votingPower';
    const sortOrder = params.sortOrder || 'desc';
    
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'votingPower':
          comparison = a.votingPower - b.votingPower;
          break;
        case 'delegators':
          comparison = a.delegators - b.delegators;
          break;
        case 'reputation':
          comparison = a.reputationScore - b.reputationScore;
          break;
        case 'participation':
          comparison = a.participation - b.participation;
          break;
        case 'lastActive':
          comparison = new Date(a.lastActive).getTime() - new Date(b.lastActive).getTime();
          break;
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });

    const page = params.page || 1;
    const pageSize = params.pageSize || 20;
    const total = filtered.length;
    const totalPages = Math.ceil(total / pageSize);
    const start = (page - 1) * pageSize;
    const data = filtered.slice(start, start + pageSize);

    return { data, total, page, pageSize, totalPages };
  }

  async getDelegateByAddress(address: string): Promise<Delegate | null> {
    return this.delegates.find(d => d.address.toLowerCase() === address.toLowerCase()) || null;
  }

  async getDAOs(): Promise<DAO[]> {
    return this.supportedDAOs;
  }

  async getDAOById(daoId: string): Promise<DAO | null> {
    return this.supportedDAOs.find(d => d.id === daoId) || null;
  }

  async compareDelegates(addresses: string[]): Promise<{ delegates: Delegate[]; comparison: any }> {
    const delegates = addresses
      .map(addr => this.delegates.find(d => d.address.toLowerCase() === addr.toLowerCase()))
      .filter((d): d is Delegate => d !== undefined);

    const comparison = {
      totalVotingPower: delegates.reduce((sum, d) => sum + d.votingPower, 0),
      totalDelegators: delegates.reduce((sum, d) => sum + d.delegators, 0),
      averageParticipation: Math.round(delegates.reduce((sum, d) => sum + d.participation, 0) / delegates.length),
      averageReputation: Math.round(delegates.reduce((sum, d) => sum + d.reputationScore, 0) / delegates.length),
      expertiseOverlap: this.calculateExpertiseOverlap(delegates),
      votingPattern: this.analyzeVotingPatterns(delegates),
    };

    return { delegates, comparison };
  }

  private calculateExpertiseOverlap(delegates: Delegate[]): string[] {
    if (delegates.length < 2) return [];
    
    const allExpertise = delegates.flatMap(d => d.expertise);
    const counts = new Map<string, number>();
    
    allExpertise.forEach(e => {
      counts.set(e, (counts.get(e) || 0) + 1);
    });

    return Array.from(counts.entries())
      .filter(([_, count]) => count > 1)
      .map(([expertise]) => expertise);
  }

  private analyzeVotingPatterns(delegates: Delegate[]): { forDominant: number; againstDominant: number; neutral: number } {
    let forDominant = 0;
    let againstDominant = 0;
    let neutral = 0;

    delegates.forEach(d => {
      const forRatio = d.forVotes / d.proposalsVoted;
      const againstRatio = d.againstVotes / d.proposalsVoted;
      
      if (forRatio > 0.6) forDominant++;
      else if (againstRatio > 0.4) againstDominant++;
      else neutral++;
    });

    return { forDominant, againstDominant, neutral };
  }

  async getTopDelegates(dao?: string, limit: number = 10): Promise<Delegate[]> {
    let filtered = [...this.delegates];
    
    if (dao) {
      filtered = filtered.filter(d => d.dao === dao);
    }

    return filtered
      .sort((a, b) => b.votingPower - a.votingPower)
      .slice(0, limit);
  }

  async getDelegateStats(): Promise<{
    totalDelegates: number;
    totalDAOs: number;
    averageVotingPower: number;
    averageDelegators: number;
    reputationDistribution: Record<string, number>;
    chainDistribution: Record<string, number>;
    expertiseDistribution: Record<string, number>;
  }> {
    const totalDelegates = this.delegates.length;
    const totalDAOs = this.supportedDAOs.length;
    const averageVotingPower = Math.round(this.delegates.reduce((sum, d) => sum + d.votingPower, 0) / totalDelegates);
    const averageDelegators = Math.round(this.delegates.reduce((sum, d) => sum + d.delegators, 0) / totalDelegates);

    const reputationDistribution = this.delegates.reduce((acc, d) => {
      acc[d.reputation] = (acc[d.reputation] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const chainDistribution = this.delegates.reduce((acc, d) => {
      acc[d.chain] = (acc[d.chain] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const expertiseDistribution = this.delegates
      .flatMap(d => d.expertise)
      .reduce((acc, e) => {
        acc[e] = (acc[e] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    return {
      totalDelegates,
      totalDAOs,
      averageVotingPower,
      averageDelegators,
      reputationDistribution,
      chainDistribution,
      expertiseDistribution,
    };
  }

  async searchByExpertise(expertise: string): Promise<Delegate[]> {
    return this.delegates.filter(d => 
      d.expertise.some(e => e.toLowerCase().includes(expertise.toLowerCase()))
    );
  }

  async findSimilarDelegates(address: string, limit: number = 5): Promise<Delegate[]> {
    const delegate = this.delegates.find(d => d.address.toLowerCase() === address.toLowerCase());
    if (!delegate) return [];

    return this.delegates
      .filter(d => d.address.toLowerCase() !== address.toLowerCase() && d.dao === delegate.dao)
      .sort((a, b) => {
        const aOverlap = a.expertise.filter(e => delegate.expertise.includes(e)).length;
        const bOverlap = b.expertise.filter(e => delegate.expertise.includes(e)).length;
        return bOverlap - aOverlap;
      })
      .slice(0, limit);
  }
}
