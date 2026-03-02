import { Injectable } from '@nestjs/common';
import axios from 'axios';

export interface TokenLockInfo {
  tokenAddress: string;
  tokenSymbol: string;
  tokenName: string;
  chain: string;
  totalLocked: number;
  totalLockedUSD: number;
  lockType: 'liquidity' | 'team' | 'investor' | 'treasury';
  lockAddress: string;
  unlockDate: Date;
  daysRemaining: number;
  percentageLocked: number;
  owner: string;
  description: string;
}

export interface LockStats {
  totalValueLocked: number;
  totalValueLockedUSD: number;
  activeLocks: number;
  upcomingUnlocks: number;
  expiredLocks: number;
  byType: {
    liquidity: number;
    team: number;
    investor: number;
    treasury: number;
  };
}

@Injectable()
export class TokenLockTrackerService {
  private readonly supportedChains = ['ethereum', 'bsc', 'polygon', 'arbitrum', 'optimism', 'avalanche', 'base'];
  
  // Simulated lock data - in production would query actual lock contracts
  private generateMockLockData(tokenAddress: string, chain: string): TokenLockInfo[] {
    const tokens: Record<string, { symbol: string; name: string; price: number }> = {
      '0x...': { symbol: 'UNI', name: 'Uniswap', price: 7.5 },
      '0x...1': { symbol: 'AAVE', name: 'Aave', price: 280 },
      '0x...2': { symbol: 'CRV', name: 'Curve DAO', price: 0.55 },
      '0x...3': { symbol: 'LDO', name: 'Lido DAO', price: 2.8 },
      '0x...4': { symbol: 'MKR', name: 'Maker', price: 1500 },
    };
    
    const tokenInfo = tokens[tokenAddress] || { symbol: 'UNKNOWN', name: 'Unknown Token', price: 1 };
    const locks: TokenLockInfo[] = [];
    
    // Liquidity lock
    locks.push({
      tokenAddress,
      tokenSymbol: tokenInfo.symbol,
      tokenName: tokenInfo.name,
      chain,
      totalLocked: Math.random() * 1000000 + 100000,
      totalLockedUSD: 0,
      lockType: 'liquidity',
      lockAddress: `0x${Math.random().toString(16).slice(2, 42)}`,
      unlockDate: new Date(Date.now() + Math.random() * 365 * 24 * 60 * 60 * 1000),
      daysRemaining: Math.floor(Math.random() * 365),
      percentageLocked: Math.random() * 30 + 10,
      owner: `0x${Math.random().toString(16).slice(2, 42)}`,
      description: 'Liquidity pool lock',
    });
    
    // Team lock
    locks.push({
      tokenAddress,
      tokenSymbol: tokenInfo.symbol,
      tokenName: tokenInfo.name,
      chain,
      totalLocked: Math.random() * 500000 + 50000,
      totalLockedUSD: 0,
      lockType: 'team',
      lockAddress: `0x${Math.random().toString(16).slice(2, 42)}`,
      unlockDate: new Date(Date.now() + Math.random() * 730 * 24 * 60 * 60 * 1000),
      daysRemaining: Math.floor(Math.random() * 730),
      percentageLocked: Math.random() * 20 + 5,
      owner: `0x${Math.random().toString(16).slice(2, 42)}`,
      description: 'Team token vesting',
    });
    
    // Investor lock
    locks.push({
      tokenAddress,
      tokenSymbol: tokenInfo.symbol,
      tokenName: tokenInfo.name,
      chain,
      totalLocked: Math.random() * 300000 + 30000,
      totalLockedUSD: 0,
      lockType: 'investor',
      lockAddress: `0x${Math.random().toString(16).slice(2, 42)}`,
      unlockDate: new Date(Date.now() + Math.random() * 180 * 24 * 60 * 60 * 1000),
      daysRemaining: Math.floor(Math.random() * 180),
      percentageLocked: Math.random() * 15 + 3,
      owner: `0x${Math.random().toString(16).slice(2, 42)}`,
      description: 'Investor token vesting',
    });
    
    // Calculate USD values
    locks.forEach(lock => {
      lock.totalLockedUSD = lock.totalLocked * tokenInfo.price;
    });
    
    return locks;
  }

  async getTokenLocks(tokenAddress: string, chain: string = 'ethereum'): Promise<TokenLockInfo[]> {
    if (!this.supportedChains.includes(chain.toLowerCase())) {
      throw new Error(`Chain ${chain} not supported`);
    }
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return this.generateMockLockData(tokenAddress, chain);
  }

  async getLockStats(chain: string = 'ethereum'): Promise<LockStats> {
    await new Promise(resolve => setTimeout(resolve, 50));
    
    return {
      totalValueLocked: Math.random() * 500000000 + 100000000,
      totalValueLockedUSD: Math.random() * 500000000 + 100000000,
      activeLocks: Math.floor(Math.random() * 500) + 100,
      upcomingUnlocks: Math.floor(Math.random() * 50) + 10,
      expiredLocks: Math.floor(Math.random() * 100) + 20,
      byType: {
        liquidity: Math.random() * 200000000 + 50000000,
        team: Math.random() * 100000000 + 20000000,
        investor: Math.random() * 80000000 + 15000000,
        treasury: Math.random() * 120000000 + 30000000,
      },
    };
  }

  async searchLockedTokens(query: string, chain: string = 'ethereum'): Promise<TokenLockInfo[]> {
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Generate a few mock results
    const mockAddresses = [
      '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984', // UNI
      '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9', // AAVE
      '0xd533a949740bb3306d119cc777fa900ba034cd52', // CRV
    ];
    
    const results: TokenLockInfo[] = [];
    for (const addr of mockAddresses.slice(0, 3)) {
      results.push(...this.generateMockLockData(addr, chain));
    }
    
    return results;
  }

  async getTopLockedTokens(chain: string = 'ethereum', limit: number = 10): Promise<TokenLockInfo[]> {
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const topTokens = [
      { address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984', symbol: 'UNI', name: 'Uniswap' },
      { address: '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9', symbol: 'AAVE', name: 'Aave' },
      { address: '0xd533a949740bb3306d119cc777fa900ba034cd52', symbol: 'CRV', name: 'Curve DAO' },
      { address: '0x5a98fcbea516cf06857215709fd98c23c4fea15', symbol: 'LDO', name: 'Lido DAO' },
      { address: '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2', symbol: 'MKR', name: 'Maker' },
    ];
    
    const results: TokenLockInfo[] = [];
    for (const token of topTokens.slice(0, limit)) {
      const locks = this.generateMockLockData(token.address, chain);
      results.push(...locks);
    }
    
    return results;
  }

  getSupportedChains(): string[] {
    return this.supportedChains;
  }
}
