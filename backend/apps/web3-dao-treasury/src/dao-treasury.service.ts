import { Injectable } from '@nestjs/common';

interface DAO {
  id: string;
  name: string;
  symbol: string;
  description: string;
  logo: string;
  chain: string;
  tokenAddress: string;
  treasuryUsd: number;
  treasuryChange24h: number;
  tokenHolders: number;
  proposalsCount: number;
  category: string;
  founded: string;
}

interface TreasuryAsset {
  symbol: string;
  name: string;
  address: string;
  chain: string;
  amount: number;
  valueUsd: number;
  percentage: number;
  priceChange24h: number;
  type: 'native' | 'erc20' | 'nft';
  logo?: string;
}

interface TreasuryTransaction {
  id: string;
  daoId: string;
  daoName: string;
  type: 'income' | 'expense';
  category: 'grant' | 'investment' | 'operational' | 'buyback' | 'airdrop' | 'team' | 'development' | 'other';
  amount: number;
  amountUsd: number;
  tokenSymbol: string;
  from: string;
  to: string;
  description: string;
  txHash: string;
  timestamp: string;
  status: 'completed' | 'pending' | 'cancelled';
}

interface FlowData {
  period: string;
  totalInflow: number;
  totalOutflow: number;
  netFlow: number;
  inflowByCategory: { category: string; amount: number }[];
  outflowByCategory: { category: string; amount: number }[];
  dailyFlow: { date: string; inflow: number; outflow: number }[];
}

interface TreasuryStats {
  totalValue: number;
  change24h: number;
  change7d: number;
  change30d: number;
  assetCount: number;
  largestHolding: string;
  largestHoldingPercentage: number;
  avgTransactionSize: number;
  transactionsCount: number;
}

interface TreasuryProposal {
  id: string;
  daoId: string;
  daoName: string;
  title: string;
  description: string;
  status: 'active' | 'passed' | 'failed' | 'executed';
  type: 'treasury' | 'parameter' | 'upgrade' | 'text' | 'emergency';
  amount: number;
  amountUsd: number;
  recipient: string;
  forVotes: number;
  againstVotes: number;
  startTime: string;
  endTime: string;
  proposer: string;
}

interface TreasuryAlert {
  id: string;
  daoId: string;
  type: 'large_inflow' | 'large_outflow' | 'unusual_activity' | 'threshold_breach';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  amount?: number;
  timestamp: string;
  txHash?: string;
}

@Injectable()
export class DaoTreasuryService {
  private daos: DAO[] = [
    {
      id: 'uniswap',
      name: 'Uniswap',
      symbol: 'UNI',
      description: 'Decentralized trading protocol',
      logo: '🦄',
      chain: 'Ethereum',
      tokenAddress: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
      treasuryUsd: 2450000000,
      treasuryChange24h: 2.5,
      tokenHolders: 185000,
      proposalsCount: 156,
      category: 'DEX',
      founded: '2018-11-02',
    },
    {
      id: 'aave',
      name: 'Aave',
      symbol: 'AAVE',
      description: 'Non-custodial liquidity protocol',
      logo: '👻',
      chain: 'Ethereum',
      tokenAddress: '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9',
      treasuryUsd: 1850000000,
      treasuryChange24h: -1.2,
      tokenHolders: 95000,
      proposalsCount: 89,
      category: 'Lending',
      founded: '2017-02-21',
    },
    {
      id: 'compound',
      name: 'Compound',
      symbol: 'COMP',
      description: 'Algorithmic money market protocol',
      logo: '🏦',
      chain: 'Ethereum',
      tokenAddress: '0xc00e94cb662c3520282e6f5717214004a7f26888',
      treasuryUsd: 420000000,
      treasuryChange24h: 0.8,
      tokenHolders: 45000,
      proposalsCount: 78,
      category: 'Lending',
      founded: '2017-09-19',
    },
    {
      id: 'makerdao',
      name: 'MakerDAO',
      symbol: 'MKR',
      description: 'Decentralized stablecoin protocol',
      logo: '🎩',
      chain: 'Ethereum',
      tokenAddress: '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2',
      treasuryUsd: 2100000000,
      treasuryChange24h: 1.5,
      tokenHolders: 62000,
      proposalsCount: 234,
      category: 'Stablecoin',
      founded: '2015-06-22',
    },
    {
      id: 'lido',
      name: 'Lido',
      symbol: 'LDO',
      description: 'Liquid staking solution',
      logo: '💧',
      chain: 'Ethereum',
      tokenAddress: '0x5a98fcbea516cf06857215779fd812ca3bef1b32',
      treasuryUsd: 980000000,
      treasuryChange24h: 3.2,
      tokenHolders: 78000,
      proposalsCount: 45,
      category: 'Staking',
      founded: '2020-04-21',
    },
    {
      id: 'ens',
      name: 'ENS DAO',
      symbol: 'ENS',
      description: 'Ethereum Name Service',
      logo: '🌉',
      chain: 'Ethereum',
      tokenAddress: '0xc18360217d8f7be5d145be834170e94e3aeecd3e',
      treasuryUsd: 320000000,
      treasuryChange24h: -0.5,
      tokenHolders: 52000,
      proposalsCount: 28,
      category: 'Infrastructure',
      founded: '2017-05-09',
    },
    {
      id: 'curve',
      name: 'Curve DAO',
      symbol: 'CRV',
      description: 'Stable swap AMM',
      logo: '📈',
      chain: 'Ethereum',
      tokenAddress: '0xd533a949740bb3306d119cc777fa900ba034cd52',
      treasuryUsd: 450000000,
      treasuryChange24h: 1.8,
      tokenHolders: 38000,
      proposalsCount: 112,
      category: 'DEX',
      founded: '2020-01-14',
    },
    {
      id: 'balancer',
      name: 'Balancer',
      symbol: 'BAL',
      description: 'Automated portfolio manager',
      logo: '⚖️',
      chain: 'Ethereum',
      tokenAddress: '0xba100000625a3754423978a60c9317c58a424e3d',
      treasuryUsd: 125000000,
      treasuryChange24h: -2.1,
      tokenHolders: 25000,
      proposalsCount: 67,
      category: 'DEX',
      founded: '2018-09-06',
    },
    {
      id: 'optimism',
      name: 'Optimism Collective',
      symbol: 'OP',
      description: 'Layer 2 scaling solution',
      logo: '⬆️',
      chain: 'Optimism',
      tokenAddress: '0x4200000000000000000000000000000000000042',
      treasuryUsd: 890000000,
      treasuryChange24h: 4.5,
      tokenHolders: 85000,
      proposalsCount: 34,
      category: 'Layer2',
      founded: '2019-06-12',
    },
    {
      'arbitrum': 'Arbitrum DAO',
      symbol: 'ARB',
      description: 'Layer 2 scaling solution',
      logo: '🔺',
      chain: 'Arbitrum',
      tokenAddress: '0x912ce59144191c1204e64559fe8253a0e49e6548',
      treasuryUsd: 720000000,
      treasuryChange24h: 2.8,
      tokenHolders: 92000,
      proposalsCount: 29,
      category: 'Layer2',
      founded: '2021-08-31',
    },
  ];

  private assets: Record<string, TreasuryAsset[]> = {
    uniswap: [
      { symbol: 'UNI', name: 'Uniswap', address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984', chain: 'Ethereum', amount: 185000000, valueUsd: 925000000, percentage: 37.8, priceChange24h: 2.5, type: 'erc20', logo: '🦄' },
      { symbol: 'ETH', name: 'Ethereum', address: '0x0000000000000000000000000000000000000000', chain: 'Ethereum', amount: 285000, valueUsd: 712500000, percentage: 29.1, priceChange24h: 3.2, type: 'native', logo: 'Ξ' },
      { symbol: 'USDC', name: 'USD Coin', address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', chain: 'Ethereum', amount: 450000000, valueUsd: 450000000, percentage: 18.4, priceChange24h: 0, type: 'erc20', logo: '💵' },
      { symbol: 'WBTC', name: 'Wrapped Bitcoin', address: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599', chain: 'Ethereum', amount: 5200, valueUsd: 312000000, percentage: 12.7, priceChange24h: 1.8, type: 'erc20', logo: '₿' },
      { symbol: 'DAI', name: 'Dai', address: '0x6b175474e89094c44da98b954eedeac495271d0f', chain: 'Ethereum', amount: 25000000, valueUsd: 25000000, percentage: 1.0, priceChange24h: -0.1, type: 'erc20', logo: '◈' },
      { symbol: 'USDT', name: 'Tether', address: '0xdac17f958d2ee523a2206206994597c13d831ec7', chain: 'Ethereum', amount: 12000000, valueUsd: 12000000, percentage: 0.5, priceChange24h: 0, type: 'erc20', logo: '₮' },
      { symbol: 'MATIC', name: 'Polygon', address: '0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0', chain: 'Ethereum', amount: 2500000, valueUsd: 1875000, percentage: 0.1, priceChange24h: -1.5, type: 'erc20', logo: 'MATIC' },
      { symbol: 'ARB', name: 'Arbitrum', address: '0x912ce59144191c1204e64559fe8253a0e49e6548', chain: 'Ethereum', amount: 1500000, valueUsd: 1350000, percentage: 0.1, priceChange24h: 2.8, type: 'erc20', logo: 'ARB' },
      { symbol: 'OP', name: 'Optimism', address: '0x4200000000000000000000000000000000000042', chain: 'Ethereum', amount: 1200000, valueUsd: 1080000, percentage: 0.1, priceChange24h: 4.5, type: 'erc20', logo: 'OP' },
    ],
    aave: [
      { symbol: 'AAVE', name: 'Aave', address: '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9', chain: 'Ethereum', amount: 8500000, valueUsd: 1020000000, percentage: 55.1, priceChange24h: -1.2, type: 'erc20', logo: '👻' },
      { symbol: 'ETH', name: 'Ethereum', address: '0x0000000000000000000000000000000000000000', chain: 'Ethereum', amount: 180000, valueUsd: 450000000, percentage: 24.3, priceChange24h: 3.2, type: 'native', logo: 'Ξ' },
      { symbol: 'USDC', name: 'USD Coin', address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', chain: 'Ethereum', amount: 280000000, valueUsd: 280000000, percentage: 15.1, priceChange24h: 0, type: 'erc20', logo: '💵' },
      { symbol: 'WBTC', name: 'Wrapped Bitcoin', address: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599', chain: 'Ethereum', amount: 1800, valueUsd: 108000000, percentage: 5.8, priceChange24h: 1.8, type: 'erc20', logo: '₿' },
    ],
    compound: [
      { symbol: 'COMP', name: 'Compound', address: '0xc00e94cb662c3520282e6f5717214004a7f26888', chain: 'Ethereum', amount: 4200000, valueUsd: 252000000, percentage: 60.0, priceChange24h: 0.8, type: 'erc20', logo: '🏦' },
      { symbol: 'ETH', name: 'Ethereum', address: '0x0000000000000000000000000000000000000000', chain: 'Ethereum', amount: 42000, valueUsd: 105000000, percentage: 25.0, priceChange24h: 3.2, type: 'native', logo: 'Ξ' },
      { symbol: 'USDC', name: 'USD Coin', address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', chain: 'Ethereum', amount: 63000000, valueUsd: 63000000, percentage: 15.0, priceChange24h: 0, type: 'erc20', logo: '💵' },
    ],
    makerdao: [
      { symbol: 'MKR', name: 'Maker', address: '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2', chain: 'Ethereum', amount: 580000, valueUsd: 1160000000, percentage: 55.2, priceChange24h: 1.5, type: 'erc20', logo: '🎩' },
      { symbol: 'ETH', name: 'Ethereum', address: '0x0000000000000000000000000000000000000000', chain: 'Ethereum', amount: 220000, valueUsd: 550000000, percentage: 26.2, priceChange24h: 3.2, type: 'native', logo: 'Ξ' },
      { symbol: 'USDC', name: 'USD Coin', address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', chain: 'Ethereum', amount: 280000000, valueUsd: 280000000, percentage: 13.3, priceChange24h: 0, type: 'erc20', logo: '💵' },
      { symbol: 'DAI', name: 'Dai', address: '0x6b175474e89094c44da98b954eedeac495271d0f', chain: 'Ethereum', amount: 97000000, valueUsd: 97000000, percentage: 4.6, priceChange24h: -0.1, type: 'erc20', logo: '◈' },
    ],
    lido: [
      { symbol: 'LDO', name: 'Lido DAO', address: '0x5a98fcbea516cf06857215779fd812ca3bef1b32', chain: 'Ethereum', amount: 85000000, valueUsd: 680000000, percentage: 69.4, priceChange24h: 3.2, type: 'erc20', logo: '💧' },
      { symbol: 'stETH', name: 'Lido Staked Ether', address: '0xae7ab96520de3a18e5e111b5eaab095312d7fe84', chain: 'Ethereum', amount: 150000, valueUsd: 225000000, percentage: 23.0, priceChange24h: 3.2, type: 'erc20', logo: 'stETH' },
      { symbol: 'USDC', name: 'USD Coin', address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', chain: 'Ethereum', amount: 75000000, valueUsd: 75000000, percentage: 7.7, priceChange24h: 0, type: 'erc20', logo: '💵' },
    ],
  };

  private transactions: Record<string, TreasuryTransaction[]> = {
    uniswap: [
      { id: 'tx1', daoId: 'uniswap', daoName: 'Uniswap', type: 'income', category: 'investment', amount: 15000000, amountUsd: 15000000, tokenSymbol: 'USDC', from: '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B', to: '0x1a7c4c4c1e2e2c2d5e5f5f5f5f5f5f5f5f5f5f5f', description: 'Strategic investment from Paradigm', txHash: '0x1234...5678', timestamp: '2026-03-01T14:30:00Z', status: 'completed' },
      { id: 'tx2', daoId: 'uniswap', daoName: 'Uniswap', type: 'expense', category: 'grant', amount: 2500000, amountUsd: 2500000, tokenSymbol: 'USDC', from: '0x1a7c4c4c1e2e2c2d5e5f5f5f5f5f5f5f5f5f5f5f', to: '0x9876543210abcdef9876543210abcdef98765432', description: 'Quarterly grant to developer community', txHash: '0xabcd...efgh', timestamp: '2026-02-28T10:00:00Z', status: 'completed' },
      { id: 'tx3', daoId: 'uniswap', daoName: 'Uniswap', type: 'expense', category: 'operational', amount: 850000, amountUsd: 850000, tokenSymbol: 'USDC', from: '0x1a7c4c4c1e2e2c2d5e5f5f5f5f5f5f5f5f5f5f5f', to: '0x1111111111111111111111111111111111111111', description: 'Operational expenses - Q1 2026', txHash: '0x1111...2222', timestamp: '2026-02-25T09:00:00Z', status: 'completed' },
      { id: 'tx4', daoId: 'uniswap', daoName: 'Uniswap', type: 'income', category: 'buyback', amount: 5000000, amountUsd: 5000000, tokenSymbol: 'UNI', from: '0xSushiSwap:0x1f9840a85d5af5bf1d1762f925bdaddc4201f984', to: '0x1a7c4c4c1e2e2c2d5e5f5f5f5f5f5f5f5f5f5f5f', description: 'Token buyback from market', txHash: '0x3333...4444', timestamp: '2026-02-20T16:00:00Z', status: 'completed' },
      { id: 'tx5', daoId: 'uniswap', daoName: 'Uniswap', type: 'expense', category: 'development', amount: 3200000, amountUsd: 3200000, tokenSymbol: 'USDC', from: '0x1a7c4c4c1e2e2c2d5e5f5f5f5f5f5f5f5f5f5f5f', to: '0x2222222222222222222222222222222222222222', description: 'Protocol development funding', txHash: '0x5555...6666', timestamp: '2026-02-15T11:30:00Z', status: 'completed' },
      { id: 'tx6', daoId: 'uniswap', daoName: 'Uniswap', type: 'income', category: 'grant', amount: 8000000, amountUsd: 8000000, tokenSymbol: 'USDC', from: '0xETHFoundation:0x0000000000000000000000000000000000000000', to: '0x1a7c4c4c1e2e2c2d5e5f5f5f5f5f5f5f5f5f5f5f', description: 'Ethereum Foundation grant', txHash: '0x7777...8888', timestamp: '2026-02-10T08:00:00Z', status: 'completed' },
      { id: 'tx7', daoId: 'uniswap', daoName: 'Uniswap', type: 'expense', category: 'airdrop', amount: 15000000, amountUsd: 15000000, tokenSymbol: 'UNI', from: '0x1a7c4c4c1e2e2c2d5e5f5f5f5f5f5f5f5f5f5f5f', to: '0x3333333333333333333333333333333333333333', description: 'Community airdrop distribution', txHash: '0x9999...aaaa', timestamp: '2026-02-05T15:00:00Z', status: 'completed' },
      { id: 'tx8', daoId: 'uniswap', daoName: 'Uniswap', type: 'expense', category: 'team', amount: 4500000, amountUsd: 4500000, tokenSymbol: 'USDC', from: '0x1a7c4c4c1e2e2c2d5e5f5f5f5f5f5f5f5f5f5f5f', to: '0x4444444444444444444444444444444444444444', description: 'Team compensation - February 2026', txHash: '0xbbbb...cccc', timestamp: '2026-02-01T12:00:00Z', status: 'completed' },
    ],
    aave: [
      { id: 'tx9', daoId: 'aave', daoName: 'Aave', type: 'income', category: 'investment', amount: 25000000, amountUsd: 25000000, tokenSymbol: 'USDC', from: '0xABCD...1234', to: '0xaaaaaaaa2525252525252525252525252525252525', description: 'Strategic funding round', txHash: '0x1111...2222', timestamp: '2026-02-28T10:00:00Z', status: 'completed' },
      { id: 'tx10', daoId: 'aave', daoName: 'Aave', type: 'expense', category: 'development', amount: 5000000, amountUsd: 5000000, tokenSymbol: 'USDC', from: '0xaaaaaaaa2525252525252525252525252525252525', to: '0xbbbbbbbb2525252525252525252525252525252525', description: 'V3 development funding', txHash: '0x3333...4444', timestamp: '2026-02-20T14:00:00Z', status: 'completed' },
    ],
    makerdao: [
      { id: 'tx11', daoId: 'makerdao', daoName: 'MakerDAO', type: 'income', category: 'operational', amount: 15000000, amountUsd: 15000000, tokenSymbol: 'USDC', from: '0xCCCC...5678', to: '0xdddddd2525252525252525252525252525252525', description: 'Protocol surplus', txHash: '0x5555...6666', timestamp: '2026-03-01T08:00:00Z', status: 'completed' },
      { id: 'tx12', daoId: 'makerdao', daoName: 'MakerDAO', type: 'expense', category: 'buyback', amount: 8000000, amountUsd: 8000000, tokenSymbol: 'MKR', from: '0xdddddd2525252525252525252525252525252525', to: '0xEEEEEE2525252525252525252525252525252525', description: 'MKR buyback and burn', txHash: '0x7777...8888', timestamp: '2026-02-25T16:00:00Z', status: 'completed' },
    ],
  };

  getDaos(category?: string, sort?: string, limit: number = 20): { daos: DAO[]; total: number } {
    let filtered = [...this.daos];
    
    if (category && category !== 'all') {
      filtered = filtered.filter(d => d.category.toLowerCase() === category.toLowerCase());
    }
    
    if (sort === 'treasury') {
      filtered.sort((a, b) => b.treasuryUsd - a.treasuryUsd);
    } else if (sort === 'holders') {
      filtered.sort((a, b) => b.tokenHolders - a.tokenHolders);
    } else if (sort === 'change') {
      filtered.sort((a, b) => b.treasuryChange24h - a.treasuryChange24h);
    } else {
      filtered.sort((a, b) => b.treasuryUsd - a.treasuryUsd);
    }
    
    return {
      daos: filtered.slice(0, limit),
      total: filtered.length,
    };
  }

  getDaoTreasury(id: string): { dao: DAO; assets: TreasuryAsset[] } | null {
    const dao = this.daos.find(d => d.id === id);
    if (!dao) return null;
    
    const assets = this.assets[id] || [];
    return { dao, assets };
  }

  getTreasuryAssets(dao: string, type?: string): TreasuryAsset[] {
    let assets = this.assets[dao] || [];
    
    if (type) {
      assets = assets.filter(a => a.type === type);
    }
    
    return assets.sort((a, b) => b.valueUsd - a.valueUsd);
  }

  getTreasuryTransactions(dao: string, type?: string, limit: number = 50): TreasuryTransaction[] {
    let txs = this.transactions[dao] || [];
    
    if (type) {
      txs = txs.filter(t => t.type === type);
    }
    
    return txs
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  getFlowAnalysis(dao: string, period: string): FlowData {
    const periodDays = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 30;
    
    const incomeCategories = [
      { category: 'investment', amount: 15000000 + Math.random() * 10000000 },
      { category: 'grant', amount: 8000000 + Math.random() * 5000000 },
      { category: 'buyback', amount: 5000000 + Math.random() * 3000000 },
    ];
    
    const outflowCategories = [
      { category: 'grant', amount: 2500000 + Math.random() * 2000000 },
      { category: 'development', amount: 3200000 + Math.random() * 2000000 },
      { category: 'operational', amount: 850000 + Math.random() * 500000 },
      { category: 'team', amount: 4500000 + Math.random() * 1000000 },
      { category: 'airdrop', amount: 15000000 + Math.random() * 5000000 },
    ];
    
    const totalInflow = incomeCategories.reduce((sum, c) => sum + c.amount, 0);
    const totalOutflow = outflowCategories.reduce((sum, c) => sum + c.amount, 0);
    
    const dailyFlow = [];
    for (let i = periodDays - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dailyFlow.push({
        date: date.toISOString().split('T')[0],
        inflow: totalInflow / periodDays * (0.5 + Math.random()),
        outflow: totalOutflow / periodDays * (0.5 + Math.random()),
      });
    }
    
    return {
      period,
      totalInflow,
      totalOutflow,
      netFlow: totalInflow - totalOutflow,
      inflowByCategory: incomeCategories,
      outflowByCategory: outflowCategories,
      dailyFlow,
    };
  }

  getTokenHolders(dao: string, limit: number = 50): any[] {
    const holders = [
      { address: '0x1a7c4c4c1e2e2c2d5e5f5f5f5f5f5f5f5f5f5f5f', balance: 18500000, percentage: 10.0, votingPower: 12.5, isDelegate: true, label: 'Treasury' },
      { address: '0x2b8c4c4c1e2e2c2d5e5f5f5f5f5f5f5f5f5f5f5f', balance: 9250000, percentage: 5.0, votingPower: 6.2, isDelegate: true, label: 'Paradigm' },
      { address: '0x3c9c4c4c1e2e2c2d5e5f5f5f5f5f5f5f5f5f5f5f', balance: 7400000, percentage: 4.0, votingPower: 4.8, isDelegate: true, label: 'a16z' },
      { address: '0x4d0c4c4c1e2e2c2d5e5f5f5f5f5f5f5f5f5f5f5f', balance: 5550000, percentage: 3.0, votingPower: 3.5, isDelegate: false, label: 'Wintermute' },
      { address: '0x5e1d4c4c1e2e2c2d5e5f5f5f5f5f5f5f5f5f5f5f', balance: 3700000, percentage: 2.0, votingPower: 2.1, isDelegate: true, label: 'Delaware' },
      { address: '0x6f2e4c4c1e2e2c2d5e5f5f5f5f5f5f5f5f5f5f5f', balance: 2775000, percentage: 1.5, votingPower: 1.8, isDelegate: false, label: 'Jump Crypto' },
      { address: '0x7a3f4c4c1e2e2c2d5e5f5f5f5f5f5f5f5f5f5f5f', balance: 1850000, percentage: 1.0, votingPower: 1.2, isDelegate: false, label: 'Jane Street' },
      { address: '0x8b4g5c4c1e2e2c2d5e5f5f5f5f5f5f5f5f5f5f5f', balance: 925000, percentage: 0.5, votingPower: 0.6, isDelegate: false, label: 'Coinbase' },
    ];
    
    return holders.slice(0, limit);
  }

  getTreasuryProposals(dao: string, status?: string, limit: number = 20): TreasuryProposal[] {
    const proposals: TreasuryProposal[] = [
      {
        id: 'prop1',
        daoId: dao,
        daoName: this.daos.find(d => d.id === dao)?.name || dao,
        title: 'Allocate 5M USDC for Ecosystem Grants',
        description: 'Proposal to allocate treasury funds for Q2 2026 ecosystem development grants',
        status: 'passed',
        type: 'treasury',
        amount: 5000000,
        amountUsd: 5000000,
        recipient: '0x1111111111111111111111111111111111111111',
        forVotes: 15000000,
        againstVotes: 2500000,
        startTime: '2026-02-01T00:00:00Z',
        endTime: '2026-02-08T00:00:00Z',
        proposer: '0x2222222222222222222222222222222222222222',
      },
      {
        id: 'prop2',
        daoId: dao,
        daoName: this.daos.find(d => d.id === dao)?.name || dao,
        title: 'Treasury Diversification Strategy',
        description: 'Reduce concentration risk by diversifying 30% of treasury into stablecoins',
        status: 'active',
        type: 'treasury',
        amount: 750000000,
        amountUsd: 750000000,
        recipient: '0x3333333333333333333333333333333333333333',
        forVotes: 8500000,
        againstVotes: 4200000,
        startTime: '2026-02-25T00:00:00Z',
        endTime: '2026-03-04T00:00:00Z',
        proposer: '0x4444444444444444444444444444444444444444',
      },
      {
        id: 'prop3',
        daoId: dao,
        daoName: this.daos.find(d => d.id === dao)?.name || dao,
        title: 'Buyback and Burn Program',
        description: 'Implement quarterly token buyback and burn from treasury',
        status: 'passed',
        type: 'treasury',
        amount: 10000000,
        amountUsd: 10000000,
        recipient: '0x5555555555555555555555555555555555555555',
        forVotes: 22000000,
        againstVotes: 1800000,
        startTime: '2026-01-15T00:00:00Z',
        endTime: '2026-01-22T00:00:00Z',
        proposer: '0x6666666666666666666666666666666666666666',
      },
      {
        id: 'prop4',
        daoId: dao,
        daoName: this.daos.find(d => d.id === dao)?.name || dao,
        title: 'Team Compensation Adjustment',
        description: 'Adjust team compensation package for 2026',
        status: 'failed',
        type: 'treasury',
        amount: 8000000,
        amountUsd: 8000000,
        recipient: '0x7777777777777777777777777777777777777777',
        forVotes: 3500000,
        againstVotes: 12000000,
        startTime: '2026-01-01T00:00:00Z',
        endTime: '2026-01-08T00:00:00Z',
        proposer: '0x8888888888888888888888888888888888888888',
      },
      {
        id: 'prop5',
        daoId: dao,
        daoName: this.daos.find(d => d.id === dao)?.name || dao,
        title: 'Protocol Development Funding',
        description: 'Fund continued protocol development and security audits',
        status: 'executed',
        type: 'treasury',
        amount: 15000000,
        amountUsd: 15000000,
        recipient: '0x9999999999999999999999999999999999999999',
        forVotes: 28000000,
        againstVotes: 1200000,
        startTime: '2025-12-01T00:00:00Z',
        endTime: '2025-12-08T00:00:00Z',
        proposer: '0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      },
    ];
    
    let filtered = proposals.filter(p => p.daoId === dao);
    
    if (status) {
      filtered = filtered.filter(p => p.status === status);
    }
    
    return filtered.slice(0, limit);
  }

  getTreasuryStats(dao: string): TreasuryStats {
    const daoData = this.daos.find(d => d.id === dao);
    const assets = this.assets[dao] || [];
    const txs = this.transactions[dao] || [];
    
    const totalValue = daoData?.treasuryUsd || 0;
    const largestAsset = assets.sort((a, b) => b.valueUsd - a.valueUsd)[0];
    const avgTransactionSize = txs.length > 0 
      ? txs.reduce((sum, t) => sum + t.amountUsd, 0) / txs.length 
      : 0;
    
    return {
      totalValue,
      change24h: daoData?.treasuryChange24h || 0,
      change7d: (daoData?.treasuryChange24h || 0) * 7 * 0.1,
      change30d: (daoData?.treasuryChange24h || 0) * 30 * 0.15,
      assetCount: assets.length,
      largestHolding: largestAsset?.symbol || 'N/A',
      largestHoldingPercentage: largestAsset?.percentage || 0,
      avgTransactionSize,
      transactionsCount: txs.length,
    };
  }

  getTreasuryTrends(dao: string, period: string): any[] {
    const periodDays = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 30;
    const daoData = this.daos.find(d => d.id === dao);
    const baseValue = daoData?.treasuryUsd || 1000000000;
    
    const trends = [];
    for (let i = periodDays; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const variance = (Math.random() - 0.5) * 0.1;
      const trend = baseValue * (1 + variance - (i / periodDays) * 0.05);
      trends.push({
        date: date.toISOString().split('T')[0],
        value: trend,
        change: variance * 100,
      });
    }
    
    return trends;
  }

  searchDaos(query: string): DAO[] {
    const q = query.toLowerCase();
    return this.daos.filter(d => 
      d.name.toLowerCase().includes(q) || 
      d.symbol.toLowerCase().includes(q) ||
      d.category.toLowerCase().includes(q)
    );
  }

  compareTreasuries(daoList: string[]): any[] {
    return daoList.map(id => {
      const dao = this.daos.find(d => d.id === id);
      const stats = this.getTreasuryStats(id);
      return {
        ...dao,
        stats,
      };
    });
  }

  getTreasuryAlerts(dao: string): TreasuryAlert[] {
    return [
      {
        id: 'alert1',
        daoId: dao,
        type: 'large_inflow',
        severity: 'info',
        message: 'Large treasury inflow detected: 15M USDC from strategic investment',
        amount: 15000000,
        timestamp: '2026-03-01T14:30:00Z',
        txHash: '0x1234...5678',
      },
      {
        id: 'alert2',
        daoId: dao,
        type: 'threshold_breach',
        severity: 'warning',
        message: 'Treasury ETH allocation exceeded 30% threshold',
        amount: 285000,
        timestamp: '2026-02-28T10:00:00Z',
      },
      {
        id: 'alert3',
        daoId: dao,
        type: 'large_outflow',
        severity: 'critical',
        message: 'Large treasury outflow: 15M UNI for community airdrop',
        amount: 15000000,
        timestamp: '2026-02-05T15:00:00Z',
        txHash: '0x9999...aaaa',
      },
    ];
  }
}
