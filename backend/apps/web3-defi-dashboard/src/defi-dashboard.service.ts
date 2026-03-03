import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';

export interface ProtocolData {
  name: string;
  tvl: number;
  apy: number;
  users: number;
  category: string;
  chain: string;
}

export interface PositionData {
  protocol: string;
  token: string;
  balance: number;
  value: number;
  apy: number;
  chain: number;
  type: string;
}

@Injectable()
export class DefiDashboardService {
  private readonly coingeckoApi = 'https://api.coingecko.com/api/v3';
  private readonly defiApi = 'https://api.llama.fi';

  constructor(private readonly httpService: HttpService) {}

  async getDashboardSummary(address: string, chains: number[]) {
    // Simulated comprehensive DeFi dashboard data
    // In production, this would aggregate from multiple APIs
    
    const totalValue = Math.random() * 100000 + 10000;
    const totalYield = Math.random() * 15 + 2;
    
    return {
      totalValueUSD: totalValue,
      totalYieldAPY: totalYield,
      totalPositions: Math.floor(Math.random() * 20 + 5),
      activeProtocols: Math.floor(Math.random() * 8 + 3),
      chains: chains.length,
      change24h: (Math.random() - 0.5) * 10,
      changeWeekly: (Math.random() - 0.3) * 20,
      changeMonthly: (Math.random() - 0.2) * 40,
      riskScore: Math.floor(Math.random() * 30 + 40),
      riskLevel: 'moderate',
      lastUpdated: new Date().toISOString(),
    };
  }

  async getPositions(address: string, chain: number): Promise<PositionData[]> {
    // Simulated positions data
    const protocols = ['Aave', 'Uniswap', 'Compound', 'Curve', 'Yearn', 'Lido', 'Gearbox'];
    const tokens = ['ETH', 'USDC', 'USDT', 'WBTC', 'DAI', 'AAVE', 'CRV'];
    const types = ['lending', 'liquidity', 'staking', 'farming'];
    
    const positions: PositionData[] = [];
    const numPositions = Math.floor(Math.random() * 8 + 3);
    
    for (let i = 0; i < numPositions; i++) {
      positions.push({
        protocol: protocols[Math.floor(Math.random() * protocols.length)],
        token: tokens[Math.floor(Math.random() * tokens.length)],
        balance: Math.random() * 10 + 0.1,
        value: Math.random() * 20000 + 100,
        apy: Math.random() * 20,
        chain: chain,
        type: types[Math.floor(Math.random() * types.length)],
      });
    }
    
    return positions;
  }

  async getYieldOpportunities(chain: number, limit: number) {
    const opportunities = [
      { protocol: 'Aave', token: 'USDC', apy: 4.5, tvl: 35000000000, risk: 'low', chain: 'Ethereum' },
      { protocol: 'Compound', token: 'USDT', apy: 3.8, tvl: 12000000000, risk: 'low', chain: 'Ethereum' },
      { protocol: 'Lido', token: 'ETH', apy: 3.2, tvl: 45000000000, risk: 'low', chain: 'Ethereum' },
      { protocol: 'Curve', token: 'ETH', apy: 2.1, tvl: 22000000000, risk: 'medium', chain: 'Ethereum' },
      { protocol: 'Yearn', token: 'USDC', apy: 5.8, tvl: 5000000000, risk: 'medium', chain: 'Ethereum' },
      { protocol: 'Uniswap', token: 'ETH-USDC', apy: 12.5, tvl: 8000000000, risk: 'medium', chain: 'Ethereum' },
      { protocol: 'GMX', token: 'ETH', apy: 8.2, tvl: 600000000, risk: 'high', chain: 'Arbitrum' },
      { protocol: 'Velodrome', token: 'OP', apy: 15.3, tvl: 400000000, risk: 'medium', chain: 'Optimism' },
      { protocol: 'QuickSwap', token: 'MATIC', apy: 18.5, tvl: 800000000, risk: 'medium', chain: 'Polygon' },
      { protocol: 'PancakeSwap', token: 'CAKE', apy: 10.2, tvl: 3000000000, risk: 'medium', chain: 'BSC' },
      { protocol: 'Trader Joe', token: 'AVAX', apy: 8.7, tvl: 500000000, risk: 'medium', chain: 'Avalanche' },
      { protocol: 'Aerodrome', token: 'ETH', apy: 6.5, tvl: 300000000, risk: 'low', chain: 'Base' },
    ];

    return opportunities.slice(0, limit);
  }

  async getProtocolStats(): Promise<ProtocolData[]> {
    return [
      { name: 'Aave', tvl: 35000000000, apy: 4.2, users: 600000, category: 'Lending', chain: 'Ethereum' },
      { name: 'Uniswap', tvl: 25000000000, apy: 8.5, users: 450000, category: 'DEX', chain: 'Ethereum' },
      { name: 'Lido', tvl: 45000000000, apy: 3.2, users: 300000, category: 'Staking', chain: 'Ethereum' },
      { name: 'Curve', tvl: 22000000000, apy: 2.5, users: 200000, category: 'DEX', chain: 'Ethereum' },
      { name: 'Compound', tvl: 12000000000, apy: 3.8, users: 250000, category: 'Lending', chain: 'Ethereum' },
      { name: 'Yearn', tvl: 5000000000, apy: 5.5, users: 50000, category: 'Yield', chain: 'Ethereum' },
      { name: 'MakerDAO', tvl: 8000000000, apy: 1.5, users: 100000, category: 'Lending', chain: 'Ethereum' },
      { name: 'Morpho', tvl: 3000000000, apy: 4.0, users: 80000, category: 'Lending', chain: 'Ethereum' },
    ];
  }

  async getPortfolioDistribution(address: string, chains: number[]) {
    const categories = ['Lending', 'DEX', 'Staking', 'Yield Farming', 'Liquid Staking', 'Bridge'];
    const distribution = categories.map(cat => ({
      category: cat,
      value: Math.random() * 30000 + 5000,
      percentage: 0,
      positions: Math.floor(Math.random() * 5 + 1),
    }));

    const total = distribution.reduce((sum, item) => sum + item.value, 0);
    distribution.forEach(item => {
      item.percentage = (item.value / total) * 100;
    });

    return {
      distribution,
      totalValue: total,
      diversificationScore: Math.min(100, Math.floor(total / 1000)),
    };
  }

  async getRiskAnalysis(address: string, chains: number[]) {
    return {
      overallRisk: Math.floor(Math.random() * 40 + 30),
      riskLevel: 'moderate',
      factors: {
        concentration: Math.floor(Math.random() * 30 + 20),
        volatility: Math.floor(Math.random() * 25 + 25),
        protocolExposure: Math.floor(Math.random() * 20 + 15),
        liquidity: Math.floor(Math.random() * 20 + 30),
        impermanentLoss: Math.floor(Math.random() * 15 + 5),
      },
      recommendations: [
        'Consider diversifying across more protocols',
        'Reduce exposure to high-volatility assets',
        'Add stablecoin positions for hedging',
        'Monitor positions for liquidation risk',
      ],
      stressTest: {
        marketCrash: { potentialLoss: Math.random() * 30 + 10 },
        protocolHacked: { potentialLoss: Math.random() * 20 + 5 },
        stablecoinDepeg: { potentialLoss: Math.random() * 15 + 3 },
      },
    };
  }

  async getMarketOverview() {
    return {
      totalDefiTVL: 185000000000,
      change24h: 2.3,
      change7d: 5.8,
      change30d: 12.5,
      topChains: [
        { name: 'Ethereum', tvl: 120000000000, dominance: 64.8 },
        { name: 'BSC', tvl: 18000000000, dominance: 9.7 },
        { name: 'Arbitrum', tvl: 15000000000, dominance: 8.1 },
        { name: 'Optimism', tvl: 12000000000, dominance: 6.5 },
        { name: 'Polygon', tvl: 8000000000, dominance: 4.3 },
        { name: 'Avalanche', tvl: 6000000000, dominance: 3.2 },
        { name: 'Base', tvl: 4000000000, dominance: 2.1 },
      ],
      topCategories: [
        { name: 'Lending', tvl: 65000000000 },
        { name: 'DEX', tvl: 45000000000 },
        { name: 'Staking', tvl: 35000000000 },
        { name: 'Yield', tvl: 20000000000 },
        { name: 'Bridge', tvl: 15000000000 },
      ],
    };
  }
}
