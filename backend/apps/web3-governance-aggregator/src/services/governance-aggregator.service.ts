import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GovernanceAggregator, GovernanceDelegate, GovernanceStats } from './entities/governance-aggregator.entity';

@Injectable()
export class GovernanceAggregatorService {
  constructor(
    @InjectRepository(GovernanceAggregator)
    private proposalRepo: Repository<GovernanceAggregator>,
    @InjectRepository(GovernanceDelegate)
    private delegateRepo: Repository<GovernanceDelegate>,
    @InjectRepository(GovernanceStats)
    private statsRepo: Repository<GovernanceStats>,
  ) {}

  // Get cross-chain governance overview
  async getOverview() {
    const chains = ['Ethereum', 'Arbitrum', 'Optimism', 'Polygon', 'Base', 'Avalanche'];
    const overview = [];

    for (const chain of chains) {
      const stats = await this.statsRepo.findOne({ where: { chain } });
      const activeProposals = await this.proposalRepo.count({ where: { chain, status: 'active' } });
      
      overview.push({
        chain,
        totalProposals: stats?.totalProposals || 0,
        activeProposals: activeProposals,
        totalDelegates: stats?.totalDelegates || 0,
        avgParticipation: stats?.avgParticipation || 0,
      });
    }

    return overview;
  }

  // Get all proposals with filtering
  async getProposals(params: {
    chain?: string;
    dao?: string;
    status?: string;
    category?: string;
    limit?: number;
    offset?: number;
  }) {
    const query = this.proposalRepo.createQueryBuilder('proposal');

    if (params.chain) query.andWhere('proposal.chain = :chain', { chain: params.chain });
    if (params.dao) query.andWhere('proposal.daoName = :dao', { dao: params.dao });
    if (params.status) query.andWhere('proposal.status = :status', { status: params.status });
    if (params.category) query.andWhere('proposal.category = :category', { category: params.category });

    query.orderBy('proposal.startTime', 'DESC')
      .skip(params.offset || 0)
      .take(params.limit || 20);

    const [proposals, total] = await query.getManyAndCount();

    return { proposals, total };
  }

  // Get delegates with ranking
  async getDelegates(params: {
    chain?: string;
    dao?: string;
    sortBy?: string;
    limit?: number;
    offset?: number;
  }) {
    const query = this.delegateRepo.createQueryBuilder('delegate');

    if (params.chain) query.andWhere('delegate.chain = :chain', { chain: params.chain });
    if (params.dao) query.andWhere('delegate.daoName = :dao', { dao: params.dao });

    if (params.sortBy === 'votingPower') {
      query.orderBy('delegate.votingPower', 'DESC');
    } else if (params.sortBy === 'delegators') {
      query.orderBy('delegate.delegatorsCount', 'DESC');
    } else if (params.sortBy === 'participation') {
      query.orderBy('delegate.participationRate', 'DESC');
    } else {
      query.orderBy('delegate.votingPower', 'DESC');
    }

    query.skip(params.offset || 0).take(params.limit || 20);

    const [delegates, total] = await query.getManyAndCount();

    return { delegates, total };
  }

  // Get proposal details
  async getProposalDetails(id: number) {
    return this.proposalRepo.findOne({ where: { id } });
  }

  // Get delegate details
  async getDelegateDetails(address: string, chain?: string) {
    const query = this.delegateRepo.createQueryBuilder('delegate')
      .where('delegate.address = :address', { address });
    
    if (chain) {
      query.andWhere('delegate.chain = :chain', { chain });
    }

    return query.getMany();
  }

  // Get supported DAOs
  async getSupportedDaos() {
    const daos = [
      { name: 'Uniswap', chain: 'Ethereum', logo: '🦄' },
      { name: 'Aave', chain: 'Ethereum', logo: '👻' },
      { name: 'Compound', chain: 'Ethereum', logo: '🏦' },
      { name: 'MakerDAO', chain: 'Ethereum', logo: '🎩' },
      { name: 'Curve', chain: 'Ethereum', logo: '📈' },
      { name: 'Balancer', chain: 'Ethereum', logo: '⚖️' },
      { name: 'Lido', chain: 'Ethereum', logo: '💧' },
      { name: 'ENS', chain: 'Ethereum', logo: '🔤' },
      { name: 'Optimism', chain: 'Optimism', logo: '🚀' },
      { name: 'Arbitrum', chain: 'Arbitrum', logo: '🔵' },
      { name: 'Polygon', chain: 'Polygon', logo: '🟣' },
      { name: 'GMX', chain: 'Arbitrum', logo: '🦊' },
      { name: 'Rocket Pool', chain: 'Ethereum', logo: '🚀' },
      { name: 'Synthetix', chain: 'Ethereum', logo: '⚡' },
      { name: 'Connext', chain: 'Ethereum', logo: '🔗' },
    ];

    return daos;
  }

  // Get governance stats by chain
  async getChainStats(chain: string) {
    const stats = await this.statsRepo.find({ where: { chain } });
    return stats;
  }

  // Search proposals
  async searchProposals(query: string) {
    return this.proposalRepo
      .createQueryBuilder('proposal')
      .where('proposal.title ILIKE :query', { query: `%${query}%` })
      .orWhere('proposal.description ILIKE :query', { query: `%${query}%` })
      .orderBy('proposal.startTime', 'DESC')
      .take(10)
      .getMany();
  }

  // Get trending proposals (most participation)
  async getTrendingProposals(limit: number = 10) {
    return this.proposalRepo
      .createQueryBuilder('proposal')
      .where('proposal.status = :status', { status: 'active' })
      .orderBy('proposal.totalVoters', 'DESC')
      .take(limit)
      .getMany();
  }

  // Get upcoming proposals
  async getUpcomingProposals(limit: number = 10) {
    const now = new Date();
    return this.proposalRepo
      .createQueryBuilder('proposal')
      .where('proposal.startTime > :now', { now })
      .orderBy('proposal.startTime', 'ASC')
      .take(limit)
      .getMany();
  }

  // Get recent proposals
  async getRecentProposals(limit: number = 10) {
    return this.proposalRepo
      .createQueryBuilder('proposal')
      .where('proposal.status IN (:...statuses)', { statuses: ['passed', 'failed', 'executed'] })
      .orderBy('proposal.endTime', 'DESC')
      .take(limit)
      .getMany();
  }

  // Generate mock data for demo
  async generateMockData() {
    const chains = ['Ethereum', 'Arbitrum', 'Optimism', 'Polygon', 'Base'];
    const daoNames = ['Uniswap', 'Aave', 'Compound', 'MakerDAO', 'Curve', 'Balancer', 'Lido', 'ENS', 'Optimism', 'Arbitrum'];
    const statuses = ['active', 'passed', 'failed', 'executed', 'canceled'];
    const categories = ['Treasury', 'Protocol Upgrade', 'Risk Parameters', 'Grants', 'Governance', 'Rates'];

    // Generate proposals
    for (let i = 0; i < 50; i++) {
      const chain = chains[Math.floor(Math.random() * chains.length)];
      const dao = daoNames[Math.floor(Math.random() * daoNames.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const category = categories[Math.floor(Math.random() * categories.length)];

      const proposal = this.proposalRepo.create({
        daoName: dao,
        chain,
        proposalId: `${i + 1}`,
        title: `${dao} ${category} Proposal #${i + 1}`,
        description: `This proposal aims to ${category.toLowerCase()} for ${dao}. Please review and vote accordingly.`,
        status,
        forVotes: Math.floor(Math.random() * 1000000) + 100000,
        againstVotes: Math.floor(Math.random() * 500000),
        abstainVotes: Math.floor(Math.random() * 100000),
        startTime: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        endTime: new Date(Date.now() + Math.random() * 14 * 24 * 60 * 60 * 1000),
        proposer: `0x${Math.random().toString(16).substr(2, 40)}`,
        totalVoters: Math.floor(Math.random() * 500) + 50,
        voterTurnout: Math.random() * 30 + 5,
        category,
      });

      await this.proposalRepo.save(proposal);
    }

    // Generate delegates
    for (let i = 0; i < 30; i++) {
      const chain = chains[Math.floor(Math.random() * chains.length)];
      const dao = daoNames[Math.floor(Math.random() * daoNames.length)];
      const reputations = ['legend', 'veteran', 'expert', 'trusted', 'new'];
      const reputation = reputations[Math.floor(Math.random() * reputations.length)];

      const delegate = this.delegateRepo.create({
        address: `0x${Math.random().toString(16).substr(2, 40)}`,
        daoName: dao,
        chain,
        votingPower: Math.floor(Math.random() * 100000) + 10000,
        delegatorsCount: Math.floor(Math.random() * 100) + 10,
        reputation,
        proposalsParticipated: Math.floor(Math.random() * 50) + 10,
        proposalsVoted: Math.floor(Math.random() * 40) + 5,
        participationRate: Math.random() * 40 + 60,
        delegateSince: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
      });

      await this.delegateRepo.save(delegate);
    }

    // Generate stats
    for (const chain of chains) {
      for (const dao of daoNames.slice(0, 5)) {
        const stats = this.statsRepo.create({
          chain,
          daoName: dao,
          totalProposals: Math.floor(Math.random() * 100) + 20,
          activeProposals: Math.floor(Math.random() * 10),
          totalDelegates: Math.floor(Math.random() * 200) + 50,
          totalVotingPower: Math.floor(Math.random() * 10000000) + 1000000,
          avgParticipation: Math.random() * 30 + 40,
        });

        await this.statsRepo.save(stats);
      }
    }

    return { message: 'Mock data generated successfully' };
  }
}
