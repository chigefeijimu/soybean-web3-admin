import { Controller, Get, Post, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';

export interface ProtocolInfo {
  name: string;
  logo: string;
  category: 'lending' | 'dex' | 'yield' | 'liquid-staking' | 'bridge';
  chain: string;
  tvl: number;
  tvlChange24h: number;
  volume24h: number;
  fees24h: number;
  avgApy: number;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  popularPools: PoolInfo[];
}

export interface PoolInfo {
  name: string;
  token0: string;
  token1: string;
  tvl: number;
  apy: number;
  volume24h: number;
  poolAddress: string;
}

export interface ProtocolHistory {
  date: string;
  tvl: number;
  volume: number;
  fees: number;
}

export interface ChainStats {
  chain: string;
  chainId: number;
  totalTvl: number;
  protocolCount: number;
  topProtocols: string[];
}

export interface MarketOverview {
  totalTvl: number;
  totalTvlChange24h: number;
  totalVolume24h: number;
  totalFees24h: number;
  topChains: ChainStats[];
  topProtocols: ProtocolInfo[];
}

@ApiTags('web3-defi-analytics')
@Controller('api/web3/defi-analytics')
export class Web3DefiAnalyticsController {
  // In-memory storage for demo
  private protocols: Map<string, ProtocolInfo> = new Map();
  private protocolHistory: Map<string, ProtocolHistory[]> = new Map();

  constructor() {
    this.initializeSampleData();
  }

  private initializeSampleData() {
    const sampleProtocols: ProtocolInfo[] = [
      {
        name: 'Aave',
        logo: '👻',
        category: 'lending',
        chain: 'Ethereum',
        tvl: 15600000000,
        tvlChange24h: 2.3,
        volume24h: 890000000,
        fees24h: 4500000,
        avgApy: 4.5,
        riskScore: 15,
        riskLevel: 'low',
        popularPools: [
          { name: 'USDC Supply', token0: 'USDC', token1: '', tvl: 4200000000, apy: 4.2, volume24h: 250000000, poolAddress: '0x7d2768de32b0b80b7a3454c06bdac94a69ddc7a9' },
          { name: 'ETH Collateral', token0: 'ETH', token1: '', tvl: 3800000000, apy: 3.1, volume24h: 180000000, poolAddress: '0x3d9819210A31b4961b30EF54bE2aeD79B9c9Cd3B' },
          { name: 'USDT Supply', token0: 'USDT', token1: '', tvl: 2100000000, apy: 4.8, volume24h: 120000000, poolAddress: '0x7d2768de32b0b80b7a3454c06bdac94a69ddc7a9' }
        ]
      },
      {
        name: 'Uniswap',
        logo: '🦄',
        category: 'dex',
        chain: 'Ethereum',
        tvl: 8500000000,
        tvlChange24h: -1.2,
        volume24h: 2100000000,
        fees24h: 6300000,
        avgApy: 18.5,
        riskScore: 20,
        riskLevel: 'low',
        popularPools: [
          { name: 'USDC/ETH', token0: 'USDC', token1: 'ETH', tvl: 2100000000, apy: 22.5, volume24h: 850000000, poolAddress: '0x8ad599c3A0ff1De082011EFDDc58f1908eb6e6D8' },
          { name: 'USDT/ETH', token0: 'USDT', token1: 'ETH', tvl: 1200000000, apy: 18.2, volume24h: 520000000, poolAddress: '0x4e68Ccd3C25AEDf0E5d8f97b9a7e2f1b8e9f3a1' },
          { name: 'WBTC/ETH', token0: 'WBTC', token1: 'ETH', tvl: 980000000, apy: 15.8, volume24h: 380000000, poolAddress: '0xcbcdf9626bc03e24f779434178a73a0b4bad62ed' }
        ]
      },
      {
        name: 'Lido',
        logo: '🧤',
        category: 'liquid-staking',
        chain: 'Ethereum',
        tvl: 32000000000,
        tvlChange24h: 1.8,
        volume24h: 180000000,
        fees24h: 2100000,
        avgApy: 4.8,
        riskScore: 12,
        riskLevel: 'low',
        popularPools: [
          { name: 'stETH', token0: 'stETH', token1: '', tvl: 32000000000, apy: 4.8, volume24h: 180000000, poolAddress: '0xae7ab96520de3a18e5e111b5eaab095312d7fe84' },
          { name: 'wstETH', token0: 'wstETH', token1: '', tvl: 4500000000, apy: 5.2, volume24h: 85000000, poolAddress: '0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0' }
        ]
      },
      {
        name: 'Compound',
        logo: '🔷',
        category: 'lending',
        chain: 'Ethereum',
        tvl: 2800000000,
        tvlChange24h: 0.5,
        volume24h: 320000000,
        fees24h: 1800000,
        avgApy: 3.8,
        riskScore: 18,
        riskLevel: 'low',
        popularPools: [
          { name: 'USDC Market', token0: 'USDC', token1: '', tvl: 1200000000, apy: 3.5, volume24h: 150000000, poolAddress: '0x3d9819210A31b4961b30EF54bE2aeD79B9c9Cd3B' },
          { name: 'ETH Market', token0: 'ETH', token1: '', tvl: 850000000, apy: 2.8, volume24h: 85000000, poolAddress: '0x3d9819210A31b4961b30EF54bE2aeD79B9c9Cd3B' }
        ]
      },
      {
        name: 'Curve',
        logo: '💚',
        category: 'dex',
        chain: 'Ethereum',
        tvl: 4200000000,
        tvlChange24h: 3.2,
        volume24h: 680000000,
        fees24h: 2100000,
        avgApy: 8.5,
        riskScore: 22,
        riskLevel: 'low',
        popularPools: [
          { name: 'stETH/ETH', token0: 'stETH', token1: 'ETH', tvl: 1800000000, apy: 8.2, volume24h: 320000000, poolAddress: '0xDC24316b9AE028F1497c275EB9192a3Ea0f67022' },
          { name: '3CRV', token0: '3CRV', token1: '', tvl: 1200000000, apy: 5.5, volume24h: 180000000, poolAddress: '0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7' }
        ]
      },
      {
        name: 'Yearn',
        logo: '🎩',
        category: 'yield',
        chain: 'Ethereum',
        tvl: 5200000000,
        tvlChange24h: 1.5,
        volume24h: 420000000,
        fees24h: 3200000,
        avgApy: 12.5,
        riskScore: 35,
        riskLevel: 'medium',
        popularPools: [
          { name: 'yUSDC', token0: 'yUSDC', token1: '', tvl: 2100000000, apy: 5.2, volume24h: 180000000, poolAddress: '0x5f18c75abda262bc554b1e2d0a5a80762af5b8c2' },
          { name: 'yETH', token0: 'yETH', token1: '', tvl: 850000000, apy: 15.8, volume24h: 120000000, poolAddress: '0xa258C4606Ca8206D8aA700cE2143D7db854D168c' }
        ]
      },
      {
        name: 'Morpho',
        logo: '🟣',
        category: 'lending',
        chain: 'Ethereum',
        tvl: 1800000000,
        tvlChange24h: 5.2,
        volume24h: 280000000,
        fees24h: 1400000,
        avgApy: 4.2,
        riskScore: 28,
        riskLevel: 'medium',
        popularPools: [
          { name: 'USDC Supply', token0: 'USDC', token1: '', tvl: 720000000, apy: 4.5, volume24h: 120000000, poolAddress: '0x888888888888c8c88f5c9e5f3d2f3e9b8a7c8d9e0' },
          { name: 'ETH Supply', token0: 'ETH', token1: '', tvl: 580000000, apy: 3.8, volume24h: 85000000, poolAddress: '0x888888888888c8c88f5c9e5f3d2f3e9b8a7c8d9e0' }
        ]
      },
      {
        name: 'Gearbox',
        logo: '⚙️',
        category: 'lending',
        chain: 'Ethereum',
        tvl: 320000000,
        tvlChange24h: 8.5,
        volume24h: 180000000,
        fees24h: 850000,
        avgApy: 8.8,
        riskScore: 45,
        riskLevel: 'medium',
        popularPools: [
          { name: 'dUSDC', token0: 'dUSDC', token1: '', tvl: 180000000, apy: 6.5, volume24h: 95000000, poolAddress: '0x7777777777777777777777777777777777777777' },
          { name: 'dETH', token0: 'dETH', token1: '', tvl: 85000000, apy: 12.5, volume24h: 55000000, poolAddress: '0x7777777777777777777777777777777777777777' }
        ]
      }
    ];

    sampleProtocols.forEach(p => this.protocols.set(p.name.toLowerCase(), p));

    // Initialize history
    const now = new Date();
    ['aave', 'uniswap', 'lido', 'compound', 'curve', 'yearn', 'morpho', 'gearbox'].forEach(name => {
      const history: ProtocolHistory[] = [];
      let baseTvl = this.protocols.get(name)?.tvl || 1000000000;
      for (let i = 30; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        baseTvl *= 1 + (Math.random() * 0.04 - 0.02);
        history.push({
          date: date.toISOString().split('T')[0],
          tvl: baseTvl,
          volume: baseTvl * (Math.random() * 0.15 + 0.05),
          fees: baseTvl * (Math.random() * 0.001 + 0.0002)
        });
      }
      this.protocolHistory.set(name, history);
    });
  }

  @Get('overview')
  @ApiOperation({ summary: 'Get DeFi market overview' })
  async getMarketOverview(): Promise<MarketOverview> {
    const allProtocols = Array.from(this.protocols.values());
    
    const totalTvl = allProtocols.reduce((sum, p) => sum + p.tvl, 0);
    const totalTvlChange24h = allProtocols.reduce((sum, p) => sum + p.tvlChange24h, 0) / allProtocols.length;
    const totalVolume24h = allProtocols.reduce((sum, p) => sum + p.volume24h, 0);
    const totalFees24h = allProtocols.reduce((sum, p) => sum + p.fees24h, 0);

    const topChains: ChainStats[] = [
      { chain: 'Ethereum', chainId: 1, totalTvl: 72000000000, protocolCount: 156, topProtocols: ['Aave', 'Uniswap', 'Lido'] },
      { chain: 'Arbitrum', chainId: 42161, totalTvl: 18000000000, protocolCount: 89, topProtocols: ['GMX', 'Uniswap', 'Curve'] },
      { chain: 'Polygon', chainId: 137, totalTvl: 12000000000, protocolCount: 78, topProtocols: ['Aave', 'QuickSwap', 'Curve'] },
      { chain: 'Optimism', chainId: 10, totalTvl: 8500000000, protocolCount: 62, topProtocols: ['Uniswap', 'Velodrome', 'Aave'] },
      { chain: 'Base', chainId: 8453, totalTvl: 5200000000, protocolCount: 45, topProtocols: ['Aerodrome', 'Uniswap', 'Compound'] }
    ];

    const topProtocols = allProtocols
      .sort((a, b) => b.tvl - a.tvl)
      .slice(0, 10);

    return {
      totalTvl,
      totalTvlChange24h,
      totalVolume24h,
      totalFees24h,
      topChains,
      topProtocols
    };
  }

  @Get('protocols')
  @ApiOperation({ summary: 'Get all DeFi protocols' })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'chain', required: false })
  @ApiQuery({ name: 'sortBy', required: false })
  async getProtocols(
    @Query('category') category?: string,
    @Query('chain') chain?: string,
    @Query('sortBy') sortBy: string = 'tvl'
  ): Promise<ProtocolInfo[]> {
    let protocols = Array.from(this.protocols.values());

    if (category) {
      protocols = protocols.filter(p => p.category === category);
    }
    if (chain) {
      protocols = protocols.filter(p => p.chain.toLowerCase() === chain.toLowerCase());
    }

    switch (sortBy) {
      case 'tvl':
        protocols.sort((a, b) => b.tvl - a.tvl);
        break;
      case 'volume':
        protocols.sort((a, b) => b.volume24h - a.volume24h);
        break;
      case 'apy':
        protocols.sort((a, b) => b.avgApy - a.avgApy);
        break;
      case 'risk':
        protocols.sort((a, b) => a.riskScore - b.riskScore);
        break;
    }

    return protocols;
  }

  @Get('protocols/:name')
  @ApiOperation({ summary: 'Get specific protocol details' })
  async getProtocolDetails(@Param('name') name: string): Promise<ProtocolInfo | null> {
    return this.protocols.get(name.toLowerCase()) || null;
  }

  @Get('protocols/:name/history')
  @ApiOperation({ summary: 'Get protocol historical data' })
  @ApiQuery({ name: 'days', required: false, type: Number })
  async getProtocolHistory(
    @Param('name') name: string,
    @Query('days') days: number = 30
  ): Promise<ProtocolHistory[]> {
    const history = this.protocolHistory.get(name.toLowerCase()) || [];
    return history.slice(-days);
  }

  @Get('protocols/:name/pools')
  @ApiOperation({ summary: 'Get protocol pools' })
  async getProtocolPools(@Param('name') name: string): Promise<PoolInfo[]> {
    const protocol = this.protocols.get(name.toLowerCase());
    return protocol?.popularPools || [];
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get DeFi categories' })
  async getCategories() {
    return [
      { name: 'lending', label: 'Lending', count: 45, description: 'Decentralized lending protocols' },
      { name: 'dex', label: 'DEX', count: 38, description: 'Decentralized exchanges' },
      { name: 'yield', label: 'Yield', count: 28, description: 'Yield aggregators' },
      { name: 'liquid-staking', label: 'Liquid Staking', count: 15, description: 'Liquid staking derivatives' },
      { name: 'bridge', label: 'Bridge', count: 22, description: 'Cross-chain bridges' }
    ];
  }

  @Get('chains')
  @ApiOperation({ summary: 'Get supported chains' })
  async getChains() {
    return [
      { name: 'Ethereum', chainId: 1, symbol: 'ETH', logo: '🔷' },
      { name: 'Polygon', chainId: 137, symbol: 'MATIC', logo: '🔵' },
      { name: 'Arbitrum', chainId: 42161, symbol: 'ETH', logo: '🔴' },
      { name: 'Optimism', chainId: 10, symbol: 'ETH', logo: '🔴' },
      { name: 'Base', chainId: 8453, symbol: 'ETH', logo: '🔵' },
      { name: 'Avalanche', chainId: 43114, symbol: 'AVAX', logo: '🟥' },
      { name: 'BSC', chainId: 56, symbol: 'BNB', logo: '🟡' }
    ];
  }

  @Get('compare')
  @ApiOperation({ summary: 'Compare multiple protocols' })
  @ApiQuery({ name: 'names', required: false })
  async compareProtocols(@Query('names') names?: string): Promise<ProtocolInfo[]> {
    if (!names) return Array.from(this.protocols.values()).slice(0, 4);
    
    const nameList = names.split(',').map(n => n.trim().toLowerCase());
    return nameList.map(name => this.protocols.get(name)).filter((p): p is ProtocolInfo => !!p);
  }

  @Get('trending')
  @ApiOperation({ summary: 'Get trending protocols by TVL growth' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getTrendingProtocols(@Query('limit') limit: number = 5): Promise<ProtocolInfo[]> {
    return Array.from(this.protocols.values())
      .sort((a, b) => b.tvlChange24h - a.tvlChange24h)
      .slice(0, limit);
  }

  @Get('risk-analysis')
  @ApiOperation({ summary: 'Get risk analysis for protocols' })
  async getRiskAnalysis() {
    const protocols = Array.from(this.protocols.values());
    return {
      low: protocols.filter(p => p.riskLevel === 'low'),
      medium: protocols.filter(p => p.riskLevel === 'medium'),
      high: protocols.filter(p => p.riskLevel === 'high'),
      summary: {
        lowCount: protocols.filter(p => p.riskLevel === 'low').length,
        mediumCount: protocols.filter(p => p.riskLevel === 'medium').length,
        highCount: protocols.filter(p => p.riskLevel === 'high').length
      }
    };
  }
}
