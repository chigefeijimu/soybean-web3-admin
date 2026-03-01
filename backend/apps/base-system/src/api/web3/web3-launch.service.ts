import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';

interface Launch {
  id: string;
  name: string;
  symbol: string;
  description: string;
  logoUrl: string;
  platform: string;
  type: 'IDO' | 'IEO' | 'ICO' | 'Airdrop' | 'Fair Launch';
  chain: string;
  chainId: number;
  startTime: Date;
  endTime: Date;
  price: number;
  targetRaise: number;
  raisedAmount: number;
  participants: number;
  links: {
    website?: string;
    twitter?: string;
    telegram?: string;
    whitepaper?: string;
  };
  status: 'upcoming' | 'active' | 'ended';
  tier?: string;
  requirements?: string[];
}

interface Airdrop {
  id: string;
  name: string;
  symbol: string;
  logoUrl: string;
  description: string;
  snapshotDate?: Date;
  claimDate?: Date;
  distributionMethod: string;
  requirements: string[];
  chain: string;
  status: 'announced' | 'snapshot' | 'claimable' | 'ended';
  links: {
    website?: string;
    twitter?: string;
    telegram?: string;
  };
  estimatedValue?: number;
}

@Injectable()
export class Web3LaunchService {
  private trackedLaunches = new Map<string, string[]>();

  // Mock data for upcoming token launches
  private launches: Launch[] = [
    {
      id: '1',
      name: 'Ethereum Nova',
      symbol: 'ETHN',
      description: '下一代Layer2扩展解决方案',
      logoUrl: 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
      platform: 'DaoMaker',
      type: 'IDO',
      chain: 'Ethereum',
      chainId: 1,
      startTime: new Date('2026-03-15T12:00:00Z'),
      endTime: new Date('2026-03-17T12:00:00Z'),
      price: 0.05,
      targetRaise: 500000,
      raisedAmount: 0,
      participants: 0,
      links: {
        website: 'https://example.com',
        twitter: 'https://twitter.com',
        telegram: 'https://t.me',
      },
      status: 'upcoming',
      tier: 'Guaranteed',
      requirements: ['持有DAO代币', 'KYC验证'],
    },
    {
      id: '2',
      name: 'ChainFlow',
      symbol: 'CFL',
      description: '跨链DeFi聚合器',
      logoUrl: 'https://cryptologos.cc/logos/cosmos-atom-logo.png',
      platform: 'Polkastarter',
      type: 'IDO',
      chain: 'Polkadot',
      chainId: 0,
      startTime: new Date('2026-03-10T14:00:00Z'),
      endTime: new Date('2026-03-12T14:00:00Z'),
      price: 0.12,
      targetRaise: 300000,
      raisedAmount: 0,
      participants: 0,
      links: {
        website: 'https://example.com',
        twitter: 'https://twitter.com',
      },
      status: 'upcoming',
      tier: 'Public',
    },
    {
      id: '3',
      name: 'MetaVault',
      symbol: 'MVLT',
      description: 'NFT流动性协议',
      logoUrl: 'https://cryptologos.cc/logos/solana-sol-logo.png',
      platform: 'Raydium',
      type: 'IDO',
      chain: 'Solana',
      chainId: 101,
      startTime: new Date('2026-03-20T10:00:00Z'),
      endTime: new Date('2026-03-22T10:00:00Z'),
      price: 0.25,
      targetRaise: 800000,
      raisedAmount: 0,
      participants: 0,
      links: {
        website: 'https://example.com',
        telegram: 'https://t.me',
      },
      status: 'upcoming',
    },
    {
      id: '4',
      name: 'Arbitrum Orbit',
      symbol: 'ARBO',
      description: 'Arbitrum生态收益优化器',
      logoUrl: 'https://cryptologos.cc/logos/arbitrum-arb-logo.png',
      platform: 'GameStop',
      type: 'IEO',
      chain: 'Arbitrum',
      chainId: 42161,
      startTime: new Date('2026-03-25T16:00:00Z'),
      endTime: new Date('2026-03-28T16:00:00Z'),
      price: 0.08,
      targetRaise: 1000000,
      raisedAmount: 0,
      participants: 0,
      links: {
        website: 'https://example.com',
        whitepaper: 'https://example.com/whitepaper',
      },
      status: 'upcoming',
      tier: 'Premium',
    },
    {
      id: '5',
      name: 'ZKsync Era',
      symbol: 'ZKE',
      description: 'ZK-Rollup基础设施',
      logoUrl: 'https://cryptologos.cc/logos/zksync-zk-logo.png',
      platform: 'Bitget',
      type: 'IEO',
      chain: 'ZKsync',
      chainId: 324,
      startTime: new Date('2026-04-01T08:00:00Z'),
      endTime: new Date('2026-04-03T08:00:00Z'),
      price: 0.15,
      targetRaise: 1500000,
      raisedAmount: 0,
      participants: 0,
      links: {
        website: 'https://example.com',
      },
      status: 'upcoming',
    },
  ];

  // Mock data for airdrops
  private airdrops: Airdrop[] = [
    {
      id: '1',
      name: 'LayerZero Airdrop',
      symbol: 'ZRO',
      logoUrl: 'https://cryptologos.cc/logos/layer-zero-zro-logo.png',
      description: '跨链消息协议空投',
      snapshotDate: new Date('2026-02-01T00:00:00Z'),
      claimDate: new Date('2026-03-10T00:00:00Z'),
      distributionMethod: '直接领取',
      requirements: [
        '使用LayerZero进行跨链转账',
        '桥接资产到支持的链',
        '与支持的dApp交互',
      ],
      chain: 'Multi-chain',
      status: 'snapshot',
      links: {
        website: 'https://layerzero.network',
        twitter: 'https://twitter.com/LayerZero',
      },
      estimatedValue: 500,
    },
    {
      id: '2',
      name: 'Starknet Airdrop',
      symbol: 'STRK',
      logoUrl: 'https://cryptologos.cc/logos/starknet-strk-logo.png',
      description: 'ZK-Rollup Layer2空投',
      snapshotDate: new Date('2026-01-15T00:00:00Z'),
      claimDate: new Date('2026-03-20T00:00:00Z'),
      distributionMethod: '签名领取',
      requirements: [
        '在Starknet主网进行交易',
        '使用Starknet生态dApp',
        '至少5笔交易',
      ],
      chain: 'Starknet',
      status: 'claimable',
      links: {
        website: 'https://starknet.io',
        twitter: 'https://twitter.com/Starknet',
      },
      estimatedValue: 300,
    },
    {
      id: '3',
      name: 'zkSync Era Airdrop',
      symbol: 'ZKS',
      logoUrl: 'https://cryptologos.cc/logos/zksync-zks-logo.png',
      description: 'zkSync Era生态系统空投',
      snapshotDate: new Date('2026-03-01T00:00:00Z'),
      distributionMethod: '即将公布',
      requirements: ['使用zkSync Era进行交易', '与生态dApp交互'],
      chain: 'ZKsync',
      status: 'announced',
      links: {
        website: 'https://zksync.io',
        twitter: 'https://twitter.com/zksync',
      },
      estimatedValue: 400,
    },
    {
      id: '4',
      name: 'MetaMask Airdrop',
      symbol: 'MASK',
      logoUrl: 'https://cryptologos.cc/logos/metamask-mask-logo.png',
      description: '知名钱包代币空投',
      snapshotDate: new Date('2026-04-01T00:00:00Z'),
      distributionMethod: '快照领取',
      requirements: ['长期使用MetaMask', '交易量大'],
      chain: 'Multi-chain',
      status: 'announced',
      links: {
        website: 'https://metamask.io',
      },
      estimatedValue: 200,
    },
  ];

  constructor(private readonly httpService: HttpService) {}

  async getUpcomingLaunches(page: number = 1, limit: number = 20, platform?: string) {
    let filtered = this.launches.filter((l) => l.status === 'upcoming');
    if (platform) {
      filtered = filtered.filter((l) => l.platform.toLowerCase() === platform.toLowerCase());
    }
    const start = (page - 1) * limit;
    const paged = filtered.slice(start, start + limit);
    return {
      data: paged,
      total: filtered.length,
      page,
      limit,
    };
  }

  async getAirdrops(page: number = 1, limit: number = 20) {
    const start = (page - 1) * limit;
    const paged = this.airdrops.slice(start, start + limit);
    return {
      data: paged,
      total: this.airdrops.length,
      page,
      limit,
    };
  }

  async getLaunchDetail(id: string) {
    const launch = this.launches.find((l) => l.id === id);
    if (!launch) {
      // Try finding in airdrops
      return this.airdrops.find((a) => a.id === id);
    }
    return launch;
  }

  async getPlatforms() {
    const platforms = [
      { id: 'daomaker', name: 'DaoMaker', chain: 'Multi-chain' },
      { id: 'polkastarter', name: 'Polkastarter', chain: 'Polkadot' },
      { id: 'raydium', name: 'Raydium', chain: 'Solana' },
      { id: 'gameStop', name: 'GameStop', chain: 'Immutable' },
      { id: 'binance', name: 'Binance', chain: 'Multi-chain' },
      { id: 'bitget', name: 'Bitget', chain: 'Multi-chain' },
      { id: 'gateio', name: 'Gate.io', chain: 'Multi-chain' },
      { id: 'kuCoin', name: 'KuCoin', chain: 'Multi-chain' },
    ];
    return platforms;
  }

  async getCalendar(month: number, year: number) {
    const launchesInMonth = this.launches.filter((l) => {
      const start = new Date(l.startTime);
      return start.getMonth() + 1 === month && start.getFullYear() === year;
    });
    return launchesInMonth.map((l) => ({
      id: l.id,
      name: l.name,
      symbol: l.symbol,
      type: l.type,
      platform: l.platform,
      startTime: l.startTime,
      endTime: l.endTime,
      chain: l.chain,
    }));
  }

  async getTrendingLaunches() {
    // Return launches sorted by target raise (mock "trending" logic)
    return [...this.launches]
      .filter((l) => l.status === 'upcoming')
      .sort((a, b) => b.targetRaise - a.targetRaise)
      .slice(0, 5);
  }

  async getTrackedLaunches(address: string) {
    const tracked = this.trackedLaunches.get(address.toLowerCase()) || [];
    return this.launches.filter((l) => tracked.includes(l.id));
  }

  async trackLaunch(address: string, launchId: string) {
    const key = address.toLowerCase();
    const tracked = this.trackedLaunches.get(key) || [];
    if (!tracked.includes(launchId)) {
      tracked.push(launchId);
      this.trackedLaunches.set(key, tracked);
    }
    return { success: true, tracked: tracked.length };
  }

  async untrackLaunch(address: string, launchId: string) {
    const key = address.toLowerCase();
    const tracked = this.trackedLaunches.get(key) || [];
    const index = tracked.indexOf(launchId);
    if (index > -1) {
      tracked.splice(index, 1);
      this.trackedLaunches.set(key, tracked);
    }
    return { success: true, tracked: tracked.length };
  }
}
