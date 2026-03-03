import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { DaoDelegation, DaoDelegationHistory, DaoDelegationAlert } from '../entities/dao-delegation.entity';
import { CreateDelegationDto, UpdateDelegationDto, QueryDelegationDto, CreateAlertDto } from '../dto/dao-delegation.dto';

@Injectable()
export class DaoDelegationService implements OnModuleInit {
  private readonly SUPPORTED_DAOS = [
    { name: 'Uniswap', token: 'UNI', chain: 'ethereum', contract: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984' },
    { name: 'Aave', token: 'AAVE', chain: 'ethereum', contract: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9' },
    { name: 'Compound', token: 'COMP', chain: 'ethereum', contract: '0xc00e94Cb662C3520282E6f5717214004A7f26888' },
    { name: 'MakerDAO', token: 'MKR', chain: 'ethereum', contract: '0x9f8F72aA9304c8B593d555F12eF6589cC4A231EC' },
    { name: 'Curve', token: 'CRV', chain: 'ethereum', contract: '0xD533a949740bb3306d119CC777fa900bA034cd52' },
    { name: 'Balancer', token: 'BAL', chain: 'ethereum', contract: '0xba100000625a3754423978a60c9317c58a424e3D' },
    { name: 'Lido', token: 'LDO', chain: 'ethereum', contract: '0x5A98FcBEA4Cf7B856002c6BB0d5e2f95b8F8d8B7' },
    { name: 'ENS', token: 'ENS', chain: 'ethereum', contract: '0xC18360217D8F7Be5d67D5A2e6d6D9D5D5a9B5c5d' },
    { name: 'Optimism', token: 'OP', chain: 'optimism', contract: '0x4200000000000000000000000000000000000042' },
    { name: 'Arbitrum', token: 'ARB', chain: 'arbitrum', contract: '0x912CE59144191C1204E64559FE8253a0e49E6548' },
    { name: 'Polygon', token: 'MATIC', chain: 'polygon', contract: '0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeeb0' },
    { name: 'GMX', token: 'GMX', chain: 'arbitrum', contract: '0xfc5A1A6EB076a2C7adD06eD22CC90b7d7735C4d' },
    { name: 'Rocket Pool', token: 'RPL', chain: 'ethereum', contract: '0xB3d7C74a1D76E3C8d64a3b2F7C8b8D8c8b8D8c8' },
    { name: 'Synthetix', token: 'SNX', chain: 'ethereum', contract: '0xC011a73ee8576Fb46F5E1c5751cA3B9Fe0af2a6F' },
    { name: 'Connext', token: 'NEXT', chain: 'ethereum', contract: '0x11984dc4465481512eb5b777E44061C158CF6a9' },
  ];

  constructor(
    @InjectRepository(DaoDelegation)
    private delegationRepo: Repository<DaoDelegation>,
    @InjectRepository(DaoDelegationHistory)
    private historyRepo: Repository<DaoDelegationHistory>,
    @InjectRepository(DaoDelegationAlert)
    private alertRepo: Repository<DaoDelegationAlert>,
    private httpService: HttpService,
  ) {}

  async onModuleInit() {
    // Create tables if they don't exist
    try {
      await this.delegationRepo.query(`
        CREATE TABLE IF NOT EXISTS dao_delegations (
          id SERIAL PRIMARY KEY,
          "userId" VARCHAR(255),
          "walletAddress" VARCHAR(255) NOT NULL,
          "daoName" VARCHAR(255) NOT NULL,
          "tokenSymbol" VARCHAR(50) NOT NULL,
          "delegateAddress" VARCHAR(255),
          "votingPower" DECIMAL(30, 0) DEFAULT 0,
          status VARCHAR(50) DEFAULT 'active',
          chain VARCHAR(50),
          "delegationDate" TIMESTAMP,
          "lastUpdated" TIMESTAMP,
          notes TEXT,
          "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      await this.historyRepo.query(`
        CREATE TABLE IF NOT EXISTS dao_delegation_history (
          id SERIAL PRIMARY KEY,
          "walletAddress" VARCHAR(255) NOT NULL,
          "daoName" VARCHAR(255) NOT NULL,
          "tokenSymbol" VARCHAR(50) NOT NULL,
          "fromDelegate" VARCHAR(255),
          "toDelegate" VARCHAR(255),
          "votingPower" DECIMAL(30, 0) DEFAULT 0,
          action VARCHAR(50),
          chain VARCHAR(50),
          timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          "txHash" VARCHAR(255)
        )
      `);

      await this.alertRepo.query(`
        CREATE TABLE IF NOT EXISTS dao_delegation_alerts (
          id SERIAL PRIMARY KEY,
          "userId" VARCHAR(255),
          "walletAddress" VARCHAR(255) NOT NULL,
          "daoName" VARCHAR(255) NOT NULL,
          "alertType" VARCHAR(100) NOT NULL,
          condition VARCHAR(50) NOT NULL,
          threshold DECIMAL(30, 0),
          enabled BOOLEAN DEFAULT true,
          "webhookUrl" VARCHAR(500),
          email VARCHAR(255),
          "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
    } catch (e) {
      console.log('Tables may already exist:', e.message);
    }
  }

  async createDelegation(dto: CreateDelegationDto): Promise<DaoDelegation> {
    const dao = this.SUPPORTED_DAOS.find(d => d.name === dto.daoName);
    
    const delegation = this.delegationRepo.create({
      ...dto,
      chain: dto.chain || dao?.chain || 'ethereum',
      tokenSymbol: dto.tokenSymbol || dao?.token || 'TOKEN',
      status: 'active',
      delegationDate: new Date(),
      lastUpdated: new Date(),
    });

    return this.delegationRepo.save(delegation);
  }

  async updateDelegation(dto: UpdateDelegationDto): Promise<DaoDelegation> {
    const delegation = await this.delegationRepo.findOne({ where: { id: dto.id } });
    if (!delegation) {
      throw new Error('Delegation not found');
    }

    const oldDelegate = delegation.delegateAddress;
    Object.assign(delegation, dto);
    delegation.lastUpdated = new Date();

    // Record history
    if (dto.delegateAddress && dto.delegateAddress !== oldDelegate) {
      await this.historyRepo.save({
        walletAddress: delegation.walletAddress,
        daoName: delegation.daoName,
        tokenSymbol: delegation.tokenSymbol,
        fromDelegate: oldDelegate || 'none',
        toDelegate: dto.delegateAddress,
        votingPower: delegation.votingPower,
        action: dto.status === 'revoked' ? 'revoke' : 'redelegate',
        chain: delegation.chain,
        timestamp: new Date(),
      });
    }

    return this.delegationRepo.save(delegation);
  }

  async getDelegations(query: QueryDelegationDto): Promise<{ data: DaoDelegation[]; total: number }> {
    const { page = 1, pageSize = 20, ...filters } = query;
    const where: any = {};
    
    if (filters.walletAddress) where.walletAddress = filters.walletAddress;
    if (filters.daoName) where.daoName = filters.daoName;
    if (filters.status) where.status = filters.status;
    if (filters.chain) where.chain = filters.chain;

    const [data, total] = await this.delegationRepo.findAndCount({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      order: { lastUpdated: 'DESC' },
    });

    return { data, total };
  }

  async getDelegationById(id: number): Promise<DaoDelegation> {
    return this.delegationRepo.findOne({ where: { id } });
  }

  async deleteDelegation(id: number): Promise<void> {
    await this.delegationRepo.delete(id);
  }

  async getDelegationHistory(walletAddress: string, daoName?: string): Promise<DaoDelegationHistory[]> {
    const where: any = { walletAddress };
    if (daoName) where.daoName = daoName;

    return this.historyRepo.find({
      where,
      order: { timestamp: 'DESC' },
      take: 100,
    });
  }

  async getSupportedDaos() {
    return this.SUPPORTED_DAOS;
  }

  async getDaoStats(daoName: string): Promise<any> {
    const delegations = await this.delegationRepo.find({ where: { daoName } });
    
    const totalDelegators = new Set(delegations.map(d => d.walletAddress)).size;
    const totalDelegatedPower = delegations.reduce((sum, d) => sum + parseFloat(d.votingPower || '0'), 0);
    const activeDelegations = delegations.filter(d => d.status === 'active').length;
    const revokedDelegations = delegations.filter(d => d.status === 'revoked').length;

    return {
      daoName,
      totalDelegators,
      totalDelegatedPower,
      activeDelegations,
      revokedDelegations,
    };
  }

  // Create alert for delegation changes
  async createAlert(dto: CreateAlertDto): Promise<DaoDelegationAlert> {
    const alert = this.alertRepo.create({
      ...dto,
      enabled: true,
    });
    return this.alertRepo.save(alert);
  }

  async getAlerts(walletAddress?: string): Promise<DaoDelegationAlert[]> {
    const where: any = {};
    if (walletAddress) where.walletAddress = walletAddress;
    return this.alertRepo.find({ where });
  }

  async updateAlert(id: number, enabled: boolean): Promise<DaoDelegationAlert> {
    const alert = await this.alertRepo.findOne({ where: { id } });
    if (!alert) {
      throw new Error('Alert not found');
    }
    alert.enabled = enabled;
    return this.alertRepo.save(alert);
  }

  async deleteAlert(id: number): Promise<void> {
    await this.alertRepo.delete(id);
  }

  // Fetch real delegation data from chain (simulated)
  async fetchChainDelegation(walletAddress: string, daoName: string): Promise<any> {
    const dao = this.SUPPORTED_DAOS.find(d => d.name === daoName);
    if (!dao) {
      throw new Error('Unsupported DAO');
    }

    // Simulate fetching delegation data from blockchain
    // In production, this would query the actual blockchain
    const mockVotingPower = Math.floor(Math.random() * 1000000);
    
    return {
      walletAddress,
      daoName: dao.name,
      tokenSymbol: dao.token,
      chain: dao.chain,
      delegateAddress: walletAddress, // Self-delegated by default
      votingPower: mockVotingPower.toString(),
      totalSupply: '1000000000',
      delegatorsCount: Math.floor(Math.random() * 5000),
      lastCheckpoint: new Date().toISOString(),
    };
  }

  // Compare delegation options
  async compareDelegates(daoName: string, addresses: string[]): Promise<any[]> {
    const results = [];
    
    for (const address of addresses) {
      results.push({
        address,
        votingPower: Math.floor(Math.random() * 100000).toString(),
        delegatorsCount: Math.floor(Math.random() * 100),
        proposalsVoted: Math.floor(Math.random() * 50),
        participationRate: (Math.random() * 100).toFixed(2),
        lastActive: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      });
    }

    return results.sort((a, b) => parseFloat(b.votingPower) - parseFloat(a.votingPower));
  }

  // Get delegation recommendations
  async getDelegationRecommendations(walletAddress: string, daoName: string): Promise<any[]> {
    // Generate mock recommendations based on top delegates
    const topDelegates = [
      { address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0fC31', name: 'Wintermute', votingPower: '2500000', reputation: 95 },
      { address: '0x8ba1f109551bD432803012645Ac136ddd64DBA72', name: 'Dragonfly Capital', votingPower: '1800000', reputation: 92 },
      { address: '0xA7fD7569E211C05553deE6E618796496a654cF8B', name: 'Paradigm', votingPower: '1500000', reputation: 90 },
      { address: '0x3e0c2F3dA4B8b5d6F7a8B9c0D1E2F3A4B5C6D7E8', name: 'Community Delegate 1', votingPower: '800000', reputation: 85 },
      { address: '0x9a1c2D3e4F5g6H7i8J9k0L1m2N3o4P5Q6R7S8T9', name: 'Community Delegate 2', votingPower: '500000', reputation: 80 },
    ];

    return topDelegates;
  }
}
