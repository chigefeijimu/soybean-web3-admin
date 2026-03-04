import { Injectable } from '@nestjs/common';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, Min, Max } from 'class-validator';

// DTOs
export class PoolQueryDto {
  @ApiPropertyOptional({ description: 'Chain name (ethereum, polygon, arbitrum, etc.)' })
  @IsOptional()
  @IsString()
  chain?: string;

  @ApiPropertyOptional({ description: 'DEX name (uniswap, sushiswap, curve, etc.)' })
  @IsOptional()
  @IsString()
  dex?: string;

  @ApiPropertyOptional({ description: 'Token symbol (e.g., ETH, USDC)' })
  @IsOptional()
  @IsString()
  token?: string;

  @ApiPropertyOptional({ description: 'Minimum TVL in USD' })
  @IsOptional()
  @IsNumber()
  minTvl?: number;

  @ApiPropertyOptional({ description: 'Sort by (tvl, volume, apy, fees)' })
  @IsOptional()
  @IsString()
  sortBy?: string = 'tvl';

  @ApiPropertyOptional({ description: 'Page number' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Page size' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

export class PoolDetailDto {
  @ApiProperty({ description: 'Pool address' })
  address: string;

  @ApiProperty({ description: 'Chain name' })
  chain: string;

  @ApiProperty({ description: 'DEX name' })
  dex: string;

  @ApiProperty({ description: 'Token pair (e.g., ETH/USDC)' })
  tokenPair: string;

  @ApiProperty({ description: 'Token0 address' })
  token0: string;

  @ApiProperty({ description: 'Token1 address' })
  token1: string;

  @ApiProperty({ description: 'TVL in USD' })
  tvl: number;

  @ApiProperty({ description: '24h volume' })
  volume24h: number;

  @ApiProperty({ description: '24h fees' })
  fees24h: number;

  @ApiProperty({ description: 'APY percentage' })
  apy: number;

  @ApiProperty({ description: 'Token0 price' })
  token0Price: number;

  @ApiProperty({ description: 'Token1 price' })
  token1Price: number;

  @ApiProperty({ description: 'Token0 reserves' })
  token0Reserves: string;

  @ApiProperty({ description: 'Token1 reserves' })
  token1Reserves: string;

  @ApiProperty({ description: 'Liquidity score (0-100)' })
  liquidityScore: number;

  @ApiProperty({ description: '24h change percentage' })
  change24h: number;

  @ApiProperty({ description: 'Pool creation timestamp' })
  createdAt: number;
}

export class PoolListDto {
  @ApiProperty({ type: [PoolDetailDto] })
  pools: PoolDetailDto[];

  @ApiProperty({ description: 'Total count' })
  total: number;

  @ApiProperty({ description: 'Page number' })
  page: number;

  @ApiProperty({ description: 'Page size' })
  limit: number;

  @ApiProperty({ description: 'Total pages' })
  totalPages: number;
}

export class PoolComparisonDto {
  @ApiProperty({ description: 'Pool addresses to compare' })
  pools: string[];
}

export class TrendingPoolDto {
  @ApiProperty({ description: 'Pool address' })
  address: string;

  @ApiProperty({ description: 'Token pair' })
  tokenPair: string;

  @ApiProperty({ description: 'Chain' })
  chain: string;

  @ApiProperty({ description: 'DEX' })
  dex: string;

  @ApiProperty({ description: 'TVL in USD' })
  tvl: number;

  @ApiProperty({ description: '24h volume change %' })
  volumeChange: number;

  @ApiProperty({ description: 'APY' })
  apy: number;

  @ApiProperty({ description: 'Trending score' })
  trendingScore: number;
}

export class PoolStatsDto {
  @ApiProperty({ description: 'Total pools across all chains' })
  totalPools: number;

  @ApiProperty({ description: 'Total TVL in USD' })
  totalTvl: number;

  @ApiProperty({ description: 'Total 24h volume' })
  totalVolume24h: number;

  @ApiProperty({ description: 'Total 24h fees' })
  totalFees24h: number;

  @ApiProperty({ description: 'Average APY' })
  avgApy: number;

  @ApiProperty({ description: 'Chain distribution', type: Object })
  chainDistribution: Record<string, number>;

  @ApiProperty({ description: 'DEX distribution', type: Object })
  dexDistribution: Record<string, number>;

  @ApiProperty({ description: 'Top tokens by TVL', type: [String] })
  topTokens: string[];
}

export class PoolSearchDto {
  @ApiProperty({ description: 'Search query (token pair or address)' })
  @IsString()
  query: string;

  @ApiPropertyOptional({ description: 'Chain filter' })
  @IsOptional()
  @IsString()
  chain?: string;

  @ApiPropertyOptional({ description: 'Limit results' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  limit?: number = 10;
}

// Supported chains and DEXes
const SUPPORTED_CHAINS = [
  'ethereum', 'polygon', 'arbitrum', 'optimism', 'bsc', 'base', 'avalanche', 'solana'
];

const SUPPORTED_DEXES = [
  'uniswap-v3', 'uniswap-v2', 'sushiswap', 'curve', 'balancer', 
  'pancakeswap', 'quickswap', 'aerodrome', 'velodrome', 'trader-joe', 'orca', 'raydium'
];

// Mock data generator
function generateMockPools(query: PoolQueryDto): PoolDetailDto[] {
  const pools: PoolDetailDto[] = [];
  const tokenPairs = [
    { pair: 'ETH/USDC', t0: 'ETH', t1: 'USDC', t0p: 1, t1p: 3250 },
    { pair: 'ETH/USDT', t0: 'ETH', t1: 'USDT', t0p: 1, t1p: 3250 },
    { pair: 'WBTC/USDC', t0: 'WBTC', t1: 'USDC', t0p: 1, t1p: 67500 },
    { pair: 'USDC/USDT', t0: 'USDC', t1: 'USDT', t0p: 1, t1p: 1 },
    { pair: 'ETH/WBTC', t0: 'ETH', t1: 'WBTC', t0p: 1, t1p: 20.8 },
    { pair: 'UNI/ETH', t0: 'UNI', t1: 'ETH', t0p: 1, t1p: 7.5 },
    { pair: 'LINK/ETH', t0: 'LINK', t1: 'ETH', t0p: 1, t1p: 14.2 },
    { pair: 'AAVE/ETH', t0: 'AAVE', t1: 'ETH', t0p: 1, t1p: 85.3 },
    { pair: 'CRV/ETH', t0: 'CRV', t1: 'ETH', t0p: 1, t1p: 0.62 },
    { pair: 'MATIC/ETH', t0: 'MATIC', t1: 'ETH', t0p: 1, t1p: 0.42 },
    { pair: 'SOL/ETH', t0: 'SOL', t1: 'ETH', t0p: 1, t1p: 178.5 },
    { pair: 'ARB/ETH', t0: 'ARB', t1: 'ETH', t0p: 1, t1p: 1.15 },
    { pair: 'OP/ETH', t0: 'OP', t1: 'ETH', t0p: 1, t1p: 2.8 },
    { pair: 'LDO/ETH', t0: 'LDO', t1: 'ETH', t0p: 1, t1p: 2.35 },
    { pair: 'MKR/ETH', t0: 'MKR', t1: 'ETH', t0p: 1, t1p: 1450 },
  ];

  const dexes = query.dex ? [query.dex] : SUPPORTED_DEXES;
  const chains = query.chain ? [query.chain] : SUPPORTED_CHAINS;

  let id = 1;
  for (const chain of chains) {
    for (const dex of dexes) {
      for (const token of tokenPairs) {
        if (query.token && !token.pair.toLowerCase().includes(query.token.toLowerCase())) {
          continue;
        }
        
        const tvl = Math.random() * 50000000 + 100000;
        const volume = tvl * (Math.random() * 0.3 + 0.05);
        const fees = volume * 0.003;
        const apy = (fees * 365 / tvl) * 100 * (Math.random() * 3 + 1);
        
        if (query.minTvl && tvl < query.minTvl) continue;
        
        pools.push({
          address: `0x${(id++).toString(16).padStart(40, '0')}`,
          chain: chain,
          dex: dex,
          tokenPair: token.pair,
          token0: token.t0,
          token1: token.t1,
          tvl: Math.round(tvl * 100) / 100,
          volume24h: Math.round(volume * 100) / 100,
          fees24h: Math.round(fees * 100) / 100,
          apy: Math.round(apy * 100) / 100,
          token0Price: token.t0p,
          token1Price: token.t1p,
          token0Reserves: Math.random() * 1000000 + 1000 + '',
          token1Reserves: Math.random() * 10000000 + 10000 + '',
          liquidityScore: Math.round(Math.random() * 30 + 70),
          change24h: Math.round((Math.random() * 20 - 10) * 100) / 100,
          createdAt: Date.now() - Math.floor(Math.random() * 365 * 24 * 60 * 60 * 1000),
        });
      }
    }
  }

  // Sort
  const sortKey = query.sortBy || 'tvl';
  pools.sort((a, b) => {
    const aVal = a[sortKey as keyof PoolDetailDto] as number;
    const bVal = b[sortKey as keyof PoolDetailDto] as number;
    return bVal - aVal;
  });

  return pools;
}

@Injectable()
export class LiquidityPoolScannerService {
  
  getPools(query: PoolQueryDto): PoolListDto {
    const allPools = generateMockPools(query);
    const page = query.page || 1;
    const limit = query.limit || 20;
    const start = (page - 1) * limit;
    const end = start + limit;
    
    return {
      pools: allPools.slice(start, end),
      total: allPools.length,
      page,
      limit,
      totalPages: Math.ceil(allPools.length / limit),
    };
  }

  getPoolByAddress(address: string): PoolDetailDto {
    const pools = generateMockPools({});
    const pool = pools.find(p => p.address.toLowerCase() === address.toLowerCase());
    if (pool) return pool;
    
    // Return a default pool for the address
    return {
      address,
      chain: 'ethereum',
      dex: 'uniswap-v3',
      tokenPair: 'ETH/USDC',
      token0: 'ETH',
      token1: 'USDC',
      tvl: 15000000,
      volume24h: 4500000,
      fees24h: 13500,
      apy: 32.5,
      token0Price: 1,
      token1Price: 3250,
      token0Reserves: '5000',
      token1Reserves: '16250000',
      liquidityScore: 95,
      change24h: 2.5,
      createdAt: Date.now() - 180 * 24 * 60 * 60 * 1000,
    };
  }

  comparePools(addresses: string[]): PoolDetailDto[] {
    return addresses.map(addr => this.getPoolByAddress(addr));
  }

  getTrendingPools(limit: number = 10): TrendingPoolDto[] {
    const pools = generateMockPools({});
    
    return pools
      .sort((a, b) => {
        const scoreA = a.volume24h * a.change24h;
        const scoreB = b.volume24h * b.change24h;
        return scoreB - scoreA;
      })
      .slice(0, limit)
      .map(p => ({
        address: p.address,
        tokenPair: p.tokenPair,
        chain: p.chain,
        dex: p.dex,
        tvl: p.tvl,
        volumeChange: p.change24h,
        apy: p.apy,
        trendingScore: Math.round((p.volume24h * Math.abs(p.change24h) / 1000000)),
      }));
  }

  getPoolStats(): PoolStatsDto {
    const pools = generateMockPools({});
    
    const chainDist: Record<string, number> = {};
    const dexDist: Record<string, number> = {};
    const tokenSet = new Set<string>();
    let totalTvl = 0;
    let totalVolume = 0;
    let totalFees = 0;
    let totalApy = 0;

    pools.forEach(p => {
      chainDist[p.chain] = (chainDist[p.chain] || 0) + 1;
      dexDist[p.dex] = (dexDist[p.dex] || 0) + 1;
      tokenSet.add(p.token0);
      tokenSet.add(p.token1);
      totalTvl += p.tvl;
      totalVolume += p.volume24h;
      totalFees += p.fees24h;
      totalApy += p.apy;
    });

    return {
      totalPools: pools.length,
      totalTvl: Math.round(totalTvl),
      totalVolume24h: Math.round(totalVolume),
      totalFees24h: Math.round(totalFees),
      avgApy: Math.round(totalApy / pools.length * 100) / 100,
      chainDistribution: chainDist,
      dexDistribution: dexDist,
      topTokens: Array.from(tokenSet).slice(0, 10),
    };
  }

  searchPools(searchQuery: PoolSearchDto): PoolDetailDto[] {
    const pools = generateMockPools({ chain: searchQuery.chain });
    const query = searchQuery.query.toLowerCase();
    
    return pools
      .filter(p => 
        p.address.toLowerCase().includes(query) ||
        p.tokenPair.toLowerCase().includes(query) ||
        p.token0.toLowerCase().includes(query) ||
        p.token1.toLowerCase().includes(query)
      )
      .slice(0, searchQuery.limit || 10);
  }

  getSupportedChains(): string[] {
    return SUPPORTED_CHAINS;
  }

  getSupportedDexes(): string[] {
    return SUPPORTED_DEXES;
  }

  calculateIL(token0Amount: number, token1Amount: number, initialPrice: number, currentPrice: number): {
    impermanentLoss: number;
    impermanentLossPercent: number;
    severity: string;
    currentValue: number;
    hodlValue: number;
  } {
    const priceRatio = currentPrice / initialPrice;
    const sqrtPriceRatio = Math.sqrt(priceRatio);
    const IL = (2 * sqrtPriceRatio / (1 + priceRatio)) - 1;
    const ILPercent = IL * 100;
    
    const hodlValue = token0Amount * initialPrice + token1Amount;
    const currentValue = token0Amount * currentPrice + token1Amount;
    
    let severity = 'none';
    if (Math.abs(ILPercent) > 50) severity = 'extreme';
    else if (Math.abs(ILPercent) > 25) severity = 'high';
    else if (Math.abs(ILPercent) > 10) severity = 'medium';
    else if (Math.abs(ILPercent) > 3) severity = 'low';
    
    return {
      impermanentLoss: Math.round(IL * 10000) / 100,
      impermanentLossPercent: Math.round(ILPercent * 100) / 100,
      severity,
      currentValue: Math.round(currentValue * 100) / 100,
      hodlValue: Math.round(hodlValue * 100) / 100,
    };
  }
}
