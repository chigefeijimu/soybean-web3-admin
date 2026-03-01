import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';

export interface VestingSchedule {
  id: string;
  beneficiary: string;
  token: string;
  tokenSymbol: string;
  tokenName: string;
  chainId: number;
  totalAmount: string;
  releasedAmount: string;
  pendingAmount: string;
  startTime: number;
  cliffDuration: number;
  duration: number;
  slicePeriodSeconds: number;
  revocable: boolean;
  revoked: boolean;
  vestingType: 'team' | 'investor' | 'advisor' | 'community' | 'ecosystem' | 'other';
  createdAt: string;
}

export interface VestingInfo {
  address: string;
  chainId: number;
  schedules: VestingSchedule[];
  totalVesting: string;
  totalReleased: string;
  totalPending: string;
  nextUnlockTime: number | null;
  nextUnlockAmount: string;
}

export interface TokenVestingStats {
  chainId: number;
  totalVestingContracts: number;
  totalValueLocked: string;
  upcomingUnlocks: VestingSchedule[];
  popularTokens: { symbol: string; count: number }[];
}

const MOCK_VESTING_CONTRACTS: Record<number, VestingSchedule[]> = {
  1: [
    {
      id: 'uniswap-team',
      beneficiary: '0x1a9C8182c09F50C8318d769245BeA52c32bD45AC',
      token: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
      tokenSymbol: 'UNI',
      tokenName: 'Uniswap',
      chainId: 1,
      totalAmount: '430000000000000000000000000',
      releasedAmount: '301000000000000000000000000',
      pendingAmount: '129000000000000000000000000',
      startTime: 1600828800,
      cliffDuration: 31536000,
      duration: 146000000,
      slicePeriodSeconds: 2592000,
      revocable: true,
      revoked: false,
      vestingType: 'team',
      createdAt: '2020-09-23T00:00:00Z',
    },
    {
      id: 'aave-team',
      beneficiary: '0xEC568fffba86c094cf06b22134B23074BCfEe8c2',
      token: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9',
      tokenSymbol: 'AAVE',
      tokenName: 'Aave',
      chainId: 1,
      totalAmount: '16000000000000000000000000',
      releasedAmount: '13000000000000000000000000',
      pendingAmount: '3000000000000000000000000',
      startTime: 1609459200,
      cliffDuration: 31536000,
      duration: 146000000,
      slicePeriodSeconds: 2592000,
      revocable: true,
      revoked: false,
      vestingType: 'team',
      createdAt: '2021-01-01T00:00:00Z',
    },
    {
      id: 'optimism-investor',
      beneficiary: '0x250d7766e3D12fA53aFD6Ee4D7BeD33C1588B4c6',
      token: '0x4200000000000000000000000000000000000006',
      tokenSymbol: 'OP',
      tokenName: 'Optimism',
      chainId: 1,
      totalAmount: '250000000000000000000000000',
      releasedAmount: '100000000000000000000000000',
      pendingAmount: '150000000000000000000000000',
      startTime: 1648857600,
      cliffDuration: 31536000,
      duration: 146000000,
      slicePeriodSeconds: 2592000,
      revocable: true,
      revoked: false,
      vestingType: 'investor',
      createdAt: '2022-04-02T00:00:00Z',
    },
    {
      id: 'arbitrum-team',
      beneficiary: '0x71bE63f3384f5fb98995898A86B02Fb2426c5788',
      token: '0x912CE59144191C1204E64559FE8253a0e49E6548',
      tokenSymbol: 'ARB',
      tokenName: 'Arbitrum',
      chainId: 1,
      totalAmount: '500000000000000000000000000',
      releasedAmount: '200000000000000000000000000',
      pendingAmount: '300000000000000000000000000',
      startTime: 1679558400,
      cliffDuration: 31536000,
      duration: 146000000,
      slicePeriodSeconds: 2592000,
      revocable: true,
      revoked: false,
      vestingType: 'team',
      createdAt: '2023-03-23T00:00:00Z',
    },
  ],
  137: [
    {
      id: 'polygon-team',
      beneficiary: '0xFa3D10e1D4C7eE1fE7d3A4d8cF8B7c9D2e5f6g8h',
      token: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
      tokenSymbol: 'MATIC',
      tokenName: 'Polygon',
      chainId: 137,
      totalAmount: '1000000000000000000000000000',
      releasedAmount: '600000000000000000000000000',
      pendingAmount: '400000000000000000000000000',
      startTime: 1640995200,
      cliffDuration: 31536000,
      duration: 730 * 86400,
      slicePeriodSeconds: 2592000,
      revocable: true,
      revoked: false,
      vestingType: 'team',
      createdAt: '2022-01-01T00:00:00Z',
    },
  ],
  42161: [
    {
      id: 'arbitrum-chain-team',
      beneficiary: '0x71bE63f3384f5fb98995898A86B02Fb2426c5788',
      token: '0x912CE59144191C1204E64559FE8253a0e49E6548',
      tokenSymbol: 'ARB',
      tokenName: 'Arbitrum',
      chainId: 42161,
      totalAmount: '1200000000000000000000000000',
      releasedAmount: '400000000000000000000000000',
      pendingAmount: '800000000000000000000000000',
      startTime: 1679558400,
      cliffDuration: 31536000,
      duration: 146000000,
      slicePeriodSeconds: 2592000,
      revocable: true,
      revoked: false,
      vestingType: 'team',
      createdAt: '2023-03-23T00:00:00Z',
    },
  ],
};

const CHAIN_NAMES: Record<number, string> = {
  1: 'Ethereum',
  56: 'BNB Chain',
  137: 'Polygon',
  42161: 'Arbitrum',
  10: 'Optimism',
  8453: 'Base',
};

@Injectable()
export class TokenVestingService {
  private readonly etherscanApiKey = process.env.ETHERSCAN_API_KEY || '';

  async getVestingByAddress(chainId: number, address: string): Promise<VestingInfo> {
    if (!this.isValidAddress(address)) {
      throw new HttpException('Invalid address', HttpStatus.BAD_REQUEST);
    }

    const schedules = MOCK_VESTING_CONTRACTS[chainId]?.filter(
      s => s.beneficiary.toLowerCase() === address.toLowerCase()
    ) || [];

    return this.calculateVestingInfo(address, chainId, schedules);
  }

  async getVestingSchedule(chainId: number, scheduleId: string): Promise<VestingSchedule | null> {
    const schedules = MOCK_VESTING_CONTRACTS[chainId] || [];
    const schedule = schedules.find(s => s.id === scheduleId);
    
    if (!schedule) return null;

    const now = Date.now() / 1000;
    const elapsed = now - schedule.startTime;
    
    if (elapsed < schedule.cliffDuration) {
      return { ...schedule, releasedAmount: '0', pendingAmount: schedule.totalAmount };
    }

    const vestingEnd = schedule.startTime + schedule.duration;
    const clampedTime = Math.min(now, vestingEnd);
    const vestedTime = clampedTime - schedule.startTime;
    
    const totalReleased = (BigInt(schedule.totalAmount) * BigInt(Math.floor(vestedTime / schedule.slicePeriodSeconds))) / 
      BigInt(Math.floor(schedule.duration / schedule.slicePeriodSeconds));
    
    const pending = BigInt(schedule.totalAmount) - totalReleased;
    
    return {
      ...schedule,
      releasedAmount: totalReleased.toString(),
      pendingAmount: pending.toString(),
    };
  }

  async getPopularVestingContracts(chainId?: number, limit: number = 20): Promise<VestingSchedule[]> {
    if (chainId) {
      return (MOCK_VESTING_CONTRACTS[chainId] || []).slice(0, limit);
    }

    const all: VestingSchedule[] = [];
    Object.values(MOCK_VESTING_CONTRACTS).forEach(schedules => {
      all.push(...schedules);
    });

    return all.slice(0, limit);
  }

  async getUpcomingUnlocks(chainId?: number, days: number = 7): Promise<VestingSchedule[]> {
    const now = Date.now() / 1000;
    const future = now + days * 24 * 60 * 60;
    
    const allSchedules: VestingSchedule[] = [];
    const chainIds = chainId ? [chainId] : Object.keys(MOCK_VESTING_CONTRACTS).map(Number);

    for (const cid of chainIds) {
      const schedules = MOCK_VESTING_CONTRACTS[cid] || [];
      for (const schedule of schedules) {
        const nextUnlock = this.getNextUnlockTime(schedule);
        if (nextUnlock && nextUnlock <= future) {
          allSchedules.push({ ...schedule });
        }
      }
    }

    return allSchedules.sort((a, b) => {
      const aTime = this.getNextUnlockTime(a) || 0;
      const bTime = this.getNextUnlockTime(b) || 0;
      return aTime - bTime;
    });
  }

  async getVestingStats(chainId?: number): Promise<TokenVestingStats> {
    const chainIds = chainId ? [chainId] : Object.keys(MOCK_VESTING_CONTRACTS).map(Number);
    
    let totalContracts = 0;
    let totalValue = BigInt(0);
    const tokenCounts: Record<string, number> = {};

    const upcomingUnlocks: VestingSchedule[] = [];

    for (const cid of chainIds) {
      const schedules = MOCK_VESTING_CONTRACTS[cid] || [];
      totalContracts += schedules.length;

      for (const schedule of schedules) {
        totalValue += BigInt(schedule.pendingAmount);
        
        tokenCounts[schedule.tokenSymbol] = (tokenCounts[schedule.tokenSymbol] || 0) + 1;

        const nextUnlock = this.getNextUnlockTime(schedule);
        if (nextUnlock && nextUnlock <= Date.now() / 1000 + 30 * 24 * 60 * 60) {
          upcomingUnlocks.push(schedule);
        }
      }
    }

    const popularTokens = Object.entries(tokenCounts)
      .map(([symbol, count]) => ({ symbol, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      chainId: chainId || 1,
      totalVestingContracts: totalContracts,
      totalValueLocked: totalValue.toString(),
      upcomingUnlocks: upcomingUnlocks.slice(0, 10),
      popularTokens,
    };
  }

  async searchVestingByToken(chainId: number, tokenAddress: string): Promise<VestingSchedule[]> {
    if (!this.isValidAddress(tokenAddress)) {
      throw new HttpException('Invalid token address', HttpStatus.BAD_REQUEST);
    }

    const schedules = MOCK_VESTING_CONTRACTS[chainId]?.filter(
      s => s.token.toLowerCase() === tokenAddress.toLowerCase()
    ) || [];

    return schedules;
  }

  private calculateVestingInfo(address: string, chainId: number, schedules: VestingSchedule[]): VestingInfo {
    let totalVesting = BigInt(0);
    let totalReleased = BigInt(0);
    let totalPending = BigInt(0);
    let nextUnlockTime: number | null = null;
    let nextUnlockAmount = BigInt(0);

    const now = Date.now() / 1000;

    for (const schedule of schedules) {
      totalVesting += BigInt(schedule.totalAmount);
      
      const elapsed = now - schedule.startTime;
      
      if (elapsed < schedule.cliffDuration) {
        totalPending += BigInt(schedule.totalAmount);
      } else {
        const vestingEnd = schedule.startTime + schedule.duration;
        const clampedTime = Math.min(now, vestingEnd);
        const vestedTime = clampedTime - schedule.startTime;
        
        const periods = Math.floor(vestedTime / schedule.slicePeriodSeconds);
        const totalPeriods = Math.floor(schedule.duration / schedule.slicePeriodSeconds);
        
        const released = (BigInt(schedule.totalAmount) * BigInt(periods)) / BigInt(totalPeriods);
        const pending = BigInt(schedule.totalAmount) - released;
        
        totalReleased += released;
        totalPending += pending;
      }

      const nextUnlock = this.getNextUnlockTime(schedule);
      if (nextUnlock && (!nextUnlockTime || nextUnlock < nextUnlockTime)) {
        nextUnlockTime = nextUnlock;
        const periods = Math.floor(schedule.duration / schedule.slicePeriodSeconds);
        const unlockAmount = BigInt(schedule.totalAmount) / BigInt(periods);
        nextUnlockAmount = unlockAmount;
      }
    }

    return {
      address: address.toLowerCase(),
      chainId,
      schedules,
      totalVesting: totalVesting.toString(),
      totalReleased: totalReleased.toString(),
      totalPending: totalPending.toString(),
      nextUnlockTime,
      nextUnlockAmount: nextUnlockAmount.toString(),
    };
  }

  private getNextUnlockTime(schedule: VestingSchedule): number | null {
    const now = Date.now() / 1000;
    
    if (now >= schedule.startTime + schedule.duration) {
      return null;
    }

    if (now < schedule.startTime + schedule.cliffDuration) {
      return schedule.startTime + schedule.cliffDuration;
    }

    const elapsed = now - schedule.startTime;
    const periodsElapsed = Math.floor(elapsed / schedule.slicePeriodSeconds);
    const nextPeriodTime = schedule.startTime + (periodsElapsed + 1) * schedule.slicePeriodSeconds;

    if (nextPeriodTime > schedule.startTime + schedule.duration) {
      return schedule.startTime + schedule.duration;
    }

    return nextPeriodTime;
  }

  private isValidAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  formatTokenAmount(amount: string, decimals: number = 18): string {
    const value = BigInt(amount);
    const divisor = BigInt(10) ** BigInt(decimals);
    const whole = value / divisor;
    const fraction = value % divisor;
    
    if (fraction === BigInt(0)) {
      return whole.toString();
    }
    
    return `${whole}.${fraction.toString().padStart(decimals, '0').slice(0, 4)}`;
  }

  getChainName(chainId: number): string {
    return CHAIN_NAMES[chainId] || `Chain ${chainId}`;
  }
}
