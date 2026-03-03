import { Injectable } from '@nestjs/common';

interface Protocol {
  id: string;
  name: string;
  symbol: string;
  logo: string;
  description: string;
  category: string;
  chains: string[];
  tvl: number;
  tvlChange24h: number;
  tvlChange7d: number;
  revenue24h: number;
  revenue7d: number;
  users24h: number;
  transactions24h: number;
  avgAPY: number;
  riskScore: number;
  auditStatus: string;
  launchDate: string;
  website: string;
  documentation: string;
  twitter: string;
  telegram: string;
  discord: string;
  github: string;
  tokenAddress: string;
  tokenName: string;
  tokenSymbol: string;
  governanceModel: string;
  revenueModel: string;
  fees: {
    trading: number;
    withdrawal: number;
    deposit: number;
  };
}

interface ProtocolMetrics {
  tvl: number;
  tvlHistory: Array<{ date: string; value: number }>;
  revenueHistory: Array<{ date: string; value: number }>;
  userGrowth: Array<{ date: string; users: number }>;
  transactionVolume: number;
  uniqueUsers: number;
  totalTransactions: number;
  averageTransactionSize: number;
  gasUsed: number;
  activeAddresses: number;
  newUsers: number;
  retainedUsers: number;
}

@Injectable()
export class DefiProtocolExplorerService {
  private protocols: Protocol[] = [
    {
      id: 'uniswap',
      name: 'Uniswap',
      symbol: 'UNI',
      logo: 'https://cryptologos.cc/logos/uniswap-uni-logo.png',
      description: 'Uniswap is a decentralized trading protocol, known for its role in facilitating automated trading of decentralized finance tokens.',
      category: 'DEX',
      chains: ['ethereum', 'arbitrum', 'optimism', 'polygon', 'base'],
      tvl: 4500000000,
      tvlChange24h: 2.5,
      tvlChange7d: 5.2,
      revenue24h: 8500000,
      revenue7d: 59500000,
      users24h: 45000,
      transactions24h: 125000,
      avgAPY: 12.5,
      riskScore: 15,
      auditStatus: 'audited',
      launchDate: '2018-11-02',
      website: 'https://uniswap.org',
      documentation: 'https://docs.uniswap.org',
      twitter: 'https://twitter.com/Uniswap',
      telegram: 'https://t.me/Uniswap',
      discord: 'https://discord.com/invite/uniswap',
      github: 'https://github.com/Uniswap',
      tokenAddress: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
      tokenName: 'Uniswap',
      tokenSymbol: 'UNI',
      governanceModel: 'DAO',
      revenueModel: 'Protocol Fees',
      fees: { trading: 0.3, withdrawal: 0, deposit: 0 },
    },
    {
      id: 'aave',
      name: 'Aave',
      symbol: 'AAVE',
      logo: 'https://cryptologos.cc/logos/aave-aave-logo.png',
      description: 'Aave is a decentralized non-custodial liquidity market protocol where users can participate as depositors or borrowers.',
      category: 'Lending',
      chains: ['ethereum', 'polygon', 'arbitrum', 'optimism', 'base', 'avalanche'],
      tvl: 13000000000,
      tvlChange24h: 1.2,
      tvlChange7d: 3.8,
      revenue24h: 3200000,
      revenue7d: 22400000,
      users24h: 28000,
      transactions24h: 85000,
      avgAPY: 5.8,
      riskScore: 25,
      auditStatus: 'audited',
      launchDate: '2020-01-18',
      website: 'https://aave.com',
      documentation: 'https://docs.aave.com',
      twitter: 'https://twitter.com/AaveAave',
      telegram: 'https://t.me/AaveCommunity',
      discord: 'https://discord.com/invite/aave',
      github: 'https://github.com/aave',
      tokenAddress: '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9',
      tokenName: 'Aave',
      tokenSymbol: 'AAVE',
      governanceModel: 'DAO',
      revenueModel: 'Interest Spread',
      fees: { trading: 0, withdrawal: 0.0005, deposit: 0 },
    },
    {
      id: 'curve',
      name: 'Curve Finance',
      symbol: 'CRV',
      logo: 'https://cryptologos.cc/logos/curve-dao-token-crv-logo.png',
      description: 'Curve is a decentralized exchange liquidity pool designed for efficient stablecoin trading.',
      category: 'DEX',
      chains: ['ethereum', 'arbitrum', 'optimism', 'polygon', 'avalanche'],
      tvl: 2200000000,
      tvlChange24h: 0.8,
      tvlChange7d: 2.1,
      revenue24h: 1800000,
      revenue7d: 12600000,
      users24h: 15000,
      transactions24h: 45000,
      avgAPY: 8.5,
      riskScore: 20,
      auditStatus: 'audited',
      launchDate: '2020-01-13',
      website: 'https://curve.fi',
      documentation: 'https://docs.curve.fi',
      twitter: 'https://twitter.com/CurveFinance',
      telegram: 'https://t.me/curvefi',
      discord: 'https://discord.com/invite/9FwFhny',
      github: 'https://github.com/curvefi',
      tokenAddress: '0xd533a949740bb3306d119cc777fa900ba034cd52',
      tokenName: 'Curve DAO Token',
      tokenSymbol: 'CRV',
      governanceModel: 'DAO',
      revenueModel: 'Trading Fees',
      fees: { trading: 0.04, withdrawal: 0, deposit: 0 },
    },
    {
      id: 'lido',
      name: 'Lido',
      symbol: 'LDO',
      logo: 'https://cryptologos.cc/logos/lido-dao-ldo-logo.png',
      description: 'Lido is a liquid staking solution for ETH, allowing users to stake their ETH and receive stETH while maintaining liquidity.',
      category: 'Liquid Staking',
      chains: ['ethereum', 'polygon', 'solana', 'polkadot'],
      tvl: 18000000000,
      tvlChange24h: 3.2,
      tvlChange7d: 8.5,
      revenue24h: 5200000,
      revenue7d: 36400000,
      users24h: 8500,
      transactions24h: 12000,
      avgAPY: 4.2,
      riskScore: 30,
      auditStatus: 'audited',
      launchDate: '2020-12-17',
      website: 'https://lido.fi',
      documentation: 'https://docs.lido.fi',
      twitter: 'https://twitter.com/LidoFinance',
      telegram: 'https://t.me/lidofinance',
      discord: 'https://discord.com/invite/lido',
      github: 'https://github.com/lidofinance',
      tokenAddress: '0x5a98fcbea516cf06857215709fd98cbeabf0f58',
      tokenName: 'Lido DAO Token',
      tokenSymbol: 'LDO',
      governanceModel: 'DAO',
      revenueModel: 'Staking Fees',
      fees: { trading: 0, withdrawal: 0, deposit: 0 },
    },
    {
      id: 'compound',
      name: 'Compound',
      symbol: 'COMP',
      logo: 'https://cryptologos.cc/logos/compound-comp-logo.png',
      description: 'Compound is an algorithmic, autonomous interest rate protocol built for developers.',
      category: 'Lending',
      chains: ['ethereum', 'arbitrum', 'optimism', 'base'],
      tvl: 1200000000,
      tvlChange24h: 0.5,
      tvlChange7d: 1.8,
      revenue24h: 850000,
      revenue7d: 5950000,
      users24h: 8500,
      transactions24h: 28000,
      avgAPY: 4.2,
      riskScore: 22,
      auditStatus: 'audited',
      launchDate: '2018-09-27',
      website: 'https://compound.finance',
      documentation: 'https://docs.compound.finance',
      twitter: 'https://twitter.com/compoundfinance',
      telegram: 'https://t.me/compoundfinance',
      discord: '',
      github: 'https://github.com/compound-finance',
      tokenAddress: '0xc00e94cb662c3520282e6f5717214004a7f26888',
      tokenName: 'Compound',
      tokenSymbol: 'COMP',
      governanceModel: 'DAO',
      revenueModel: 'Interest Spread',
      fees: { trading: 0, withdrawal: 0.0005, deposit: 0 },
    },
    {
      id: 'yearn',
      name: 'Yearn Finance',
      symbol: 'YFI',
      logo: 'https://cryptologos.cc/logos/yearn-finance-yfi-logo.png',
      description: 'Yearn Finance is a decentralized yield farming aggregator that optimizes returns on crypto assets.',
      category: 'Yield Aggregator',
      chains: ['ethereum', 'arbitrum', 'fantom', 'polygon'],
      tvl: 600000000,
      tvlChange24h: -0.3,
      tvlChange7d: 1.2,
      revenue24h: 420000,
      revenue7d: 2940000,
      users24h: 3200,
      transactions24h: 8500,
      avgAPY: 6.8,
      riskScore: 35,
      auditStatus: 'audited',
      launchDate: '2020-02-12',
      website: 'https://yearn.finance',
      documentation: 'https://docs.yearn.finance',
      twitter: 'https://twitter.com/yearnfi',
      telegram: 'https://t.me/yearnfinance',
      discord: 'https://discord.com/invite/yearn',
      github: 'https://github.com/yearn',
      tokenAddress: '0x0bc529c00c6401aef6d220be8c6ea1667f6ad425',
      tokenName: 'Yearn Finance',
      tokenSymbol: 'YFI',
      governanceModel: 'DAO',
      revenueModel: 'Performance Fees',
      fees: { trading: 0, withdrawal: 0.1, deposit: 0 },
    },
    {
      id: 'makerdao',
      name: 'MakerDAO',
      symbol: 'MKR',
      logo: 'https://cryptologos.cc/logos/maker-mkr-logo.png',
      description: 'MakerDAO is the creator of DAI, the world's first unbiased currency.',
      category: 'Lending',
      chains: ['ethereum'],
      tvl: 8500000000,
      tvlChange24h: 0.2,
      tvlChange7d: 0.8,
      revenue24h: 1200000,
      revenue7d: 8400000,
      users24h: 12000,
      transactions24h: 35000,
      avgAPY: 3.5,
      riskScore: 28,
      auditStatus: 'audited',
      launchDate: '2017-12-17',
      website: 'https://makerdao.com',
      documentation: 'https://docs.makerdao.com',
      twitter: 'https://twitter.com/MakerDAO',
      telegram: 'https://t.me/MakerDAO',
      discord: 'https://discord.com/invite/gFMJXf3',
      github: 'https://github.com/makerdao',
      tokenAddress: '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2',
      tokenName: 'Maker',
      tokenSymbol: 'MKR',
      governanceModel: 'DAO',
      revenueModel: 'Stability Fees',
      fees: { trading: 0, withdrawal: 0, deposit: 0 },
    },
    {
      id: 'sushiswap',
      name: 'SushiSwap',
      symbol: 'SUSHI',
      logo: 'https://cryptologos.cc/logos/sushiswap-sushi-logo.png',
      description: 'SushiSwap is a decentralized exchange and yield farming platform.',
      category: 'DEX',
      chains: ['ethereum', 'arbitrum', 'optimism', 'polygon', 'avalanche', 'bsc', 'base'],
      tvl: 380000000,
      tvlChange24h: 1.5,
      tvlChange7d: 3.2,
      revenue24h: 520000,
      revenue7d: 3640000,
      users24h: 12000,
      transactions24h: 38000,
      avgAPY: 15.2,
      riskScore: 28,
      auditStatus: 'audited',
      launchDate: '2020-09-01',
      website: 'https://sushi.com',
      documentation: 'https://docs.sushi.com',
      twitter: 'https://twitter.com/SushiSwap',
      telegram: 'https://t.me/sushiswap',
      discord: 'https://discord.com/invite/sushiswap',
      github: 'https://github.com/sushiswap',
      tokenAddress: '0x6b3595068778dd592e39a122f4f5a5cf09c90fe2',
      tokenName: 'SushiToken',
      tokenSymbol: 'SUSHI',
      governanceModel: 'DAO',
      revenueModel: 'Trading Fees',
      fees: { trading: 0.3, withdrawal: 0, deposit: 0 },
    },
    {
      id: 'balancer',
      name: 'Balancer',
      symbol: 'BAL',
      logo: 'https://cryptologos.cc/logos/balancer-bal-logo.png',
      description: 'Balancer is a protocol for programmable liquidity, allowing users to create custom token pools.',
      category: 'DEX',
      chains: ['ethereum', 'arbitrum', 'polygon', 'optimism', 'base'],
      tvl: 420000000,
      tvlChange24h: 0.9,
      tvlChange7d: 2.5,
      revenue24h: 380000,
      revenue7d: 2660000,
      users24h: 5800,
      transactions24h: 15000,
      avgAPY: 10.5,
      riskScore: 25,
      auditStatus: 'audited',
      launchDate: '2020-02-28',
      website: 'https://balancer.fi',
      documentation: 'https://docs.balancer.fi',
      twitter: 'https://twitter.com/Balancer',
      telegram: 'https://t.me/balancer',
      discord: 'https://discord.com/invite/balancer',
      github: 'https://github.com/balancer',
      tokenAddress: '0xba100000625a3754423978a60c9317c58a424e3d',
      tokenName: 'Balancer',
      tokenSymbol: 'BAL',
      governanceModel: 'DAO',
      revenueModel: 'Trading Fees',
      fees: { trading: 0.2, withdrawal: 0, deposit: 0 },
    },
    {
      id: 'gmx',
      name: 'GMX',
      symbol: 'GMX',
      logo: 'https://cryptologos.cc/logos/gmx-gmx-logo.png',
      description: 'GMX is a decentralized spot and perpetual exchange.',
      category: 'Derivatives',
      chains: ['arbitrum', 'avalanche'],
      tvl: 280000000,
      tvlChange24h: 4.5,
      tvlChange7d: 12.8,
      revenue24h: 680000,
      revenue7d: 4760000,
      users24h: 8500,
      transactions24h: 28000,
      avgAPY: 8.2,
      riskScore: 40,
      auditStatus: 'audited',
      launchDate: '2021-09-01',
      website: 'https://gmx.io',
      documentation: 'https://docs.gmx.io',
      twitter: 'https://twitter.com/GMX_IO',
      telegram: 'https://t.me/GMX_IO',
      discord: 'https://discord.com/invite/gmx',
      github: 'https://github.com/gmx-io',
      tokenAddress: '0xfc5a1a6eb076a2c7ad06ed22c90d7e710e35ad0a',
      tokenName: 'GMX',
      tokenSymbol: 'GMX',
      governanceModel: 'DAO',
      revenueModel: 'Trading Fees',
      fees: { trading: 0.1, withdrawal: 0, deposit: 0 },
    },
    {
      id: 'morpho',
      name: 'Morpho',
      symbol: 'MORPHO',
      logo: 'https://cryptologos.cc/logos/morpho-morpho-logo.png',
      description: 'Morpho is a peer-to-peer liquidity layer that provides lending and borrowing services.',
      category: 'Lending',
      chains: ['ethereum', 'arbitrum', 'optimism', 'polygon', 'base'],
      tvl: 450000000,
      tvlChange24h: 2.8,
      tvlChange7d: 6.5,
      revenue24h: 280000,
      revenue7d: 1960000,
      users24h: 4200,
      transactions24h: 12000,
      avgAPY: 5.2,
      riskScore: 32,
      auditStatus: 'audited',
      launchDate: '2022-07-15',
      website: 'https://morpho.org',
      documentation: 'https://docs.morpho.org',
      twitter: 'https://twitter.com/MorphoLabs',
      telegram: 'https://t.me/morpholabs',
      discord: 'https://discord.com/invite/morpho',
      github: 'https://github.com/morpho-labs',
      tokenAddress: '0x9994e35db50125e0df78581fb2dacfe27dba8d73',
      tokenName: 'Morpho',
      tokenSymbol: 'MORPHO',
      governanceModel: 'DAO',
      revenueModel: 'Interest Spread',
      fees: { trading: 0, withdrawal: 0, deposit: 0 },
    },
    {
      id: 'rocket-pool',
      name: 'Rocket Pool',
      symbol: 'RPL',
      logo: 'https://cryptologos.cc/logos/rocket-pool-rpl-logo.png',
      description: 'Rocket Pool is a decentralized Ethereum staking protocol.',
      category: 'Liquid Staking',
      chains: ['ethereum'],
      tvl: 480000000,
      tvlChange24h: 2.1,
      tvlChange7d: 5.8,
      revenue24h: 180000,
      revenue7d: 1260000,
      users24h: 2800,
      transactions24h: 4500,
      avgAPY: 4.8,
      riskScore: 25,
      auditStatus: 'audited',
      launchDate: '2021-11-08',
      website: 'https://rocketpool.net',
      documentation: 'https://docs.rocketpool.net',
      twitter: 'https://twitter.com/Rocket_Pool',
      telegram: 'https://t.me/rocketpool',
      discord: 'https://discord.com/invite/rocketpool',
      github: 'https://github.com/rocket-pool',
      tokenAddress: '0xd33526068d116c69f8a1f3f4d7e012419f5e1334',
      tokenName: 'Rocket Pool Protocol',
      tokenSymbol: 'RPL',
      governanceModel: 'DAO',
      revenueModel: 'Node Operator Fees',
      fees: { trading: 0, withdrawal: 0, deposit: 0 },
    },
  ];

  private categories = [
    { id: 'dex', name: 'Decentralized Exchange', description: 'Automated market makers and order book DEXs' },
    { id: 'lending', name: 'Lending', description: 'Decentralized lending and borrowing protocols' },
    { id: 'liquid-staking', name: 'Liquid Staking', description: 'Liquid staking derivatives' },
    { id: 'yield-aggregator', name: 'Yield Aggregator', description: 'Yield farming optimization' },
    { id: 'derivatives', name: 'Derivatives', description: 'Perpetuals, options, and futures' },
    { id: 'bridge', name: 'Bridge', description: 'Cross-chain bridges' },
    { id: 'insurance', name: 'Insurance', description: 'DeFi insurance protocols' },
    { id: 'nft', name: 'NFT', description: 'NFT marketplaces and infrastructure' },
  ];

  private supportedChains = [
    { id: 'ethereum', name: 'Ethereum', symbol: 'ETH' },
    { id: 'polygon', name: 'Polygon', symbol: 'MATIC' },
    { id: 'arbitrum', name: 'Arbitrum', symbol: 'ARB' },
    { id: 'optimism', name: 'Optimism', symbol: 'OP' },
    { id: 'bsc', name: 'BNB Chain', symbol: 'BNB' },
    { id: 'base', name: 'Base', symbol: 'ETH' },
    { id: 'avalanche', name: 'Avalanche', symbol: 'AVAX' },
    { id: 'solana', name: 'Solana', symbol: 'SOL' },
    { id: 'fantom', name: 'Fantom', symbol: 'FTM' },
  ];

  async getProtocols(filters: {
    category?: string;
    chain?: string;
    sort?: 'tvl' | 'tvlChange24h' | 'revenue24h' | 'users24h' | 'name';
    limit: number;
    offset: number;
  }) {
    let result = [...this.protocols];

    if (filters.category) {
      result = result.filter((p) => p.category === filters.category);
    }

    if (filters.chain) {
      result = result.filter((p) => p.chains.includes(filters.chain));
    }

    if (filters.sort) {
      result.sort((a, b) => {
        const key = filters.sort as keyof Protocol;
        if (typeof a[key] === 'string') {
          return (a[key] as string).localeCompare(b[key] as string);
        }
        return (b[key] as number) - (a[key] as number);
      });
    }

    const total = result.length;
    result = result.slice(filters.offset, filters.offset + filters.limit);

    return {
      success: true,
      data: result,
      pagination: {
        total,
        limit: filters.limit,
        offset: filters.offset,
      },
    };
  }

  async getProtocolDetails(id: string) {
    const protocol = this.protocols.find((p) => p.id === id);
    if (!protocol) {
      return { success: false, error: 'Protocol not found' };
    }

    return {
      success: true,
      data: protocol,
    };
  }

  async getProtocolTvl(id: string, timeRange: string = '30d') {
    const protocol = this.protocols.find((p) => p.id === id);
    if (!protocol) {
      return { success: false, error: 'Protocol not found' };
    }

    const days = timeRange === '7d' ? 7 : timeRange === '90d' ? 90 : timeRange === '180d' ? 180 : timeRange === '1y' ? 365 : 30;
    const tvlHistory = [];
    const baseTvl = protocol.tvl;
    
    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const variation = 1 + (Math.random() - 0.5) * 0.1 * (i / days);
      tvlHistory.push({
        date: date.toISOString().split('T')[0],
        value: Math.round(baseTvl * variation),
      });
    }

    return {
      success: true,
      data: {
        protocol: protocol.name,
        currentTvl: protocol.tvl,
        change24h: protocol.tvlChange24h,
        change7d: protocol.tvlChange7d,
        history: tvlHistory,
      },
    };
  }

  async getProtocolMetrics(id: string): Promise<{ success: boolean; data?: any; error?: string }> {
    const protocol = this.protocols.find((p) => p.id === id);
    if (!protocol) {
      return { success: false, error: 'Protocol not found' };
    }

    const revenueHistory = [];
    const baseRevenue = protocol.revenue24h;
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      revenueHistory.push({
        date: date.toISOString().split('T')[0],
        value: Math.round(baseRevenue * (0.8 + Math.random() * 0.4)),
      });
    }

    const userGrowth = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      userGrowth.push({
        date: date.toISOString().split('T')[0],
        users: Math.round(protocol.users24h * (0.7 + Math.random() * 0.6)),
      });
    }

    const metrics: ProtocolMetrics = {
      tvl: protocol.tvl,
      tvlHistory: [],
      revenueHistory,
      userGrowth,
      transactionVolume: protocol.transactions24h * 1500,
      uniqueUsers: protocol.users24h,
      totalTransactions: protocol.transactions24h * 30,
      averageTransactionSize: 1500,
      gasUsed: protocol.transactions24h * 65000,
      activeAddresses: Math.round(protocol.users24h * 0.8),
      newUsers: Math.round(protocol.users24h * 0.15),
      retainedUsers: Math.round(protocol.users24h * 0.85),
    };

    return {
      success: true,
      data: metrics,
    };
  }

  async getCompetitors(id: string) {
    const protocol = this.protocols.find((p) => p.id === id);
    if (!protocol) {
      return { success: false, error: 'Protocol not found' };
    }

    const competitors = this.protocols
      .filter((p) => p.id !== id && p.category === protocol.category)
      .sort((a, b) => b.tvl - a.tvl)
      .slice(0, 5);

    return {
      success: true,
      data: competitors,
    };
  }

  async getHistoricalMetrics(id: string, timeRange: string = '30d') {
    const protocol = this.protocols.find((p) => p.id === id);
    if (!protocol) {
      return { success: false, error: 'Protocol not found' };
    }

    const days = timeRange === '7d' ? 7 : timeRange === '90d' ? 90 : timeRange === '180d' ? 180 : timeRange === '1y' ? 365 : 30;
    const metrics = [];

    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      metrics.push({
        date: date.toISOString().split('T')[0],
        tvl: Math.round(protocol.tvl * (0.85 + Math.random() * 0.3)),
        revenue: Math.round(protocol.revenue24h * (0.7 + Math.random() * 0.6)),
        users: Math.round(protocol.users24h * (0.6 + Math.random() * 0.8)),
        transactions: Math.round(protocol.transactions24h * (0.7 + Math.random() * 0.6)),
      });
    }

    return {
      success: true,
      data: metrics,
    };
  }

  async getCategories() {
    return {
      success: true,
      data: this.categories,
    };
  }

  async getSupportedChains() {
    return {
      success: true,
      data: this.supportedChains,
    };
  }

  async searchProtocols(query: string) {
    const lowerQuery = query.toLowerCase();
    const results = this.protocols.filter(
      (p) =>
        p.name.toLowerCase().includes(lowerQuery) ||
        p.symbol.toLowerCase().includes(lowerQuery) ||
        p.description.toLowerCase().includes(lowerQuery) ||
        p.category.toLowerCase().includes(lowerQuery),
    );

    return {
      success: true,
      data: results.slice(0, 10),
    };
  }

  async getTrendingProtocols(limit: number = 10) {
    const trending = [...this.protocols]
      .sort((a, b) => b.tvlChange24h - a.tvlChange24h)
      .slice(0, limit);

    return {
      success: true,
      data: trending,
    };
  }

  async getFeaturedProtocols() {
    const featured = this.protocols.slice(0, 5);

    return {
      success: true,
      data: featured,
    };
  }

  async getNewProtocols(days: number = 30, limit: number = 10) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const newProtocols = this.protocols
      .filter((p) => new Date(p.launchDate) >= cutoffDate)
      .sort((a, b) => new Date(b.launchDate).getTime() - new Date(a.launchDate).getTime())
      .slice(0, limit);

    return {
      success: true,
      data: newProtocols,
    };
  }

  async compareProtocols(ids: string[]) {
    const protocols = ids
      .map((id) => this.protocols.find((p) => p.id === id))
      .filter(Boolean);

    if (protocols.length === 0) {
      return { success: false, error: 'No valid protocols found' };
    }

    const comparison = {
      protocols: protocols.map((p) => ({
        id: p.id,
        name: p.name,
        category: p.category,
        tvl: p.tvl,
        tvlChange24h: p.tvlChange24h,
        revenue24h: p.revenue24h,
        users24h: p.users24h,
        riskScore: p.riskScore,
        avgAPY: p.avgAPY,
      })),
      summary: {
        totalTvl: protocols.reduce((sum, p) => sum + p.tvl, 0),
        avgRiskScore: protocols.reduce((sum, p) => sum + p.riskScore, 0) / protocols.length,
        topByTvl: protocols.sort((a, b) => b.tvl - a.tvl)[0].name,
        topByUsers: protocols.sort((a, b) => b.users24h - a.users24h)[0].name,
      },
    };

    return {
      success: true,
      data: comparison,
    };
  }

  async getDashboard() {
    const totalTvl = this.protocols.reduce((sum, p) => sum + p.tvl, 0);
    const totalRevenue = this.protocols.reduce((sum, p) => sum + p.revenue24h, 0);
    const totalUsers = this.protocols.reduce((sum, p) => sum + p.users24h, 0);
    const totalTransactions = this.protocols.reduce((sum, p) => sum + p.transactions24h, 0);

    const topProtocols = [...this.protocols].sort((a, b) => b.tvl - a.tvl).slice(0, 5);
    const topGainers = [...this.protocols].sort((a, b) => b.tvlChange24h - a.tvlChange24h).slice(0, 5);
    const topLosers = [...this.protocols].sort((a, b) => a.tvlChange24h - b.tvlChange24h).slice(0, 5);

    const categoryDistribution = this.categories.map((cat) => ({
      category: cat.name,
      tvl: this.protocols.filter((p) => p.category === cat.id).reduce((sum, p) => sum + p.tvl, 0),
      count: this.protocols.filter((p) => p.category === cat.id).length,
    }));

    return {
      success: true,
      data: {
        overview: {
          totalProtocols: this.protocols.length,
          totalTvl,
          totalRevenue24h: totalRevenue,
          totalUsers24h: totalUsers,
          totalTransactions24h: totalTransactions,
        },
        topProtocols,
        topGainers,
        topLosers,
        categoryDistribution,
      },
    };
  }

  async getTopGainers(timeRange: string = '24h', limit: number = 10) {
    const sorted = [...this.protocols].sort((a, b) => b.tvlChange24h - a.tvlChange24h);
    return {
      success: true,
      data: sorted.slice(0, limit),
    };
  }

  async getTopLosers(timeRange: string = '24h', limit: number = 10) {
    const sorted = [...this.protocols].sort((a, b) => a.tvlChange24h - b.tvlChange24h);
    return {
      success: true,
      data: sorted.slice(0, limit),
    };
  }
}
