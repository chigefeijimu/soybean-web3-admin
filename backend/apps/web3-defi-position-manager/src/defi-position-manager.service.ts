import { Injectable } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { Controller, Get, Post, Query, Body } from '@nestjs/common';

@ApiTags('DeFi Position Manager')
@Controller('defi-position-manager')
export class DefiPositionManagerController {
  constructor(private readonly defiPositionManagerService: DefiPositionManagerService) {}

  @Get('portfolio')
  @ApiOperation({ summary: 'Get unified DeFi portfolio for a wallet' })
  @ApiQuery({ name: 'address', required: true, description: 'Wallet address' })
  @ApiQuery({ name: 'chains', required: false, description: 'Comma-separated chain list' })
  async getPortfolio(
    @Query('address') address: string,
    @Query('chains') chains?: string,
  ) {
    return this.defiPositionManagerService.getPortfolio(address, chains);
  }

  @Get('positions')
  @ApiOperation({ summary: 'Get all DeFi positions for a wallet' })
  @ApiQuery({ name: 'address', required: true, description: 'Wallet address' })
  @ApiQuery({ name: 'protocol', required: false, description: 'Filter by protocol' })
  @ApiQuery({ name: 'chain', required: false, description: 'Filter by chain' })
  async getPositions(
    @Query('address') address: string,
    @Query('protocol') protocol?: string,
    @Query('chain') chain?: string,
  ) {
    return this.defiPositionManagerService.getPositions(address, protocol, chain);
  }

  @Get('positions/:protocol')
  @ApiOperation({ summary: 'Get positions for a specific protocol' })
  @ApiQuery({ name: 'address', required: true, description: 'Wallet address' })
  async getProtocolPositions(
    @Query('address') address: string,
  ) {
    return this.defiPositionManagerService.getProtocolPositions(address);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get portfolio summary with risk metrics' })
  @ApiQuery({ name: 'address', required: true, description: 'Wallet address' })
  async getSummary(@Query('address') address: string) {
    return this.defiPositionManagerService.getSummary(address);
  }

  @Get('health')
  @ApiOperation({ summary: 'Get position health analysis' })
  @ApiQuery({ name: 'address', required: true, description: 'Wallet address' })
  async getHealth(@Query('address') address: string) {
    return this.defiPositionManagerService.getHealth(address);
  }

  @Get('yield')
  @ApiOperation({ summary: 'Get aggregated yield statistics' })
  @ApiQuery({ name: 'address', required: true, description: 'Wallet address' })
  @ApiQuery({ name: 'period', required: false, description: 'Time period: 7d/30d/90d' })
  async getYield(
    @Query('address') address: string,
    @Query('period') period?: string,
  ) {
    return this.defiPositionManagerService.getYield(address, period);
  }

  @Get('allocation')
  @ApiOperation({ summary: 'Get asset allocation breakdown' })
  @ApiQuery({ name: 'address', required: true, description: 'Wallet address' })
  async getAllocation(@Query('address') address: string) {
    return this.defiPositionManagerService.getAllocation(address);
  }

  @Get('protocols')
  @ApiOperation({ summary: 'Get supported protocols' })
  async getProtocols() {
    return this.defiPositionManagerService.getSupportedProtocols();
  }

  @Get('chains')
  @ApiOperation({ summary: 'Get supported chains' })
  async getChains() {
    return this.defiPositionManagerService.getSupportedChains();
  }

  @Get('top-pools')
  @ApiOperation({ summary: 'Get popular pools across protocols' })
  @ApiQuery({ name: 'chain', required: false, description: 'Filter by chain' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of results' })
  async getTopPools(
    @Query('chain') chain?: string,
    @Query('limit') limit?: string,
  ) {
    return this.defiPositionManagerService.getTopPools(chain, limit ? parseInt(limit) : 10);
  }

  @Post('track')
  @ApiOperation({ summary: 'Add address to tracking list' })
  async trackAddress(@Body() body: { address: string; label?: string }) {
    return this.defiPositionManagerService.trackAddress(body.address, body.label);
  }

  @Get('tracked')
  @ApiOperation({ summary: 'Get tracked addresses' })
  async getTrackedAddresses() {
    return this.defiPositionManagerService.getTrackedAddresses();
  }
}

interface Position {
  id: string;
  protocol: string;
  chain: string;
  type: string;
  token0: string;
  token1?: string;
  valueUSD: number;
  apy: number;
  pnl24h: number;
  health?: number;
}

interface Protocol {
  name: string;
  logo: string;
  chains: string[];
  categories: string[];
}

@Injectable()
export class DefiPositionManagerService {
  private trackedAddresses: Map<string, string> = new Map();

  // Supported protocols with metadata
  private protocols: Protocol[] = [
    { name: 'Aave', logo: '🦅', chains: ['Ethereum', 'Polygon', 'Arbitrum', 'Optimism', 'Base'], categories: ['Lending'] },
    { name: 'Compound', logo: '🍃', chains: ['Ethereum', 'Polygon', 'Arbitrum'], categories: ['Lending'] },
    { name: 'Uniswap', logo: '🦄', chains: ['Ethereum', 'Polygon', 'Arbitrum', 'Optimism', 'Base'], categories: ['DEX', 'Liquidity'] },
    { name: 'Sushiswap', logo: '🍣', chains: ['Ethereum', 'Polygon', 'Arbitrum', 'Optimism', 'Base'], categories: ['DEX', 'Liquidity'] },
    { name: 'Curve', logo: '📈', chains: ['Ethereum', 'Polygon', 'Arbitrum', 'Optimism'], categories: ['Stablecoin DEX', 'Liquidity'] },
    { name: 'Yearn', logo: '🧙', chains: ['Ethereum', 'Polygon', 'Arbitrum'], categories: ['Yield Vault'] },
    { name: 'Lido', logo: '🛡️', chains: ['Ethereum', 'Polygon'], categories: ['Staking'] },
    { name: 'Rocket Pool', logo: '🚀', chains: ['Ethereum'], categories: ['Staking'] },
    { name: 'Morpho', logo: '🔮', chains: ['Ethereum', 'Arbitrum'], categories: ['Lending'] },
    { name: 'Gearbox', logo: '⚙️', chains: ['Ethereum', 'Arbitrum'], categories: ['Leverage'] },
  ];

  // Supported chains
  private supportedChains = [
    { id: 'ethereum', name: 'Ethereum', symbol: 'ETH' },
    { id: 'polygon', name: 'Polygon', symbol: 'MATIC' },
    { id: 'arbitrum', name: 'Arbitrum', symbol: 'ARB' },
    { id: 'optimism', name: 'Optimism', symbol: 'OP' },
    { id: 'base', name: 'Base', symbol: 'ETH' },
    { id: 'avalanche', name: 'Avalanche', symbol: 'AVAX' },
    { id: 'bsc', name: 'BNB Chain', symbol: 'BNB' },
  ];

  async getPortfolio(address: string, chains?: string): Promise<any> {
    const chainList = chains ? chains.split(',') : this.supportedChains.map(c => c.id);
    
    // Generate mock positions across protocols
    const positions = await this.generateMockPositions(address, chainList);
    
    // Calculate totals
    const totalValueUSD = positions.reduce((sum, p) => sum + p.valueUSD, 0);
    const totalApy = positions.length > 0 
      ? positions.reduce((sum, p) => sum + (p.apy * (p.valueUSD / totalValueUSD)), 0)
      : 0;
    const totalPnl24h = positions.reduce((sum, p) => sum + p.pnl24h, 0);

    return {
      address,
      totalValueUSD: Math.round(totalValueUSD * 100) / 100,
      totalApy: Math.round(totalApy * 100) / 100,
      totalPnl24h: Math.round(totalPnl24h * 100) / 100,
      pnl24hPercent: Math.round((totalPnl24h / (totalValueUSD - totalPnl24h)) * 10000) / 100,
      positions: positions,
      lastUpdated: new Date().toISOString(),
    };
  }

  async getPositions(address: string, protocol?: string, chain?: string): Promise<any> {
    let positions = await this.generateMockPositions(address, this.supportedChains.map(c => c.id));
    
    if (protocol) {
      positions = positions.filter(p => p.protocol.toLowerCase() === protocol.toLowerCase());
    }
    if (chain) {
      positions = positions.filter(p => p.chain.toLowerCase() === chain.toLowerCase());
    }

    return { address, positions, count: positions.length };
  }

  async getProtocolPositions(address: string): Promise<any> {
    const positions = await this.generateMockPositions(address, this.supportedChains.map(c => c.id));
    
    // Group by protocol
    const byProtocol: Record<string, any[]> = {};
    positions.forEach(p => {
      if (!byProtocol[p.protocol]) {
        byProtocol[p.protocol] = [];
      }
      byProtocol[p.protocol].push(p);
    });

    return {
      address,
      protocols: Object.keys(byProtocol).map(proto => ({
        name: proto,
        positions: byProtocol[proto],
        totalValue: byProtocol[proto].reduce((sum, p) => sum + p.valueUSD, 0),
      })),
    };
  }

  async getSummary(address: string): Promise<any> {
    const positions = await this.generateMockPositions(address, this.supportedChains.map(c => c.id));
    const totalValue = positions.reduce((sum, p) => sum + p.valueUSD, 0);
    
    // Calculate risk metrics
    const lendingPositions = positions.filter(p => p.type === 'Lending');
    const dexPositions = positions.filter(p => p.type === 'DEX' || p.type === 'Liquidity');
    const stakingPositions = positions.filter(p => p.type === 'Staking');
    
    const healthScore = this.calculateHealthScore(positions);
    const riskLevel = healthScore > 70 ? 'Low' : healthScore > 40 ? 'Medium' : 'High';

    return {
      address,
      totalValueUSD: Math.round(totalValue * 100) / 100,
      positionsCount: positions.length,
      protocolsCount: new Set(positions.map(p => p.protocol)).size,
      chainsCount: new Set(positions.map(p => p.chain)).size,
      distribution: {
        lending: Math.round((lendingPositions.reduce((sum, p) => sum + p.valueUSD, 0) / totalValue) * 10000) / 100,
        dex: Math.round((dexPositions.reduce((sum, p) => sum + p.valueUSD, 0) / totalValue) * 10000) / 100,
        staking: Math.round((stakingPositions.reduce((sum, p) => sum + p.valueUSD, 0) / totalValue) * 10000) / 100,
      },
      healthScore,
      riskLevel,
      avgApy: Math.round((positions.reduce((sum, p) => sum + p.apy, 0) / positions.length) * 100) / 100,
    };
  }

  async getHealth(address: string): Promise<any> {
    const positions = await this.generateMockPositions(address, this.supportedChains.map(c => c.id));
    
    // Analyze health factors
    const lendingPositions = positions.filter(p => p.type === 'Lending');
    const warnings: string[] = [];
    let healthScore = 100;

    lendingPositions.forEach(p => {
      if (p.health && p.health < 1.2) {
        warnings.push(`${p.protocol}: Low health factor (${p.health.toFixed(2)}) - Risk of liquidation`);
        healthScore -= 20;
      }
    });

    if (lendingPositions.length === 0) {
      warnings.push('No lending positions detected - Low risk profile');
    }

    const unhealthyCount = lendingPositions.filter(p => p.health && p.health < 1.5).length;
    
    return {
      address,
      overallHealth: Math.max(0, healthScore),
      status: healthScore > 70 ? 'Healthy' : healthScore > 40 ? 'Warning' : 'Critical',
      warnings,
      lendingPositionsCount: lendingPositions.length,
      atRiskCount: unhealthyCount,
      recommendations: this.generateRecommendations(healthScore, warnings),
    };
  }

  async getYield(address: string, period: string = '30d'): Promise<any> {
    const positions = await this.generateMockPositions(address, this.supportedChains.map(c => c.id));
    const totalValue = positions.reduce((sum, p) => sum + p.valueUSD, 0);
    
    // Calculate yield based on period
    const periodMultiplier: Record<string, number> = {
      '7d': 7 / 365,
      '30d': 30 / 365,
      '90d': 90 / 365,
    };
    const multiplier = periodMultiplier[period] || 30 / 365;
    
    const avgApy = positions.reduce((sum, p) => sum + p.apy, 0) / positions.length;
    const estimatedYield = totalValue * avgApy * multiplier;

    return {
      address,
      period,
      totalValueUSD: Math.round(totalValue * 100) / 100,
      avgApy: Math.round(avgApy * 100) / 100,
      estimatedYieldUSD: Math.round(estimatedYield * 100) / 100,
      yieldBreakdown: positions.map(p => ({
        protocol: p.protocol,
        value: Math.round(p.valueUSD * 100) / 100,
        apy: p.apy,
        estimatedYield: Math.round(p.valueUSD * p.apy * multiplier * 100) / 100,
      })),
    };
  }

  async getAllocation(address: string): Promise<any> {
    const positions = await this.generateMockPositions(address, this.supportedChains.map(c => c.id));
    const totalValue = positions.reduce((sum, p) => sum + p.valueUSD, 0);

    // By token
    const tokenAllocation: Record<string, number> = {};
    positions.forEach(p => {
      if (!tokenAllocation[p.token0]) {
        tokenAllocation[p.token0] = 0;
      }
      tokenAllocation[p.token0] += p.valueUSD;
    });

    // By protocol
    const protocolAllocation: Record<string, number> = {};
    positions.forEach(p => {
      if (!protocolAllocation[p.protocol]) {
        protocolAllocation[p.protocol] = 0;
      }
      protocolAllocation[p.protocol] += p.valueUSD;
    });

    // By chain
    const chainAllocation: Record<string, number> = {};
    positions.forEach(p => {
      if (!chainAllocation[p.chain]) {
        chainAllocation[p.chain] = 0;
      }
      chainAllocation[p.chain] += p.valueUSD;
    });

    return {
      address,
      totalValueUSD: Math.round(totalValue * 100) / 100,
      byToken: Object.entries(tokenAllocation).map(([token, value]) => ({
        token,
        valueUSD: Math.round(value * 100) / 100,
        percentage: Math.round((value / totalValue) * 10000) / 100,
      })).sort((a, b) => b.valueUSD - a.valueUSD),
      byProtocol: Object.entries(protocolAllocation).map(([protocol, value]) => ({
        protocol,
        valueUSD: Math.round(value * 100) / 100,
        percentage: Math.round((value / totalValue) * 10000) / 100,
      })).sort((a, b) => b.valueUSD - a.valueUSD),
      byChain: Object.entries(chainAllocation).map(([chain, value]) => ({
        chain,
        valueUSD: Math.round(value * 100) / 100,
        percentage: Math.round((value / totalValue) * 10000) / 100,
      })).sort((a, b) => b.valueUSD - a.valueUSD),
    };
  }

  getSupportedProtocols() {
    return this.protocols;
  }

  getSupportedChains() {
    return this.supportedChains;
  }

  async getTopPools(chain?: string, limit: number = 10): Promise<any> {
    const pools = this.generateMockPools(chain, limit);
    return { pools, chain: chain || 'all', count: pools.length };
  }

  async trackAddress(address: string, label?: string): Promise<any> {
    this.trackedAddresses.set(address, label || 'Unlabeled');
    return { success: true, address, label: label || 'Unlabeled' };
  }

  async getTrackedAddresses(): Promise<any> {
    return {
      addresses: Array.from(this.trackedAddresses.entries()).map(([address, label]) => ({
        address,
        label,
      })),
      count: this.trackedAddresses.size,
    };
  }

  // Helper methods
  private async generateMockPositions(address: string, chains: string[]): Promise<Position[]> {
    // Generate deterministic mock data based on address
    const hash = address.split('').reduce((a, b) => ((a << 5) - a + b.charCodeAt(0)) | 0, 0);
    const positions: Position[] = [];
    
    const tokens = ['ETH', 'USDC', 'USDT', 'WBTC', 'DAI', 'MATIC', 'ARB', 'OP', 'LINK', 'UNI'];
    const protocols = ['Aave', 'Compound', 'Uniswap', 'Sushiswap', 'Curve', 'Yearn', 'Lido', 'Morpho'];
    const types = ['Lending', 'DEX', 'Liquidity', 'Staking', 'Yield Vault'];

    // Generate 5-15 positions per address
    const numPositions = 5 + Math.abs(hash % 11);
    
    for (let i = 0; i < numPositions; i++) {
      const chainIndex = Math.abs((hash * (i + 1)) % chains.length);
      const tokenIndex = Math.abs((hash * (i + 2)) % tokens.length);
      const protocolIndex = Math.abs((hash * (i + 3)) % protocols.length);
      const typeIndex = Math.abs((hash * (i + 4)) % types.length);
      
      const value = 100 + Math.abs((hash * (i + 5)) % 50000);
      const apy = (Math.abs((hash * (i + 6)) % 2000) / 100);
      
      positions.push({
        id: `${address.slice(0, 8)}-${i}`,
        protocol: protocols[protocolIndex],
        chain: chains[chainIndex],
        type: types[typeIndex],
        token0: tokens[tokenIndex],
        token1: typeIndex < 2 ? tokens[(tokenIndex + 1) % tokens.length] : undefined,
        valueUSD: Math.round(value * 100) / 100,
        apy: Math.round(apy * 100) / 100,
        pnl24h: Math.round((value * (apy / 100) / 365) * (Math.random() > 0.5 ? 1 : -1) * 100) / 100,
        health: typeIndex === 0 ? 1.0 + Math.random() * 2 : undefined,
      });
    }

    return positions;
  }

  private generateMockPools(chain?: string, limit: number): any[] {
    const pools = [
      { protocol: 'Uniswap', pair: 'ETH/USDC', apy: 12.5, tvl: 125000000 },
      { protocol: 'Uniswap', pair: 'USDC/USDT', apy: 8.2, tvl: 89000000 },
      { protocol: 'Sushiswap', pair: 'ETH/MATIC', apy: 15.3, tvl: 45000000 },
      { protocol: 'Curve', pair: '3CRV', apy: 5.8, tvl: 250000000 },
      { protocol: 'Curve', pair: 'ETH/stETH', apy: 4.2, tvl: 180000000 },
      { protocol: 'Aave', pair: 'ETH Supply', apy: 3.1, tvl: 320000000 },
      { protocol: 'Compound', pair: 'USDC Supply', apy: 2.8, tvl: 120000000 },
      { protocol: 'Yearn', pair: 'yETH', apy: 18.7, tvl: 95000000 },
      { protocol: 'Lido', pair: 'stETH', apy: 4.5, tvl: 420000000 },
      { protocol: 'Morpho', pair: 'WBTC Supply', apy: 4.2, tvl: 75000000 },
    ];

    return pools.slice(0, limit).map((p, i) => ({
      ...p,
      chain: chain || 'Ethereum',
      tvlUSD: p.tvl,
      rank: i + 1,
    }));
  }

  private calculateHealthScore(positions: Position[]): number {
    const lendingPositions = positions.filter(p => p.type === 'Lending');
    if (lendingPositions.length === 0) return 100;

    let health = 100;
    lendingPositions.forEach(p => {
      if (p.health) {
        if (p.health < 1.1) health -= 30;
        else if (p.health < 1.3) health -= 20;
        else if (p.health < 1.5) health -= 10;
      }
    });

    return Math.max(0, Math.round(health));
  }

  private generateRecommendations(healthScore: number, warnings: string[]): string[] {
    const recommendations: string[] = [];
    
    if (healthScore < 50) {
      recommendations.push('Consider adding collateral to reduce liquidation risk');
      recommendations.push('Consider reducing leverage in lending positions');
    }
    if (warnings.length > 2) {
      recommendations.push('Diversify positions across multiple protocols');
    }
    if (healthScore >= 70) {
      recommendations.push('Portfolio is healthy - consider exploring yield opportunities');
    }
    
    return recommendations;
  }
}
