import { Injectable } from '@nestjs/common';

export interface DAOGovernanceStats {
  dao: string;
  chain: string;
  totalProposals: number;
  activeProposals: number;
  passedProposals: number;
  failedProposals: number;
  totalVoters: number;
  totalVotes: number;
  participationRate: number;
  avgVotingPower: number;
  topDelegates: DelegatePerformance[];
  recentProposals: ProposalInfo[];
  governanceScore: number;
}

export interface DelegatePerformance {
  address: string;
  name: string;
  votesReceived: number;
  proposalsVoted: number;
  participationRate: number;
  reputation: 'legend' | 'veteran' | 'expert' | 'trusted' | 'new';
  delegators: number;
  totalVotingPower: number;
  votingHistory: VotingRecord[];
}

export interface VotingRecord {
  proposalId: string;
  vote: 'for' | 'against' | 'abstain';
  votingPower: number;
  timestamp: number;
}

export interface ProposalInfo {
  id: string;
  title: string;
  status: 'active' | 'passed' | 'failed' | 'executing' | 'cancelled';
  votesFor: number;
  votesAgainst: number;
  votesAbstain: number;
  quorum: number;
  endTime: number;
  proposer: string;
}

export interface VotingPowerAnalysis {
  address: string;
  totalVotingPower: number;
  delegators: number;
  votingPowerChange: number;
  historicalPower: { timestamp: number; power: number }[];
  votingDistribution: {
    '0-1k': number;
    '1k-10k': number;
    '10k-100k': number;
    '100k-1M': number;
    '1M+': number;
  };
}

export interface GovernanceParticipation {
  totalParticipants: number;
  activeVoters: number;
  passiveDelegators: number;
  avgParticipationRate: number;
  participationTrend: 'increasing' | 'decreasing' | 'stable';
  participationByChain: { chain: string; rate: number }[];
  participationByDAO: { dao: string; rate: number }[];
  historicalParticipation: { date: string; rate: number }[];
}

export interface CrossChainGovernanceStats {
  totalDAOs: number;
  totalProposals: number;
  totalVoters: number;
  totalVotes: number;
  chains: ChainGovernanceStats[];
  daoComparison: DAOGovernanceStats[];
  crossChainParticipation: {
    dao: string;
    chains: string[];
    totalVotes: number;
  }[];
}

export interface ChainGovernanceStats {
  chain: string;
  daos: number;
  proposals: number;
  voters: number;
  votes: number;
  avgParticipation: number;
}

@Injectable()
export class GovernanceAnalyticsService {
  private readonly SUPPORTED_DAOS = [
    { name: 'Uniswap', chain: 'ethereum', token: 'UNI' },
    { name: 'Aave', chain: 'ethereum', token: 'AAVE' },
    { name: 'Compound', chain: 'ethereum', token: 'COMP' },
    { name: 'MakerDAO', chain: 'ethereum', token: 'MKR' },
    { name: 'Curve', chain: 'ethereum', token: 'CRV' },
    { name: 'Lido', chain: 'ethereum', token: 'LDO' },
    { name: 'ENS', chain: 'ethereum', token: 'ENS' },
    { name: 'Balancer', chain: 'ethereum', token: 'BAL' },
    { name: 'Optimism', chain: 'optimism', token: 'OP' },
    { name: 'Arbitrum', chain: 'arbitrum', token: 'ARB' },
    { name: 'Polygon', chain: 'polygon', token: 'MATIC' },
    { name: 'GMX', chain: 'arbitrum', token: 'GMX' },
    { name: 'Rocket Pool', chain: 'ethereum', token: 'RPL' },
    { name: 'Synthetix', chain: 'ethereum', token: 'SNX' },
    { name: 'Connext', chain: 'ethereum', token: 'NEXT' },
  ];

  private readonly CHAINS = [
    'ethereum',
    'polygon',
    'arbitrum',
    'optimism',
    'base',
    'avalanche',
    'bsc',
  ];

  async getDAOsByChain(chain: string): Promise<DAOGovernanceStats[]> {
    const daos = this.SUPPORTED_DAOS.filter(
      (d) => !chain || d.chain === chain,
    );
    return daos.map((dao) => this.generateDAOStats(dao));
  }

  async getDAOStats(daoName: string): Promise<DAOGovernanceStats> {
    const dao = this.SUPPORTED_DAOS.find(
      (d) => d.name.toLowerCase() === daoName.toLowerCase(),
    );
    if (!dao) {
      throw new Error(`DAO ${daoName} not found`);
    }
    return this.generateDAOStats(dao);
  }

  async getDelegatePerformance(
    daoName: string,
    delegateAddress?: string,
  ): Promise<DelegatePerformance[]> {
    const dao = this.SUPPORTED_DAOS.find(
      (d) => d.name.toLowerCase() === daoName.toLowerCase(),
    );
    if (!dao) {
      throw new Error(`DAO ${daoName} not found`);
    }

    // Generate mock delegate data
    const delegateCount = delegateAddress ? 1 : 15;
    const delegates: DelegatePerformance[] = [];

    for (let i = 0; i < delegateCount; i++) {
      const address = delegateAddress || this.generateAddress(i);
      delegates.push({
        address,
        name: this.generateDelegateName(i),
        votesReceived: Math.floor(Math.random() * 10000000) + 100000,
        proposalsVoted: Math.floor(Math.random() * 50) + 10,
        participationRate: Math.random() * 0.4 + 0.6,
        reputation: this.getRandomReputation(),
        delegators: Math.floor(Math.random() * 100) + 5,
        totalVotingPower: Math.floor(Math.random() * 50000000) + 1000000,
        votingHistory: this.generateVotingHistory(),
      });
    }

    return delegates.sort((a, b) => b.votesReceived - a.votesReceived);
  }

  async getVotingPowerAnalysis(address: string): Promise<VotingPowerAnalysis> {
    const totalVotingPower = Math.floor(Math.random() * 10000000) + 100000;
    const delegators = Math.floor(Math.random() * 50) + 5;

    return {
      address,
      totalVotingPower,
      delegators,
      votingPowerChange: (Math.random() - 0.5) * 20,
      historicalPower: this.generateHistoricalPower(),
      votingDistribution: {
        '0-1k': Math.floor(Math.random() * 30) + 10,
        '1k-10k': Math.floor(Math.random() * 25) + 10,
        '10k-100k': Math.floor(Math.random() * 20) + 5,
        '100k-1M': Math.floor(Math.random() * 15) + 3,
        '1M+': Math.floor(Math.random() * 10) + 1,
      },
    };
  }

  async getGovernanceParticipation(): Promise<GovernanceParticipation> {
    return {
      totalParticipants: Math.floor(Math.random() * 50000) + 10000,
      activeVoters: Math.floor(Math.random() * 20000) + 5000,
      passiveDelegators: Math.floor(Math.random() * 10000) + 2000,
      avgParticipationRate: Math.random() * 0.3 + 0.4,
      participationTrend: ['increasing', 'decreasing', 'stable'][
        Math.floor(Math.random() * 3)
      ] as 'increasing' | 'decreasing' | 'stable',
      participationByChain: this.CHAINS.map((chain) => ({
        chain,
        rate: Math.random() * 0.5 + 0.3,
      })),
      participationByDAO: this.SUPPORTED_DAOS.slice(0, 10).map((dao) => ({
        dao: dao.name,
        rate: Math.random() * 0.4 + 0.4,
      })),
      historicalParticipation: this.generateHistoricalParticipation(),
    };
  }

  async getCrossChainGovernanceStats(): Promise<CrossChainGovernanceStats> {
    const daoStats = await this.getDAOsByChain(undefined);

    return {
      totalDAOs: this.SUPPORTED_DAOS.length,
      totalProposals: daoStats.reduce((sum, d) => sum + d.totalProposals, 0),
      totalVoters: daoStats.reduce((sum, d) => sum + d.totalVoters, 0),
      totalVotes: daoStats.reduce((sum, d) => sum + d.totalVotes, 0),
      chains: this.CHAINS.map((chain) => ({
        chain,
        daos: this.SUPPORTED_DAOS.filter((d) => d.chain === chain).length,
        proposals: Math.floor(Math.random() * 100) + 20,
        voters: Math.floor(Math.random() * 5000) + 1000,
        votes: Math.floor(Math.random() * 50000) + 10000,
        avgParticipation: Math.random() * 0.4 + 0.4,
      })),
      daoComparison: daoStats.slice(0, 10),
      crossChainParticipation: this.SUPPORTED_DAOS.slice(0, 10).map((dao) => ({
        dao: dao.name,
        chains: [dao.chain, this.getRandomOtherChain(dao.chain)],
        totalVotes: Math.floor(Math.random() * 100000) + 10000,
      })),
    };
  }

  async getGovernanceAlerts(daoName?: string): Promise<{
    newProposals: ProposalInfo[];
    endingSoon: ProposalInfo[];
    recentlyPassed: ProposalInfo[];
    recentlyFailed: ProposalInfo[];
  }> {
    const daos = daoName
      ? this.SUPPORTED_DAOS.filter(
          (d) => d.name.toLowerCase() === daoName.toLowerCase(),
        )
      : this.SUPPORTED_DAOS;

    const proposals = daos.flatMap((dao) =>
      this.generateProposals(dao.name, 5),
    );

    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;

    return {
      newProposals: proposals.filter(
        (p) => now - p.endTime > -7 * oneDay && p.status === 'active',
      ),
      endingSoon: proposals.filter(
        (p) =>
          p.status === 'active' &&
          p.endTime - now > 0 &&
          p.endTime - now < oneDay,
      ),
      recentlyPassed: proposals.filter((p) => p.status === 'passed'),
      recentlyFailed: proposals.filter((p) => p.status === 'failed'),
    };
  }

  private generateDAOStats(dao: {
    name: string;
    chain: string;
    token: string;
  }): DAOGovernanceStats {
    const proposals = this.generateProposals(dao.name, 20);
    const activeProposals = proposals.filter((p) => p.status === 'active');
    const passedProposals = proposals.filter((p) => p.status === 'passed');
    const failedProposals = proposals.filter((p) => p.status === 'failed');

    return {
      dao: dao.name,
      chain: dao.chain,
      totalProposals: proposals.length,
      activeProposals: activeProposals.length,
      passedProposals: passedProposals.length,
      failedProposals: failedProposals.length,
      totalVoters: Math.floor(Math.random() * 5000) + 500,
      totalVotes: Math.floor(Math.random() * 100000) + 10000,
      participationRate: Math.random() * 0.4 + 0.4,
      avgVotingPower: Math.floor(Math.random() * 1000000) + 100000,
      topDelegates: this.getDelegatePerformance(dao.name).then((d) => d.slice(0, 5)) as any,
      recentProposals: activeProposals.slice(0, 5),
      governanceScore: Math.floor(Math.random() * 30) + 70,
    };
  }

  private generateProposals(
    daoName: string,
    count: number,
  ): ProposalInfo[] {
    const statuses: ProposalInfo['status'][] = [
      'active',
      'passed',
      'failed',
      'executing',
      'cancelled',
    ];
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;

    return Array.from({ length: count }, (_, i) => {
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const endTime =
        status === 'active'
          ? now + Math.floor(Math.random() * 7 * oneDay)
          : now - Math.floor(Math.random() * 30 * oneDay);

      return {
        id: `${daoName.toLowerCase()}-${1000 + i}`,
        title: this.generateProposalTitle(i),
        status,
        votesFor: Math.floor(Math.random() * 5000000) + 100000,
        votesAgainst: Math.floor(Math.random() * 2000000) + 50000,
        votesAbstain: Math.floor(Math.random() * 500000) + 10000,
        quorum: Math.floor(Math.random() * 4000000) + 4000000,
        endTime,
        proposer: this.generateAddress(i),
      };
    });
  }

  private generateProposalTitle(index: number): string {
    const titles = [
      'Treasury Diversification Proposal',
      'Protocol Fee Adjustment',
      'Risk Parameter Update',
      'New Collateral Onboarding',
      'Governance Reward Distribution',
      'Emergency Funding Request',
      'Partnership with External Protocol',
      'Technical Upgrade Implementation',
      'Community Grant Program',
      'Liquidity Mining Extension',
    ];
    return titles[index % titles.length];
  }

  private generateAddress(index: number): string {
    const chars = '0123456789abcdef';
    let address = '0x';
    for (let i = 0; i < 40; i++) {
      address += chars[Math.floor(Math.random() * chars.length)];
    }
    return address;
  }

  private generateDelegateName(index: number): string {
    const names = [
      'ValidatorDAO',
      'DeFi Master',
      'Yield Farmer Pro',
      'Governance Wizard',
      'Protocol Pioneer',
      'Community Champion',
      'Token Analyst',
      'Liquidity Leader',
      'Staking Expert',
      'Yield Hunter',
      'Alpha Seeker',
      'DAO Defender',
      'Chain Analyst',
      'Token Guardian',
      'Vote Vault',
    ];
    return names[index % names.length];
  }

  private getRandomReputation(): DelegatePerformance['reputation'] {
    const reputations: DelegatePerformance['reputation'][] = [
      'legend',
      'veteran',
      'expert',
      'trusted',
      'new',
    ];
    return reputations[Math.floor(Math.random() * reputations.length)];
  }

  private generateVotingHistory(): VotingRecord[] {
    return Array.from({ length: 10 }, (_, i) => ({
      proposalId: `prop-${1000 + i}`,
      vote: (['for', 'against', 'abstain'] as const)[
        Math.floor(Math.random() * 3)
      ],
      votingPower: Math.floor(Math.random() * 1000000) + 10000,
      timestamp: Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000),
    }));
  }

  private generateHistoricalPower(): { timestamp: number; power: number }[] {
    const data: { timestamp: number; power: number }[] = [];
    const now = Date.now();
    let power = Math.floor(Math.random() * 5000000) + 500000;

    for (let i = 30; i >= 0; i--) {
      power += (Math.random() - 0.5) * 100000;
      power = Math.max(power, 0);
      data.push({
        timestamp: now - i * 24 * 60 * 60 * 1000,
        power: Math.floor(power),
      });
    }
    return data;
  }

  private generateHistoricalParticipation(): { date: string; rate: number }[] {
    const data: { date: string; rate: number }[] = [];
    const now = new Date();

    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      data.push({
        date: date.toISOString().split('T')[0],
        rate: Math.random() * 0.3 + 0.4,
      });
    }
    return data;
  }

  private getRandomOtherChain(currentChain: string): string {
    const otherChains = this.CHAINS.filter((c) => c !== currentChain);
    return otherChains[Math.floor(Math.random() * otherChains.length)];
  }
}
