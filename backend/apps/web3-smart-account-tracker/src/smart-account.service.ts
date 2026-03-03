import { Injectable } from '@nestjs/common';
import axios from 'axios';

export interface SmartAccountInfo {
  address: string;
  factory: string;
  factoryCalldata?: string;
  owner: string;
  implementation?: string;
  nonce: number;
  chainId: number;
  createdAt: number;
}

export interface UserOperation {
  sender: string;
  nonce: string;
  initCode: string;
  callData: string;
  callGasLimit: string;
  verificationGasLimit: string;
  preVerificationGas: string;
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
  signature: string;
  entryPoint: string;
  blockNumber: number;
  transactionHash: string;
  timestamp: number;
  status: 'pending' | 'included' | 'failed';
}

export interface BundlerInfo {
  address: string;
  name: string;
  entryPoints: string[];
  chainIds: number[];
  totalUserOps: number;
  successRate: number;
  avgGasUsed: number;
  avgGasPrice: string;
  stake: string;
  reputation: 'bundler' | 'unknown';
}

export interface PaymasterInfo {
  address: string;
  name: string;
  type: 'static' | 'conditional' | 'verifying';
  supportedTokens: string[];
  chainIds: number[];
  totalSponsored: number;
  avgGasCovered: number;
  stake: string;
  isStakeLocked: boolean;
}

export interface SmartAccountStats {
  totalSmartAccounts: number;
  totalUserOperations: number;
  activeBundlers: number;
  activePaymasters: number;
  chainBreakdown: { chainId: number; count: number }[];
  topBundlers: BundlerInfo[];
  topPaymasters: PaymasterInfo[];
}

@Injectable()
export class SmartAccountService {
  private readonly supportedChains = [1, 5, 8453, 42161, 10, 137, 56, 11155111];
  private readonly entryPointAddresses: Record<number, string> = {
    1: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789',
    5: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789',
    8453: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789',
    42161: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789',
    10: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789',
    137: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789',
    56: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789',
    11155111: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789',
  };

  async getSmartAccountInfo(address: string, chainId: number): Promise<SmartAccountInfo | null> {
    // Simulate smart account info lookup
    const mockAccounts = this.generateMockSmartAccounts(address, chainId);
    return mockAccounts.find((acc) => acc.address.toLowerCase() === address.toLowerCase()) || null;
  }

  async getUserOperations(
    address: string,
    chainId: number,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ data: UserOperation[]; total: number }> {
    const userOps = this.generateMockUserOperations(address, chainId, 100);
    const start = (page - 1) * limit;
    return {
      data: userOps.slice(start, start + limit),
      total: userOps.length,
    };
  }

  async getBundlers(chainId: number, limit: number = 10): Promise<BundlerInfo[]> {
    return this.generateMockBundlers(chainId, limit);
  }

  async getPaymasters(chainId: number, limit: number = 10): Promise<PaymasterInfo[]> {
    return this.generateMockPaymasters(chainId, limit);
  }

  async getStats(chainId?: number): Promise<SmartAccountStats> {
    const chains = chainId ? [chainId] : this.supportedChains;
    return {
      totalSmartAccounts: chains.length * 12500,
      totalUserOperations: chains.length * 45800,
      activeBundlers: chains.length * 15,
      activePaymasters: chains.length * 22,
      chainBreakdown: chains.map((c) => ({ chainId: c, count: 12500 })),
      topBundlers: this.generateMockBundlers(chains[0], 5),
      topPaymasters: this.generateMockPaymasters(chains[0], 5),
    };
  }

  async getChainStatus(): Promise<{ chainId: number; chainName: string; entryPoint: string; userOpsToday: number; avgGasPrice: string }[]> {
    return this.supportedChains.map((chainId) => ({
      chainId,
      chainName: this.getChainName(chainId),
      entryPoint: this.entryPointAddresses[chainId],
      userOpsToday: Math.floor(Math.random() * 50000) + 10000,
      avgGasPrice: (Math.random() * 0.01 + 0.001).toFixed(6),
    }));
  }

  async analyzeAccountUsage(address: string, chainId: number): Promise<{
    totalOps: number;
    firstSeen: number;
    lastSeen: number;
    mostUsedBundler: string;
    mostUsedPaymaster: string | null;
    totalGasSpent: string;
    operationsByType: Record<string, number>;
    avgConfirmationTime: number;
  }> {
    return {
      totalOps: Math.floor(Math.random() * 500) + 10,
      firstSeen: Date.now() - Math.floor(Math.random() * 365 * 24 * 60 * 60 * 1000),
      lastSeen: Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000),
      mostUsedBundler: '0x' + Array(40).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join(''),
      mostUsedPaymaster: Math.random() > 0.3 ? '0x' + Array(40).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('') : null,
      totalGasSpent: (Math.random() * 2).toFixed(4),
      operationsByType: {
        'token_transfer': Math.floor(Math.random() * 100),
        'swap': Math.floor(Math.random() * 80),
        'nft_transfer': Math.floor(Math.random() * 50),
        'approve': Math.floor(Math.random() * 40),
        'generic': Math.floor(Math.random() * 30),
      },
      avgConfirmationTime: Math.floor(Math.random() * 30) + 5,
    };
  }

  private generateMockSmartAccounts(address: string, chainId: number): SmartAccountInfo[] {
    const factories: Record<number, string> = {
      1: '0x9336AD2C224318733E976Dbd5F2C0c4C198Cac93',
      8453: '0xE5bE80mCA1Fe4b5c0f5c8d3E7F6A2B3C9D1E5F7',
      42161: '0x2C5B8B9D5F7A3E2C1B4D6F8A9E0C2D3B4A5C6D7',
    };
    return [
      {
        address: address.toLowerCase(),
        factory: factories[chainId] || factories[1],
        owner: '0x' + Array(40).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join(''),
        implementation: '0x' + Array(40).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join(''),
        nonce: Math.floor(Math.random() * 100),
        chainId,
        createdAt: Date.now() - Math.floor(Math.random() * 365 * 24 * 60 * 60 * 1000),
      },
    ];
  }

  private generateMockUserOperations(address: string, chainId: number, count: number): UserOperation[] {
    const entryPoint = this.entryPointAddresses[chainId];
    const ops: UserOperation[] = [];
    for (let i = 0; i < count; i++) {
      ops.push({
        sender: address.toLowerCase(),
        nonce: i.toString(),
        initCode: '0x',
        callData: '0x',
        callGasLimit: (Math.floor(Math.random() * 100000) + 21000).toString(),
        verificationGasLimit: (Math.floor(Math.random() * 50000) + 20000).toString(),
        preVerificationGas: (Math.floor(Math.random() * 20000) + 10000).toString(),
        maxFeePerGas: (Math.floor(Math.random() * 100) + 20).toString(),
        maxPriorityFeePerGas: (Math.floor(Math.random() * 10) + 1).toString(),
        signature: '0x',
        entryPoint,
        blockNumber: 18000000 - i * 12,
        transactionHash: '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join(''),
        timestamp: Date.now() - i * 3600000,
        status: i === 0 ? 'pending' : 'included',
      });
    }
    return ops;
  }

  private generateMockBundlers(chainId: number, limit: number): BundlerInfo[] {
    const bundlers = [
      { name: 'Pimlico', address: '0x' + '1'.repeat(40) },
      { name: 'Stackup', address: '0x' + '2'.repeat(40) },
      { name: 'Biconomy', address: '0x' + '3'.repeat(40) },
      { name: 'Candide', address: '0x' + '4'.repeat(40) },
      { name: 'Alchemy', address: '0x' + '5'.repeat(40) },
      { name: 'Infinitism', address: '0x' + '6'.repeat(40) },
      { name: 'Etherspot', address: '0x' + '7'.repeat(40) },
      { name: 'Coinbase', address: '0x' + '8'.repeat(40) },
    ];
    return bundlers.slice(0, limit).map((b) => ({
      address: b.address,
      name: b.name,
      entryPoints: [this.entryPointAddresses[chainId]],
      chainIds: this.supportedChains,
      totalUserOps: Math.floor(Math.random() * 500000) + 10000,
      successRate: 0.95 + Math.random() * 0.04,
      avgGasUsed: Math.floor(Math.random() * 50000) + 50000,
      avgGasPrice: (Math.random() * 0.01 + 0.001).toFixed(6),
      stake: (Math.random() * 10 + 1).toFixed(2),
      reputation: 'bundler',
    }));
  }

  private generateMockPaymasters(chainId: number, limit: number): PaymasterInfo[] {
    const paymasters = [
      { name: 'Pimlico', address: '0x' + 'a'.repeat(40), type: 'verifying' as const },
      { name: 'Biconomy', address: '0x' + 'b'.repeat(40), type: 'verifying' as const },
      { name: 'Stackup', address: '0x' + 'c'.repeat(40), type: 'static' as const },
      { name: 'Gelato', address: '0x' + 'd'.repeat(40), type: 'conditional' as const },
      { name: 'TokenPay', address: '0x' + 'e'.repeat(40), type: 'static' as const },
      { name: 'CyberSource', address: '0x' + 'f'.repeat(40), type: 'verifying' as const },
    ];
    return paymasters.slice(0, limit).map((p) => ({
      address: p.address,
      name: p.name,
      type: p.type,
      supportedTokens: ['USDC', 'USDT', 'DAI', 'ETH'],
      chainIds: this.supportedChains,
      totalSponsored: Math.floor(Math.random() * 100000) + 1000,
      avgGasCovered: Math.floor(Math.random() * 30000) + 20000,
      stake: (Math.random() * 5 + 0.5).toFixed(2),
      isStakeLocked: Math.random() > 0.5,
    }));
  }

  private getChainName(chainId: number): string {
    const names: Record<number, string> = {
      1: 'Ethereum',
      5: 'Goerli',
      8453: 'Base',
      42161: 'Arbitrum One',
      10: 'Optimism',
      137: 'Polygon',
      56: 'BNB Chain',
      11155111: 'Sepolia',
    };
    return names[chainId] || `Chain ${chainId}`;
  }
}
