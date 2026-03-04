import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';

@ApiTags('Lending Rate Comparator')
@Controller('api/web3/lending-rates')
export class LendingRateController {
  
  @Get('compare')
  @ApiOperation({ summary: 'Compare lending rates across protocols and chains' })
  @ApiQuery({ name: 'chainId', required: false, type: Number })
  @ApiQuery({ name: 'protocol', required: false, type: String })
  async compareRates(
    @Query('chainId') chainId?: number,
    @Query('protocol') protocol?: string,
  ) {
    const chains = chainId ? [chainId] : [1, 137, 42161, 8453, 43114];
    const protocols = protocol ? [protocol] : ['aave', 'compound', 'liquity', 'morpho', 'gearbox'];
    
    const results = await this.getLendingRates(chains, protocols);
    
    return {
      data: results,
      summary: this.generateSummary(results),
      bestRates: this.findBestRates(results),
      timestamp: new Date().toISOString(),
    };
  }

  @Get('assets')
  @ApiOperation({ summary: 'Get supported lending assets' })
  async getSupportedAssets() {
    return {
      data: [
        { symbol: 'ETH', name: 'Ethereum', logo: '⟐', color: '#627EEA' },
        { symbol: 'WBTC', name: 'Wrapped Bitcoin', logo: '₿', color: '#F7931A' },
        { symbol: 'USDC', name: 'USD Coin', logo: '$', color: '#2775CA' },
        { symbol: 'USDT', name: 'Tether', logo: '$', color: '#26A17B' },
        { symbol: 'DAI', name: 'Dai', logo: '◈', color: '#F4B731' },
        { symbol: 'WETH', name: 'Wrapped Ether', logo: '⟐', color: '#627EEA' },
        { symbol: 'MATIC', name: 'Polygon', logo: '⬡', color: '#8247E5' },
        { symbol: 'ARB', name: 'Arbitrum', logo: '▲', color: '#28A0F0' },
        { symbol: 'OP', name: 'Optimism', logo: '▲', color: '#FF0420' },
        { symbol: 'AVAX', name: 'Avalanche', logo: '▲', color: '#E84142' },
        { symbol: 'LINK', name: 'Chainlink', logo: '⬡', color: '#2A5ADA' },
        { symbol: 'UNI', name: 'Uniswap', logo: '🦄', color: '#FF007A' },
        { symbol: 'AAVE', name: 'Aave', logo: '👻', color: '#2EBAC6' },
        { symbol: 'SNX', name: 'Synthetix', logo: '◈', color: '#00D1FF' },
        { symbol: 'CRV', name: 'Curve DAO', logo: '💚', color: '#FF6D6D' },
      ],
    };
  }

  @Get('protocols')
  @ApiOperation({ summary: 'Get supported lending protocols' })
  async getProtocols() {
    return {
      data: [
        {
          id: 'aave',
          name: 'Aave',
          logo: '👻',
          description: 'Leading liquidity protocol',
          chains: [1, 137, 42161, 8453, 43114],
          features: ['supply', 'borrow', 'collateral', 'flashloan'],
          riskLevel: 'low',
          tvl: '~$15B',
        },
        {
          id: 'compound',
          name: 'Compound',
          logo: '🔷',
          description: 'Algorithmic money market',
          chains: [1, 137, 8453],
          features: ['supply', 'borrow', 'collateral'],
          riskLevel: 'low',
          tvl: '~$2.5B',
        },
        {
          id: 'liquity',
          name: 'Liquity',
          logo: '◆',
          description: 'Zero-interest lending',
          chains: [1],
          features: ['borrow', 'stability pool'],
          riskLevel: 'medium',
          tvl: '~$200M',
        },
        {
          id: 'morpho',
          name: 'Morpho',
          logo: '◈',
          description: 'Peer-to-peer layer on top of Aave/Compound',
          chains: [1, 42161, 8453],
          features: ['supply', 'borrow', 'peer-to-peer'],
          riskLevel: 'medium',
          tvl: '~$500M',
        },
        {
          id: 'gearbox',
          name: 'Gearbox',
          logo: '⚙️',
          description: 'Credit account protocol',
          chains: [1, 42161],
          features: ['credit accounts', 'leverage'],
          riskLevel: 'high',
          tvl: '~$150M',
        },
        {
          id: 'venus',
          name: 'Venus',
          logo: '♨️',
          description: 'Algorithmic money market on BSC',
          chains: [56],
          features: ['supply', 'borrow', 'collateral'],
          riskLevel: 'medium',
          tvl: '~$400M',
        },
        {
          id: 'radiant',
          name: 'Radiant',
          logo: '◈',
          description: 'Cross-margin lending protocol',
          chains: [42161, 43114],
          features: ['supply', 'borrow', 'cross-chain'],
          riskLevel: 'medium',
          tvl: '~$300M',
        },
        {
          id: 'kamino',
          name: 'Kamino',
          logo: '⬡',
          description: 'Solana lending protocol',
          chains: [7560],
          features: ['supply', 'borrow', 'isolated pools'],
          riskLevel: 'medium',
          tvl: '~$200M',
        },
      ],
    };
  }

  @Get('trends')
  @ApiOperation({ summary: 'Get lending rate trends' })
  @ApiQuery({ name: 'asset', required: false, type: String })
  @ApiQuery({ name: 'days', required: false, type: Number })
  async getRateTrends(
    @Query('asset') asset: string = 'USDC',
    @Query('days') days: number = 30,
  ) {
    const trends = this.generateMockTrends(asset, days);
    return {
      data: trends,
      asset,
      days,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('opportunities')
  @ApiOperation({ summary: 'Find best lending opportunities' })
  @ApiQuery({ name: 'amount', required: false, type: Number })
  @ApiQuery({ name: 'asset', required: false, type: String })
  async findOpportunities(
    @Query('amount') amount: number = 10000,
    @Query('asset') asset: string = 'USDC',
  ) {
    const opportunities = this.calculateOpportunities(amount, asset);
    return {
      data: opportunities,
      input: { amount, asset },
      timestamp: new Date().toISOString(),
    };
  }

  private async getLendingRates(chains: number[], protocols: string[]) {
    const chainNames: { [key: number]: string } = {
      1: 'Ethereum',
      137: 'Polygon',
      42161: 'Arbitrum',
      8453: 'Base',
      43114: 'Avalanche',
      56: 'BSC',
      7560: 'Solana',
    };

    const rates: any[] = [];
    
    for (const chainId of chains) {
      for (const protocol of protocols) {
        const protocolData = this.getProtocolData(protocol, chainId);
        if (protocolData) {
          rates.push({
            chainId,
            chain: chainNames[chainId] || `Chain ${chainId}`,
            protocol: protocolData.name,
            protocolId: protocol,
            logo: protocolData.logo,
            supplyRate: protocolData.supplyRates,
            borrowRate: protocolData.borrowRates,
            tvl: protocolData.tvl,
            apy: protocolData.supplyRates['USDC'] || 0,
            apr: protocolData.supplyRates['USDC'] || 0,
          });
        }
      }
    }
    
    return rates;
  }

  private getProtocolData(protocol: string, chainId: number) {
    const mockData: { [key: string]: any } = {
      aave: {
        name: 'Aave',
        logo: '👻',
        tvl: '$15.2B',
        supplyRates: { ETH: 0.032, WBTC: 0.015, USDC: 0.048, USDT: 0.046, DAI: 0.045, WETH: 0.032, MATIC: 0.055, ARB: 0.042, OP: 0.038, AVAX: 0.048, LINK: 0.018, UNI: 0.025, AAVE: 0.028, SNX: 0.032, CRV: 0.045 },
        borrowRates: { ETH: 0.058, WBTC: 0.075, USDC: 0.062, USDT: 0.065, DAI: 0.058, WETH: 0.058, MATIC: 0.072, ARB: 0.068, OP: 0.065, AVAX: 0.072, LINK: 0.085, UNI: 0.095, AAVE: 0.082, SNX: 0.088, CRV: 0.075 },
      },
      compound: {
        name: 'Compound',
        logo: '🔷',
        tvl: '$2.5B',
        supplyRates: { ETH: 0.028, WBTC: 0.012, USDC: 0.042, USDT: 0.040, DAI: 0.038, WETH: 0.028 },
        borrowRates: { ETH: 0.052, WBTC: 0.068, USDC: 0.055, USDT: 0.058, DAI: 0.052, WETH: 0.052 },
      },
      liquity: {
        name: 'Liquity',
        logo: '◆',
        tvl: '$200M',
        supplyRates: { ETH: 0.015, WETH: 0.015 },
        borrowRates: { ETH: 0.045, WETH: 0.045 },
      },
      morpho: {
        name: 'Morpho',
        logo: '◈',
        tvl: '$500M',
        supplyRates: { ETH: 0.035, WBTC: 0.018, USDC: 0.052, USDT: 0.050, DAI: 0.048, WETH: 0.035, ARB: 0.048, OP: 0.042 },
        borrowRates: { ETH: 0.055, WBTC: 0.072, USDC: 0.058, USDT: 0.062, DAI: 0.055, WETH: 0.055, ARB: 0.065, OP: 0.060 },
      },
      gearbox: {
        name: 'Gearbox',
        logo: '⚙️',
        tvl: '$150M',
        supplyRates: { ETH: 0.042, WBTC: 0.022, USDC: 0.058, DAI: 0.055, WETH: 0.042 },
        borrowRates: { ETH: 0.085, WBTC: 0.105, USDC: 0.095, DAI: 0.092, WETH: 0.085 },
      },
      venus: {
        name: 'Venus',
        logo: '♨️',
        tvl: '$400M',
        supplyRates: { BNB: 0.045, ETH: 0.028, WBTC: 0.015, USDC: 0.052, USDT: 0.050, DAI: 0.048 },
        borrowRates: { BNB: 0.072, ETH: 0.055, WBTC: 0.075, USDC: 0.068, USDT: 0.070, DAI: 0.065 },
      },
      radiant: {
        name: 'Radiant',
        logo: '◈',
        tvl: '$300M',
        supplyRates: { ETH: 0.038, WBTC: 0.020, USDC: 0.055, USDT: 0.052, DAI: 0.050, WETH: 0.038, ARB: 0.052, AVAX: 0.055 },
        borrowRates: { ETH: 0.062, WBTC: 0.078, USDC: 0.068, USDT: 0.072, DAI: 0.065, WETH: 0.062, ARB: 0.072, AVAX: 0.075 },
      },
      kamino: {
        name: 'Kamino',
        logo: '⬡',
        tvl: '$200M',
        supplyRates: { SOL: 0.065, ETH: 0.038, WBTC: 0.018, USDC: 0.058, USDT: 0.055 },
        borrowRates: { SOL: 0.085, ETH: 0.065, WBTC: 0.078, USDC: 0.072, USDT: 0.075 },
      },
    };

    const supportedChains: { [key: string]: number[] } = {
      aave: [1, 137, 42161, 8453, 43114],
      compound: [1, 137, 8453],
      liquity: [1],
      morpho: [1, 42161, 8453],
      gearbox: [1, 42161],
      venus: [56],
      radiant: [42161, 43114],
      kamino: [7560],
    };

    if (supportedChains[protocol]?.includes(chainId)) {
      return mockData[protocol];
    }
    return null;
  }

  private generateSummary(results: any[]) {
    const avgSupplyRate = results.reduce((sum, r) => sum + (r.supplyRate?.['USDC'] || r.apy || 0), 0) / results.length;
    const avgBorrowRate = results.reduce((sum, r) => sum + (r.borrowRate?.['USDC'] || 0), 0) / results.length;
    
    return {
      totalProtocols: results.length,
      averageSupplyRate: (avgSupplyRate * 100).toFixed(2) + '%',
      averageBorrowRate: (avgBorrowRate * 100).toFixed(2) + '%',
      bestSupply: Math.max(...results.map(r => r.apy || r.supplyRate?.['USDC'] || 0)),
      lowestBorrow: Math.min(...results.map(r => r.borrowRate?.['USDC'] || 1)),
    };
  }

  private findBestRates(results: any[]) {
    const sortedBySupply = [...results].sort((a, b) => (b.apy || 0) - (a.apy || 0));
    const sortedByBorrow = [...results].sort((a, b) => (a.borrowRate?.['USDC'] || 1) - (b.borrowRate?.['USDC'] || 1));
    
    return {
      bestSupply: sortedBySupply.slice(0, 3).map(r => ({
        protocol: r.protocol,
        chain: r.chain,
        rate: ((r.apy || r.supplyRate?.['USDC'] || 0) * 100).toFixed(2) + '%',
      })),
      lowestBorrow: sortedByBorrow.slice(0, 3).map(r => ({
        protocol: r.protocol,
        chain: r.chain,
        rate: ((r.borrowRate?.['USDC'] || 0) * 100).toFixed(2) + '%',
      })),
    };
  }

  private generateMockTrends(asset: string, days: number) {
    const trends: any[] = [];
    const baseRate = asset === 'USDC' ? 0.048 : asset === 'ETH' ? 0.032 : 0.04;
    
    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      const variation = (Math.random() - 0.5) * 0.01;
      trends.push({
        date: date.toISOString().split('T')[0],
        rate: ((baseRate + variation) * 100).toFixed(2) + '%',
        raw: baseRate + variation,
      });
    }
    
    return trends;
  }

  private calculateOpportunities(amount: number, asset: string) {
    const opportunities: any[] = [];
    
    const protocols = [
      { protocol: 'Aave', chain: 'Ethereum', apy: 0.048, logo: '👻' },
      { protocol: 'Aave', chain: 'Polygon', apy: 0.055, logo: '👻' },
      { protocol: 'Compound', chain: 'Ethereum', apy: 0.042, logo: '🔷' },
      { protocol: 'Morpho', chain: 'Ethereum', apy: 0.052, logo: '◈' },
      { protocol: 'Radiant', chain: 'Arbitrum', apy: 0.055, logo: '◈' },
      { protocol: 'Venus', chain: 'BSC', apy: 0.052, logo: '♨️' },
    ];
    
    for (const p of protocols) {
      const annualYield = amount * p.apy;
      opportunities.push({
        ...p,
        amount,
        annualYield: annualYield.toFixed(2),
        monthlyYield: (annualYield / 12).toFixed(2),
        dailyYield: (annualYield / 365).toFixed(2),
      });
    }
    
    return opportunities.sort((a, b) => b.apy - a.apy);
  }
}
