import { Injectable } from '@nestjs/common';

export interface AutoCompoundSchedule {
  id: string;
  userId: string;
  name: string;
  protocol: string;
  chainId: number;
  chainName: string;
  poolAddress: string;
  token0: string;
  token1: string;
  positionValue: string;
  estimatedApy: string;
  compoundFrequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  nextExecutionTime: string;
  lastExecutionTime?: string;
  status: 'active' | 'paused' | 'completed' | 'failed';
  autoCompound: boolean;
  gasPrice: string;
  slippageTolerance: number;
  createdAt: string;
  updatedAt: string;
}

export interface CompoundExecution {
  id: string;
  scheduleId: string;
  executedAt: string;
  status: 'success' | 'failed' | 'pending';
  txHash?: string;
  gasUsed?: string;
  gasFee?: string;
  rewardsClaimed: string;
  rewardsReinvested: string;
  newPositionValue: string;
  error?: string;
}

export interface CreateScheduleDto {
  name: string;
  protocol: string;
  chainId: number;
  poolAddress: string;
  compoundFrequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  autoCompound: boolean;
  gasPrice?: string;
  slippageTolerance?: number;
}

@Injectable()
export class AutoCompoundService {
  private schedules: Map<string, AutoCompoundSchedule> = new Map();
  private executions: Map<string, CompoundExecution[]> = new Map();

  constructor() {
    // Initialize with sample data
    this.initializeSampleData();
  }

  private initializeSampleData() {
    const sampleSchedules: AutoCompoundSchedule[] = [
      {
        id: 'schedule-001',
        userId: 'user-001',
        name: 'ETH-USDC LP Compound',
        protocol: 'Uniswap V3',
        chainId: 1,
        chainName: 'Ethereum',
        poolAddress: '0x8ad599c3A0ff1De082011EFDDc58f1908eb6e6C8',
        token0: 'ETH',
        token1: 'USDC',
        positionValue: '12500.00',
        estimatedApy: '24.5',
        compoundFrequency: 'daily',
        nextExecutionTime: '2026-03-04T08:00:00Z',
        lastExecutionTime: '2026-03-03T08:00:00Z',
        status: 'active',
        autoCompound: true,
        gasPrice: '35',
        slippageTolerance: 0.5,
        createdAt: '2026-02-15T10:00:00Z',
        updatedAt: '2026-03-03T08:00:00Z',
      },
      {
        id: 'schedule-002',
        userId: 'user-001',
        name: 'WBTC-WETH Pool',
        protocol: 'Curve',
        chainId: 1,
        chainName: 'Ethereum',
        poolAddress: '0xA5407eAE9Ba41422680e2e00537571bcC53efBfD',
        token0: 'WBTC',
        token1: 'WETH',
        positionValue: '8500.00',
        estimatedApy: '12.3',
        compoundFrequency: 'weekly',
        nextExecutionTime: '2026-03-10T12:00:00Z',
        lastExecutionTime: '2026-03-03T12:00:00Z',
        status: 'active',
        autoCompound: true,
        gasPrice: '30',
        slippageTolerance: 0.3,
        createdAt: '2026-02-20T14:00:00Z',
        updatedAt: '2026-03-03T12:00:00Z',
      },
      {
        id: 'schedule-003',
        userId: 'user-001',
        name: 'ARB-USDC Farm',
        protocol: 'Camelot',
        chainId: 42161,
        chainName: 'Arbitrum',
        poolAddress: '0x1e6aE537f8d7aA4a39F4f2d5E2d4d5F8d6E7A8B9',
        token0: 'ARB',
        token1: 'USDC',
        positionValue: '5200.00',
        estimatedApy: '45.2',
        compoundFrequency: 'daily',
        nextExecutionTime: '2026-03-04T06:00:00Z',
        lastExecutionTime: '2026-03-03T06:00:00Z',
        status: 'active',
        autoCompound: true,
        gasPrice: '0.15',
        slippageTolerance: 1.0,
        createdAt: '2026-02-25T09:00:00Z',
        updatedAt: '2026-03-03T06:00:00Z',
      },
      {
        id: 'schedule-004',
        userId: 'user-001',
        name: 'OP-ETH SushiSwap',
        protocol: 'SushiSwap',
        chainId: 10,
        chainName: 'Optimism',
        poolAddress: '0x2E5F8A7E3D8A5F6d7E8F9A0B1C2D3E4F5A6B7C8',
        token0: 'OP',
        token1: 'ETH',
        positionValue: '3200.00',
        estimatedApy: '32.8',
        compoundFrequency: 'biweekly',
        nextExecutionTime: '2026-03-17T10:00:00Z',
        status: 'paused',
        autoCompound: false,
        gasPrice: '0.02',
        slippageTolerance: 0.8,
        createdAt: '2026-02-28T11:00:00Z',
        updatedAt: '2026-03-01T15:00:00Z',
      },
    ];

    sampleSchedules.forEach(s => this.schedules.set(s.id, s));

    // Sample executions
    const sampleExecutions: CompoundExecution[] = [
      {
        id: 'exec-001',
        scheduleId: 'schedule-001',
        executedAt: '2026-03-03T08:00:00Z',
        status: 'success',
        txHash: '0xabc123def456...',
        gasUsed: '150000',
        gasFee: '0.00525',
        rewardsClaimed: '25.50',
        rewardsReinvested: '25.00',
        newPositionValue: '12525.00',
      },
      {
        id: 'exec-002',
        scheduleId: 'schedule-001',
        executedAt: '2026-03-02T08:00:00Z',
        status: 'success',
        txHash: '0xdef456ghi789...',
        gasUsed: '145000',
        gasFee: '0.00508',
        rewardsClaimed: '24.80',
        rewardsReinvested: '24.30',
        newPositionValue: '12500.00',
      },
      {
        id: 'exec-003',
        scheduleId: 'schedule-003',
        executedAt: '2026-03-03T06:00:00Z',
        status: 'success',
        txHash: '0xghi789jkl012...',
        gasUsed: '200000',
        gasFee: '0.030',
        rewardsClaimed: '15.20',
        rewardsReinvested: '14.50',
        newPositionValue: '5214.50',
      },
    ];

    this.executions.set('schedule-001', sampleExecutions.slice(0, 2));
    this.executions.set('schedule-003', sampleExecutions.slice(2));
  }

  getSupportedProtocols() {
    return [
      { id: 'uniswap-v3', name: 'Uniswap V3', chains: [1, 42161, 10, 8453, 137, 56] },
      { id: 'uniswap-v2', name: 'Uniswap V2', chains: [1, 42161, 10, 8453, 137, 56] },
      { id: 'sushiswap', name: 'SushiSwap', chains: [1, 42161, 10, 8453, 137, 56, 43114] },
      { id: 'curve', name: 'Curve', chains: [1, 42161, 10, 8453, 137] },
      { id: 'aave', name: 'Aave', chains: [1, 42161, 10, 8453, 137] },
      { id: 'compound', name: 'Compound', chains: [1, 42161, 10] },
      { id: 'yearn', name: 'Yearn Finance', chains: [1, 42161, 10, 8453] },
      { id: 'camelot', name: 'Camelot', chains: [42161] },
      { id: 'velodrome', name: 'Velodrome', chains: [10, 8453] },
      { id: 'trader-joe', name: 'Trader Joe', chains: [43114, 42161] },
    ];
  }

  getSupportedChains() {
    return [
      { id: 1, name: 'Ethereum', symbol: 'ETH' },
      { id: 42161, name: 'Arbitrum', symbol: 'ETH' },
      { id: 10, name: 'Optimism', symbol: 'ETH' },
      { id: 8453, name: 'Base', symbol: 'ETH' },
      { id: 137, name: 'Polygon', symbol: 'MATIC' },
      { id: 56, name: 'BSC', symbol: 'BNB' },
      { id: 43114, name: 'Avalanche', symbol: 'AVAX' },
    ];
  }

  getSchedules(userId: string = 'user-001'): AutoCompoundSchedule[] {
    return Array.from(this.schedules.values()).filter(s => s.userId === userId);
  }

  getScheduleById(id: string): AutoCompoundSchedule | undefined {
    return this.schedules.get(id);
  }

  createSchedule(dto: CreateScheduleDto, userId: string = 'user-001'): AutoCompoundSchedule {
    const chainNames: Record<number, string> = {
      1: 'Ethereum',
      42161: 'Arbitrum',
      10: 'Optimism',
      8453: 'Base',
      137: 'Polygon',
      56: 'BSC',
      43114: 'Avalanche',
    };

    const now = new Date();
    const nextExecution = this.calculateNextExecution(dto.compoundFrequency);

    const schedule: AutoCompoundSchedule = {
      id: `schedule-${Date.now()}`,
      userId,
      name: dto.name,
      protocol: dto.protocol,
      chainId: dto.chainId,
      chainName: chainNames[dto.chainId] || 'Unknown',
      poolAddress: dto.poolAddress,
      token0: 'TOKEN0',
      token1: 'TOKEN1',
      positionValue: '0.00',
      estimatedApy: '0.0',
      compoundFrequency: dto.compoundFrequency,
      nextExecutionTime: nextExecution.toISOString(),
      status: 'active',
      autoCompound: dto.autoCompound,
      gasPrice: dto.gasPrice || '30',
      slippageTolerance: dto.slippageTolerance || 0.5,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    this.schedules.set(schedule.id, schedule);
    return schedule;
  }

  private calculateNextExecution(frequency: string): Date {
    const now = new Date();
    switch (frequency) {
      case 'daily':
        now.setDate(now.getDate() + 1);
        now.setHours(8, 0, 0, 0);
        break;
      case 'weekly':
        now.setDate(now.getDate() + 7);
        now.setHours(12, 0, 0, 0);
        break;
      case 'biweekly':
        now.setDate(now.getDate() + 14);
        now.setHours(12, 0, 0, 0);
        break;
      case 'monthly':
        now.setMonth(now.getMonth() + 1);
        now.setHours(12, 0, 0, 0);
        break;
    }
    return now;
  }

  updateSchedule(id: string, updates: Partial<AutoCompoundSchedule>): AutoCompoundSchedule | null {
    const schedule = this.schedules.get(id);
    if (!schedule) return null;

    const updated = { ...schedule, ...updates, updatedAt: new Date().toISOString() };
    this.schedules.set(id, updated);
    return updated;
  }

  deleteSchedule(id: string): boolean {
    return this.schedules.delete(id);
  }

  pauseSchedule(id: string): AutoCompoundSchedule | null {
    return this.updateSchedule(id, { status: 'paused', autoCompound: false });
  }

  resumeSchedule(id: string): AutoCompoundSchedule | null {
    return this.updateSchedule(id, { status: 'active', autoCompound: true });
  }

  getExecutions(scheduleId: string): CompoundExecution[] {
    return this.executions.get(scheduleId) || [];
  }

  getAllExecutions(userId: string = 'user-001'): CompoundExecution[] {
    const userSchedules = this.getSchedules(userId);
    const allExecutions: CompoundExecution[] = [];
    
    for (const schedule of userSchedules) {
      const execs = this.executions.get(schedule.id) || [];
      allExecutions.push(...execs);
    }
    
    return allExecutions.sort((a, b) => 
      new Date(b.executedAt).getTime() - new Date(a.executedAt).getTime()
    );
  }

  getDashboardStats(userId: string = 'user-001') {
    const schedules = this.getSchedules(userId);
    const allExecutions = this.getAllExecutions(userId);
    
    const activeSchedules = schedules.filter(s => s.status === 'active').length;
    const pausedSchedules = schedules.filter(s => s.status === 'paused').length;
    
    const totalValue = schedules.reduce((sum, s) => sum + parseFloat(s.positionValue), 0);
    
    const avgApy = schedules.length > 0
      ? (schedules.reduce((sum, s) => sum + parseFloat(s.estimatedApy), 0) / schedules.length).toFixed(2)
      : '0.00';
    
    const successfulExecutions = allExecutions.filter(e => e.status === 'success').length;
    const totalRewards = allExecutions
      .filter(e => e.status === 'success')
      .reduce((sum, e) => sum + parseFloat(e.rewardsReinvested), 0);
    
    const totalGasFees = allExecutions
      .filter(e => e.status === 'success')
      .reduce((sum, e) => sum + parseFloat(e.gasFee || '0'), 0);

    return {
      totalSchedules: schedules.length,
      activeSchedules,
      pausedSchedules,
      totalValue,
      averageApy: avgApy,
      totalExecutions: allExecutions.length,
      successfulExecutions,
      successRate: allExecutions.length > 0 
        ? ((successfulExecutions / allExecutions.length) * 100).toFixed(1) + '%'
        : '0%',
      totalRewardsReinvested: totalRewards.toFixed(2),
      totalGasFees: totalGasFees.toFixed(4),
      nextScheduledExecution: schedules
        .filter(s => s.status === 'active')
        .sort((a, b) => new Date(a.nextExecutionTime).getTime() - new Date(b.nextExecutionTime).getTime())[0]?.nextExecutionTime || null,
    };
  }

  getProtocolPositions(protocol: string, chainId: number) {
    // Simulated positions data
    const positions = [
      {
        id: 'pos-001',
        protocol: 'Uniswap V3',
        chainId: 1,
        poolAddress: '0x8ad599c3A0ff1De082011EFDDc58f1908eb6e6C8',
        token0: 'ETH',
        token1: 'USDC',
        value: '12500.00',
        apy: '24.5',
        fees7d: '85.20',
        rewards: '12.50',
      },
      {
        id: 'pos-002',
        protocol: 'Uniswap V3',
        chainId: 1,
        poolAddress: '0x4e68Ccd3E89D2243077eC6C65D11A9B5eE7E9B8A',
        token0: 'WBTC',
        token1: 'ETH',
        value: '8500.00',
        apy: '18.2',
        fees7d: '42.30',
        rewards: '8.20',
      },
      {
        id: 'pos-003',
        protocol: 'Curve',
        chainId: 1,
        poolAddress: '0xA5407eAE9Ba41422680e2e00537571bcC53efBfD',
        token0: 'WBTC',
        token1: 'ETH',
        value: '5200.00',
        apy: '12.3',
        fees7d: '28.50',
        rewards: '5.80',
      },
    ];

    return positions.filter(p => 
      (!protocol || p.protocol.toLowerCase().includes(protocol.toLowerCase())) &&
      (!chainId || p.chainId === chainId)
    );
  }

  simulateCompound(scheduleId: string) {
    const schedule = this.schedules.get(scheduleId);
    if (!schedule) return null;

    const positionValue = parseFloat(schedule.positionValue);
    const apy = parseFloat(schedule.estimatedApy) / 100;
    
    let rewards: number;
    switch (schedule.compoundFrequency) {
      case 'daily':
        rewards = positionValue * (apy / 365);
        break;
      case 'weekly':
        rewards = positionValue * (apy / 52);
        break;
      case 'biweekly':
        rewards = positionValue * (apy / 26);
        break;
      case 'monthly':
        rewards = positionValue * (apy / 12);
        break;
      default:
        rewards = positionValue * (apy / 365);
    }

    const gasEstimate = schedule.chainId === 1 ? 0.005 : 0.1;
    const netRewards = rewards - gasEstimate;

    return {
      scheduleId,
      currentValue: schedule.positionValue,
      estimatedRewards: rewards.toFixed(4),
      gasEstimate: gasEstimate.toFixed(4),
      netRewards: netRewards.toFixed(4),
      newValue: (positionValue + netRewards).toFixed(2),
      apyImprovement: ((netRewards / positionValue) * 100 * 365).toFixed(2) + '%',
    };
  }
}
