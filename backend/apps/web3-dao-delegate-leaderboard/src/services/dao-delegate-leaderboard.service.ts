import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { firstValueFrom } from 'rxjs';
import { DaoDelegateLeaderboard, DaoDelegateAlert } from '../entities/dao-delegate-leaderboard.entity';
import { QueryLeaderboardDto, QueryDelegateDto, CreateAlertDto } from '../dto/dao-delegate-leaderboard.dto';

@Injectable()
export class DaoDelegateLeaderboardService {
  private readonly SUPPORTED_DAOS = [
    { name: 'Uniswap', chain: 'ethereum', tokenSymbol: 'UNI', governanceChain: 'ethereum' },
    { name: 'Aave', chain: 'ethereum', tokenSymbol: 'AAVE', governanceChain: 'ethereum' },
    { name: 'Compound', chain: 'ethereum', tokenSymbol: 'COMP', governanceChain: 'ethereum' },
    { name: 'MakerDAO', chain: 'ethereum', tokenSymbol: 'MKR', governanceChain: 'ethereum' },
    { name: 'Curve', chain: 'ethereum', tokenSymbol: 'CRV', governanceChain: 'ethereum' },
    { name: 'Balancer', chain: 'ethereum', tokenSymbol: 'BAL', governanceChain: 'ethereum' },
    { name: 'Lido', chain: 'ethereum', tokenSymbol: 'LDO', governanceChain: 'ethereum' },
    { name: 'ENS', chain: 'ethereum', tokenSymbol: 'ENS', governanceChain: 'ethereum' },
    { name: 'Optimism', chain: 'optimism', tokenSymbol: 'OP', governanceChain: 'optimism' },
    { name: 'Arbitrum', chain: 'arbitrum', tokenSymbol: 'ARB', governanceChain: 'arbitrum' },
    { name: 'Polygon', chain: 'polygon', tokenSymbol: 'MATIC', governanceChain: 'polygon' },
    { name: 'GMX', chain: 'arbitrum', tokenSymbol: 'GMX', governanceChain: 'arbitrum' },
    { name: 'Rocket Pool', chain: 'ethereum', tokenSymbol: 'RPL', governanceChain: 'ethereum' },
    { name: 'Synthetix', chain: 'ethereum', tokenSymbol: 'SNX', governanceChain: 'ethereum' },
    { name: 'Connext', chain: 'ethereum', tokenSymbol: 'NEXT', governanceChain: 'ethereum' },
  ];

  constructor(
    @InjectRepository(DaoDelegateLeaderboard)
    private readonly leaderboardRepo: Repository<DaoDelegateLeaderboard>,
    @InjectRepository(DaoDelegateAlert)
    private readonly alertRepo: Repository<DaoDelegateAlert>,
    private readonly httpService: HttpService,
  ) {}

  async getLeaderboard(query: QueryLeaderboardDto) {
    const { daoName, chain, sortBy = 'votingPower', sortOrder = 'desc', limit = 50, offset = 0 } = query;

    const qb = this.leaderboardRepo.createQueryBuilder('delegate');

    if (daoName) {
      qb.andWhere('delegate.daoName = :daoName', { daoName });
    }
    if (chain) {
      qb.andWhere('delegate.chain = :chain', { chain });
    }

    const sortField = {
      votingPower: 'delegate.votingPower',
      delegators: 'delegate.delegatorsCount',
      participation: 'delegate.participationRate',
      reputation: 'delegate.reputationScore',
    }[sortBy] || 'delegate.votingPower';

    qb.orderBy(sortField, sortOrder === 'asc' ? 'ASC' : 'DESC')
      .skip(offset)
      .take(limit);

    const [delegates, total] = await qb.getManyAndCount();

    // Get top 3 for each DAO
    const topDelegates = await this.getTopDelegatesPerDao();

    return {
      success: true,
      data: delegates,
      pagination: { total, limit, offset },
      topDelegates,
    };
  }

  private async getTopDelegatesPerDao() {
    const result = {};
    for (const dao of this.SUPPORTED_DAOS) {
      const top = await this.leaderboardRepo.find({
        where: { daoName: dao.name },
        order: { votingPower: 'DESC' },
        take: 3,
      });
      result[dao.name] = top;
    }
    return result;
  }

  async getDelegateDetails(walletAddress: string, daoName?: string) {
    const query: any = { walletAddress: walletAddress.toLowerCase() };
    if (daoName) {
      query.daoName = daoName;
    }

    const delegates = await this.leaderboardRepo.find({ where: query });

    if (delegates.length === 0) {
      // Try to fetch from chain
      if (daoName) {
        await this.fetchAndSaveDelegateData(walletAddress, daoName);
        const updated = await this.leaderboardRepo.find({ where: { walletAddress: walletAddress.toLowerCase(), daoName } });
        if (updated.length > 0) {
          return { success: true, data: updated[0] };
        }
      }
      throw new HttpException('Delegate not found', HttpStatus.NOT_FOUND);
    }

    // Get related delegates (similar voting power)
    const mainDelegate = delegates[0];
    const related = await this.leaderboardRepo
      .createQueryBuilder('delegate')
      .where('delegate.daoName = :daoName', { daoName: mainDelegate.daoName })
      .andWhere('delegate.id != :id', { id: mainDelegate.id })
      .orderBy('ABS(delegate.votingPower - :vp)', 'ASC')
      .setParameter('vp', mainDelegate.votingPower)
      .take(5)
      .getMany();

    return {
      success: true,
      data: mainDelegate,
      relatedDelegates: related,
    };
  }

  async getDaos() {
    return {
      success: true,
      data: this.SUPPORTED_DAOS,
    };
  }

  async getDaoLeaderboardStats(daoName: string) {
    const dao = this.SUPPORTED_DAOS.find(d => d.name === daoName);
    if (!dao) {
      throw new HttpException('DAO not supported', HttpStatus.BAD_REQUEST);
    }

    const stats = await this.leaderboardRepo
      .createQueryBuilder('delegate')
      .select('COUNT(*)', 'totalDelegates')
      .addSelect('SUM(delegate.votingPower)', 'totalVotingPower')
      .addSelect('AVG(delegate.participationRate)', 'avgParticipation')
      .addSelect('AVG(delegate.reputationScore)', 'avgReputation')
      .where('delegate.daoName = :daoName', { daoName })
      .getRawOne();

    const topHolder = await this.leaderboardRepo.findOne({
      where: { daoName },
      order: { votingPower: 'DESC' },
    });

    const mostActive = await this.leaderboardRepo.findOne({
      where: { daoName },
      order: { participationRate: 'DESC' },
    });

    return {
      success: true,
      data: {
        dao: dao,
        totalDelegates: parseInt(stats.totalDelegates) || 0,
        totalVotingPower: stats.totalVotingPower || '0',
        avgParticipation: parseFloat(stats.avgParticipation) || 0,
        avgReputation: parseFloat(stats.avgReputation) || 0,
        topHolder,
        mostActive,
      },
    };
  }

  async getDelegateComparison(daoName: string, addresses: string[]) {
    const delegates = await this.leaderboardRepo.find({
      where: addresses.map(addr => ({ walletAddress: addr.toLowerCase(), daoName })),
    });

    const comparison = delegates.map(d => ({
      walletAddress: d.walletAddress,
      votingPower: d.votingPower,
      delegatorsCount: d.delegatorsCount,
      participationRate: d.participationRate,
      reputationScore: d.reputationScore,
      reputationLevel: d.reputationLevel,
    }));

    // Sort by voting power
    comparison.sort((a, b) => parseFloat(b.votingPower) - parseFloat(a.votingPower));

    return {
      success: true,
      data: comparison,
    };
  }

  async getDelegateSearch(query: string) {
    const delegates = await this.leaderboardRepo
      .createQueryBuilder('delegate')
      .where('LOWER(delegate.walletAddress) LIKE :query', { query: `%${query.toLowerCase()}%` })
      .orWhere('LOWER(delegate.delegateInfo->>"$.name") LIKE :query', { query: `%${query.toLowerCase()}%` })
      .take(20)
      .getMany();

    return {
      success: true,
      data: delegates,
    };
  }

  async getTrendingDelegates(daoName?: string, limit = 10) {
    const qb = this.leaderboardRepo.createQueryBuilder('delegate');

    if (daoName) {
      qb.where('delegate.daoName = :daoName', { daoName });
    }

    // Sort by recent activity (delegators count growth proxy)
    qb.orderBy('delegate.updatedAt', 'DESC').take(limit);

    const delegates = await qb.getMany();

    return {
      success: true,
      data: delegates,
    };
  }

  // Alerts
  async createAlert(dto: CreateAlertDto) {
    const alert = this.alertRepo.create({
      ...dto,
      walletAddress: dto.walletAddress.toLowerCase(),
    });
    return this.alertRepo.save(alert);
  }

  async getAlerts(walletAddress?: string) {
    const where = walletAddress ? { walletAddress: walletAddress.toLowerCase() } : {};
    return this.alertRepo.find({ where, order: { createdAt: 'DESC' } });
  }

  async updateAlert(id: number, updates: { enabled?: boolean; threshold?: number }) {
    await this.alertRepo.update(id, updates);
    return this.alertRepo.findOne({ where: { id } });
  }

  async deleteAlert(id: number) {
    return this.alertRepo.delete(id);
  }

  // Fetch from chain and save
  private async fetchAndSaveDelegateData(walletAddress: string, daoName: string) {
    const dao = this.SUPPORTED_DAOS.find(d => d.name === daoName);
    if (!dao) return null;

    try {
      // Simulate fetching delegate data from blockchain
      const mockData = await this.fetchMockDelegateData(walletAddress, dao);

      const delegate = this.leaderboardRepo.create({
        walletAddress: walletAddress.toLowerCase(),
        daoName,
        chain: dao.chain,
        ...mockData,
      });

      return this.leaderboardRepo.save(delegate);
    } catch (error) {
      console.error(`Failed to fetch delegate data for ${walletAddress}:`, error);
      return null;
    }
  }

  private async fetchMockDelegateData(walletAddress: string, dao: any) {
    // Generate realistic mock data based on wallet address hash
    const hash = this.hashCode(walletAddress);
    const votingPower = Math.abs(hash % 1000000) + 1000;
    const delegatorsCount = Math.abs(hash % 100) + 1;
    const participationRate = 50 + Math.abs(hash % 50);
    const proposalSupportRate = 40 + Math.abs(hash % 60);
    const proposalsVoted = Math.abs(hash % 200) + 10;
    const votesCast = proposalsVoted * (Math.abs(hash % 5) + 1);

    const reputationScore = (participationRate * 0.4) + (proposalSupportRate * 0.3) + (delegatorsCount * 0.3);
    const reputationLevel = this.getReputationLevel(reputationScore);

    return {
      votingPower: votingPower.toString(),
      delegatorsCount,
      participationRate,
      proposalSupportRate,
      proposalsVoted,
      votesCast,
      reputationScore,
      reputationLevel,
      lastActiveAt: new Date(Date.now() - Math.abs(hash % 30) * 24 * 60 * 60 * 1000),
      firstDelegatedAt: new Date(Date.now() - Math.abs(hash % 365) * 24 * 60 * 60 * 1000),
      recentVotes: this.generateMockVotes(proposalsVoted),
      delegateInfo: {
        name: `Delegate_${walletAddress.slice(2, 8)}`,
        bio: null,
        twitter: null,
        email: null,
      },
    };
  }

  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash;
  }

  private getReputationLevel(score: number): string {
    if (score >= 80) return 'legend';
    if (score >= 65) return 'veteran';
    if (score >= 50) return 'expert';
    if (score >= 35) return 'trusted';
    return 'new';
  }

  private generateMockVotes(count: number) {
    const proposals = [];
    for (let i = 0; i < Math.min(count, 10); i++) {
      proposals.push({
        proposalId: `prop-${1000 + i}`,
        vote: Math.random() > 0.5 ? 'FOR' : 'AGAINST',
        reason: null,
      });
    }
    return proposals;
  }

  async refreshLeaderboard(daoName?: string) {
    const daos = daoName ? [this.SUPPORTED_DAOS.find(d => d.name === daoName)] : this.SUPPORTED_DAOS;
    const results = [];

    for (const dao of daos) {
      if (!dao) continue;

      // Simulate fetching top delegates from API
      const mockDelegates = this.generateMockDelegates(dao, 20);

      for (const delegate of mockDelegates) {
        const existing = await this.leaderboardRepo.findOne({
          where: { walletAddress: delegate.walletAddress, daoName: dao.name },
        });

        if (existing) {
          await this.leaderboardRepo.update(existing.id, delegate);
        } else {
          await this.leaderboardRepo.save(delegate);
        }
      }

      results.push({ dao: dao.name, updated: mockDelegates.length });
    }

    return {
      success: true,
      data: results,
    };
  }

  private generateMockDelegates(dao: any, count: number) {
    const delegates = [];
    for (let i = 0; i < count; i++) {
      const hash = (dao.name.length * 1000 + i * 137);
      const votingPower = (count - i) * 10000 + Math.abs(hash % 5000);
      const delegatorsCount = Math.abs(hash % 50) + 1;
      const participationRate = 50 + Math.abs(hash % 50);
      const proposalSupportRate = 40 + Math.abs(hash % 60);
      const reputationScore = (participationRate * 0.4) + (proposalSupportRate * 0.3) + (delegatorsCount * 0.3);

      delegates.push({
        walletAddress: `0x${Math.abs(hash).toString(16).padStart(40, '0')}`,
        daoName: dao.name,
        chain: dao.chain,
        votingPower: votingPower.toString(),
        delegatorsCount,
        participationRate,
        proposalSupportRate,
        proposalsVoted: Math.abs(hash % 200) + 10,
        votesCast: Math.abs(hash % 500) + 20,
        reputationScore,
        reputationLevel: this.getReputationLevel(reputationScore),
        lastActiveAt: new Date(Date.now() - Math.abs(hash % 30) * 24 * 60 * 60 * 1000),
        firstDelegatedAt: new Date(Date.now() - Math.abs(hash % 365) * 24 * 60 * 60 * 1000),
        recentVotes: this.generateMockVotes(10),
        delegateInfo: {
          name: `Delegate_${Math.abs(hash).toString(16).slice(0, 6)}`,
          bio: null,
          twitter: null,
        },
      });
    }

    return delegates;
  }
}
