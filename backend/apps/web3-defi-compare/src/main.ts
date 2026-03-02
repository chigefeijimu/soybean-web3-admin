import { NestFactory } from '@nestjs/core';
import { Module, Controller, Get, Query, Param, Injectable } from '@nestjs/common';
import axios from 'axios';

interface Protocol {
  id: string;
  name: string;
  category: string;
  chain: string;
  logo: string;
  tvl: number;
  apy: number;
  users: number;
  fees24h: number;
  volume24h: number;
  riskScore: number;
  auditScore: number;
  age: number;
  description: string;
  website: string;
}

interface ComparisonResult {
  protocols: Protocol[];
  metrics: {
    tvlComparison: { name: string; value: number }[];
    apyComparison: { name: string; value: number }[];
    riskComparison: { name: string; value: number }[];
    feesComparison: { name: string; value: number }[];
  };
  recommendations: string[];
}

// Supported DeFi protocols
const PROTOCOLS: Protocol[] = [
  // Lending
  { id: 'aave', name: 'Aave', category: 'Lending', chain: 'ethereum', logo: '🦔', tvl: 12500000000, apy: 4.5, users: 180000, fees24h: 2500000, volume24h: 180000000, riskScore: 15, auditScore: 95, age: 2017, description: 'Decentralized liquidity protocol', website: 'https://aave.com' },
  { id: 'compound', name: 'Compound', category: 'Lending', chain: 'ethereum', logo: '📈', tvl: 2800000000, apy: 3.8, users: 95000, fees24h: 850000, volume24h: 65000000, riskScore: 18, auditScore: 92, age: 2018, description: 'Algorithmic money market', website: 'https://compound.finance' },
  { id: 'liquity', name: 'Liquity', category: 'Lending', chain: 'ethereum', logo: '🔷', tvl: 450000000, apy: 5.2, users: 28000, fees24h: 180000, volume24h: 12000000, riskScore: 25, auditScore: 88, age: 2021, description: 'Interest-free lending', website: 'https://liquity.org' },
  { id: 'morpho', name: 'Morpho', category: 'Lending', chain: 'ethereum', logo: '🟣', tvl: 1800000000, apy: 4.8, users: 42000, fees24h: 620000, volume24h: 45000000, riskScore: 20, auditScore: 90, age: 2022, description: 'Peer-to-peer lending', website: 'https://morpho.org' },
  
  // DEX
  { id: 'uniswap-v3', name: 'Uniswap V3', category: 'DEX', chain: 'ethereum', logo: '🦄', tvl: 4500000000, apy: 25.0, users: 350000, fees24h: 8500000, volume24h: 1200000000, riskScore: 10, auditScore: 98, age: 2021, description: 'Automated liquidity protocol', website: 'https://uniswap.org' },
  { id: 'sushiswap', name: 'SushiSwap', category: 'DEX', chain: 'ethereum', logo: '🍣', tvl: 1800000000, apy: 18.0, users: 180000, fees24h: 3200000, volume24h: 420000000, riskScore: 22, auditScore: 85, age: 2020, description: 'Decentralized exchange', website: 'https://sushi.com' },
  { id: 'curve', name: 'Curve', category: 'DEX', chain: 'ethereum', logo: '💎', tvl: 2200000000, apy: 12.0, users: 150000, fees24h: 4500000, volume24h: 850000000, riskScore: 12, auditScore: 95, age: 2020, description: 'Stablecoin DEX', website: 'https://curve.fi' },
  { id: 'balancer', name: 'Balancer', category: 'DEX', chain: 'ethereum', logo: '⚖️', tvl: 800000000, apy: 15.0, users: 65000, fees24h: 850000, volume24h: 120000000, riskScore: 20, auditScore: 90, age: 2020, description: 'AMM protocol', website: 'https://balancer.fi' },
  
  // Staking
  { id: 'lido', name: 'Lido', category: 'Staking', chain: 'ethereum', logo: '🛡️', tvl: 18000000000, apy: 3.2, users: 95000, fees24h: 4500000, volume24h: 320000000, riskScore: 20, auditScore: 92, age: 2020, description: 'Liquid staking', website: 'https://lido.fi' },
  { id: 'rocket-pool', name: 'Rocket Pool', category: 'Staking', chain: 'ethereum', logo: '🚀', tvl: 650000000, apy: 3.8, users: 18000, fees24h: 180000, volume24h: 15000000, riskScore: 15, auditScore: 95, age: 2021, description: 'Decentralized staking', website: 'https://rocketpool.net' },
  { id: 'stakewise', name: 'Stakewise', category: 'Staking', chain: 'ethereum', logo: '🎯', tvl: 180000000, apy: 4.1, users: 8500, fees24h: 45000, volume24h: 3500000, riskScore: 22, auditScore: 88, age: 2021, description: 'Liquid staking platform', website: 'https://stakewise.io' },
  
  // Derivatives
  { id: 'gmx', name: 'GMX', category: 'Derivatives', chain: 'arbitrum', logo: '🦊', tvl: 450000000, apy: 8.5, users: 35000, fees24h: 1800000, volume24h: 280000000, riskScore: 35, auditScore: 82, age: 2021, description: 'Decentralized perpetual', website: 'https://gmx.io' },
  { id: 'dydx', name: 'dYdX', category: 'Derivatives', chain: 'ethereum', logo: '📊', tvl: 280000000, apy: 6.5, users: 28000, fees24h: 850000, volume24h: 180000000, riskScore: 30, auditScore: 88, age: 2020, description: 'Perpetual trading', website: 'https://dydx.exchange' },
  { id: 'gains-network', name: 'Gains Network', category: 'Derivatives', chain: 'polygon', logo: '📈', tvl: 180000000, apy: 12.0, users: 22000, fees24h: 450000, volume24h: 85000000, riskScore: 38, auditScore: 80, age: 2022, description: 'Leveraged trading', website: 'https://gains.trade' },
  
  // Yield
  { id: 'yearn', name: 'Yearn Finance', category: 'Yield', chain: 'ethereum', logo: '🔶', tvl: 650000000, apy: 8.5, users: 28000, fees24h: 320000, volume24h: 28000000, riskScore: 28, auditScore: 85, age: 2020, description: 'Automated yield', website: 'https://yearn.finance' },
  { id: 'convex', name: 'Convex', category: 'Yield', chain: 'ethereum', logo: '🏔️', tvl: 2800000000, apy: 5.5, users: 85000, fees24h: 1800000, volume24h: 180000000, riskScore: 25, auditScore: 88, age: 2021, description: 'CRV staking', website: 'https://convexfinance.com' },
  { id: 'pendle', name: 'Pendle', category: 'Yield', chain: 'ethereum', logo: '📜', tvl: 450000000, apy: 15.0, users: 22000, fees24h: 650000, volume24h: 85000000, riskScore: 32, auditScore: 82, age: 2022, description: 'Yield trading', website: 'https://pendle.finance' },
  
  // Bridge
  { id: 'layerzero', name: 'LayerZero', category: 'Bridge', chain: 'multi', logo: '🌐', tvl: 3500000000, apy: 0, users: 180000, fees24h: 850000, volume24h: 180000000, riskScore: 25, auditScore: 90, age: 2022, description: 'Cross-chain messaging', website: 'https://layerzero.network' },
  { id: 'stargate', name: 'Stargate', category: 'Bridge', chain: 'multi', logo: '🌉', tvl: 850000000, apy: 4.5, users: 95000, fees24h: 450000, volume24h: 65000000, riskScore: 22, auditScore: 92, age: 2022, description: 'Omnichain bridge', website: 'https://stargate.finance' },
  { id: 'wormhole', name: 'Wormhole', category: 'Bridge', chain: 'multi', logo: '🪱', tvl: 1200000000, apy: 3.5, users: 120000, fees24h: 620000, volume24h: 95000000, riskScore: 28, auditScore: 88, age: 2021, description: 'Cross-chain protocol', website: 'https://wormhole.com' },
];

@Injectable()
class DefiCompareService {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private cacheTTL = 5 * 60 * 1000; // 5 minutes

  private getCached(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data;
    }
    return null;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  /**
   * Get all protocols with optional filters
   */
  async getProtocols(category?: string, chain?: string): Promise<Protocol[]> {
    const cacheKey = `protocols-${category || 'all'}-${chain || 'all'}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    let results = [...PROTOCOLS];
    
    if (category) {
      results = results.filter(p => p.category.toLowerCase() === category.toLowerCase());
    }
    
    if (chain) {
      results = results.filter(p => p.chain.toLowerCase() === chain.toLowerCase() || p.chain === 'multi');
    }

    this.setCache(cacheKey, results);
    return results;
  }

  /**
   * Get protocol by ID
   */
  async getProtocolById(id: string): Promise<Protocol | null> {
    const cacheKey = `protocol-${id}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    const protocol = PROTOCOLS.find(p => p.id === id);
    if (protocol) {
      this.setCache(cacheKey, protocol);
    }
    return protocol || null;
  }

  /**
   * Compare multiple protocols
   */
  async compareProtocols(ids: string[]): Promise<ComparisonResult> {
    const protocols = ids
      .map(id => PROTOCOLS.find(p => p.id === id))
      .filter((p): p is Protocol => p !== undefined);

    const recommendations: string[] = [];
    
    // Generate recommendations based on analysis
    const highestTVL = Math.max(...protocols.map(p => p.tvl));
    const highestAPY = Math.max(...protocols.map(p => p.apy));
    const lowestRisk = Math.min(...protocols.map(p => p.riskScore));
    const lowestFees = Math.min(...protocols.map(p => p.fees24h));

    if (protocols.some(p => p.tvl === highestTVL)) {
      recommendations.push(`🔒 Highest TVL: ${protocols.find(p => p.tvl === highestTVL)?.name} ($${(highestTVL/1e9).toFixed(1)}B)`);
    }
    if (protocols.some(p => p.apy === highestAPY && p.apy > 0)) {
      recommendations.push(`📈 Best APY: ${protocols.find(p => p.apy === highestAPY)?.name} (${highestAPY.toFixed(1)}%)`);
    }
    if (protocols.some(p => p.riskScore === lowestRisk)) {
      recommendations.push(`🛡️ Lowest Risk: ${protocols.find(p => p.riskScore === lowestRisk)?.name} (${lowestRisk}/100)`);
    }
    if (protocols.some(p => p.fees24h === lowestFees)) {
      recommendations.push(`💰 Lowest Fees: ${protocols.find(p => p.fees24h === lowestFees)?.name} ($${lowestFees.toLocaleString()}/day)`);
    }

    // Add category-specific recommendations
    const categories = [...new Set(protocols.map(p => p.category))];
    if (categories.length > 1) {
      recommendations.push(`💡 Consider diversifying across ${categories.join(', ')} categories`);
    }

    return {
      protocols,
      metrics: {
        tvlComparison: protocols.map(p => ({ name: p.name, value: p.tvl })),
        apyComparison: protocols.filter(p => p.apy > 0).map(p => ({ name: p.name, value: p.apy })),
        riskComparison: protocols.map(p => ({ name: p.name, value: p.riskScore })),
        feesComparison: protocols.map(p => ({ name: p.name, value: p.fees24h })),
      },
      recommendations,
    };
  }

  /**
   * Get protocol categories
   */
  async getCategories(): Promise<string[]> {
    const categories = [...new Set(PROTOCOLS.map(p => p.category))];
    return categories.sort();
  }

  /**
   * Get supported chains
   */
  async getChains(): Promise<string[]> {
    const chains = [...new Set(PROTOCOLS.map(p => p.chain))];
    return chains.sort();
  }

  /**
   * Get top protocols by category
   */
  async getTopByCategory(): Promise<Record<string, Protocol[]>> {
    const cacheKey = 'top-by-category';
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    const categories = await this.getCategories();
    const result: Record<string, Protocol[]> = {};

    for (const category of categories) {
      const protocols = PROTOCOLS
        .filter(p => p.category === category)
        .sort((a, b) => b.tvl - a.tvl)
        .slice(0, 5);
      result[category] = protocols;
    }

    this.setCache(cacheKey, result);
    return result;
  }

  /**
   * Get overall rankings
   */
  async getRankings(): Promise<{
    byTVL: Protocol[];
    byAPY: Protocol[];
    byUsers: Protocol[];
    bySafety: Protocol[];
  }> {
    const cacheKey = 'rankings';
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    const result = {
      byTVL: [...PROTOCOLS].sort((a, b) => b.tvl - a.tvl).slice(0, 10),
      byAPY: [...PROTOCOLS].filter(p => p.apy > 0).sort((a, b) => b.apy - a.apy).slice(0, 10),
      byUsers: [...PROTOCOLS].sort((a, b) => b.users - a.users).slice(0, 10),
      bySafety: [...PROTOCOLS].sort((a, b) => a.riskScore - b.riskScore).slice(0, 10),
    };

    this.setCache(cacheKey, result);
    return result;
  }
}

@Controller('defi-compare')
class DefiCompareController {
  constructor(private readonly service: DefiCompareService) {}

  @Get('protocols')
  async getProtocols(
    @Query('category') category?: string,
    @Query('chain') chain?: string,
  ) {
    const protocols = await this.service.getProtocols(category, chain);
    return { success: true, data: protocols };
  }

  @Get('protocols/:id')
  async getProtocolById(@Param('id') id: string) {
    const protocol = await this.service.getProtocolById(id);
    return { success: true, data: protocol };
  }

  @Get('compare')
  async compareProtocols(@Query('ids') ids: string) {
    const protocolIds = ids.split(',').filter(Boolean);
    const result = await this.service.compareProtocols(protocolIds);
    return { success: true, data: result };
  }

  @Get('categories')
  async getCategories() {
    const categories = await this.service.getCategories();
    return { success: true, data: categories };
  }

  @Get('chains')
  async getChains() {
    const chains = await this.service.getChains();
    return { success: true, data: chains };
  }

  @Get('top')
  async getTopByCategory() {
    const result = await this.service.getTopByCategory();
    return { success: true, data: result };
  }

  @Get('rankings')
  async getRankings() {
    const result = await this.service.getRankings();
    return { success: true, data: result };
  }
}

@Module({
  controllers: [DefiCompareController],
  providers: [DefiCompareService],
})
class DefiCompareModule {}

async function bootstrap() {
  const app = await NestFactory.create(DefiCompareModule);
  app.enableCors();
  const port = process.env.PORT || 3015;
  await app.listen(port);
  console.log(`DeFi Compare API running on port ${port}`);
}
bootstrap();
