import { Injectable } from '@nestjs/common';

export interface MevTransaction {
  hash: string;
  type: 'sandwich' | 'arbitrage' | 'liquidation' | 'flashloan';
  blockNumber: number;
  timestamp: number;
  profit: number;
  profitUsd: number;
  gasUsed: number;
  gasPrice: number;
  tokenIn: string;
  tokenOut: string;
  poolAddress: string;
  botAddress: string;
  volume: number;
}

export interface MevStats {
  totalMevProfit24h: number;
  totalTransactions24h: number;
  sandwichAttacks24h: number;
  arbitrages24h: number;
  liquidations24h: number;
  avgGasPrice: number;
  topBot: string;
  topBotProfit: number;
}

export interface GasAnalysis {
  current: number;
  avg1h: number;
  avg24h: number;
  recommendation: 'optimal' | 'high' | 'wait';
}

@Injectable()
export class MevExplorerService {
  private readonly mockBots = [
    '0x1234...aBCD',
    '0xMEV...bot01',
    '0xArbi...trage',
    '0xLiquid...ate',
    '0xSandwich...PRO',
    '0xFlash...loan',
    '0xUniswap...Bot',
    '0xCurve...Master'
  ];

  private readonly mockPools = [
    '0x88e6A0c2dD26F14d3e3A8A1E1dE1C7A8B9C0D1E',
    '0x4e68C9dB3c0A5D0E1F2A3B4C5D6E7F8A9B0C1D2',
    '0x8da0C5b8E9A1B2C3D4E5F6A7B8C9D0E1F2A3B4'
  ];

  private readonly tokens = [
    { in: 'WETH', out: 'USDC' },
    { in: 'WBTC', out: 'USDC' },
    { in: 'USDC', out: 'WETH' },
    { in: 'USDT', out: 'WETH' },
    { in: 'WETH', out: 'DAI' },
    { in: 'WBTC', out: 'WETH' },
    { in: 'USDC', out: 'USDT' },
    { in: 'WETH', out: 'USDT' }
  ];

  private generateHash(): string {
    const chars = '0123456789abcdef';
    let hash = '0x';
    for (let i = 0; i < 64; i++) {
      hash += chars[Math.floor(Math.random() * chars.length)];
    }
    return hash;
  }

  private generateMockTransaction(type: MevTransaction['type']): MevTransaction {
    const tokenPair = this.tokens[Math.floor(Math.random() * this.tokens.length)];
    const profit = type === 'sandwich' 
      ? Math.random() * 5 + 0.1 
      : type === 'arbitrage' 
        ? Math.random() * 10 + 0.5 
        : type === 'liquidation' 
          ? Math.random() * 20 + 1 
          : Math.random() * 3 + 0.1;
    
    return {
      hash: this.generateHash(),
      type,
      blockNumber: 19000000 + Math.floor(Math.random() * 10000),
      timestamp: Date.now() - Math.floor(Math.random() * 86400000),
      profit: Number(profit.toFixed(4)),
      profitUsd: Number((profit * 3000).toFixed(2)),
      gasUsed: Math.floor(Math.random() * 300000) + 50000,
      gasPrice: Number((Math.random() * 100 + 20).toFixed(2)),
      tokenIn: tokenPair.in,
      tokenOut: tokenPair.out,
      poolAddress: this.mockPools[Math.floor(Math.random() * this.mockPools.length)],
      botAddress: this.mockBots[Math.floor(Math.random() * this.mockBots.length)],
      volume: Number((Math.random() * 1000000 + 10000).toFixed(2))
    };
  }

  async getRecentTransactions(limit: number = 50): Promise<MevTransaction[]> {
    const transactions: MevTransaction[] = [];
    const types: MevTransaction['type'][] = ['sandwich', 'arbitrage', 'liquidation', 'flashloan'];
    
    for (let i = 0; i < limit; i++) {
      const type = types[Math.floor(Math.random() * types.length)];
      transactions.push(this.generateMockTransaction(type));
    }
    
    return transactions.sort((a, b) => b.timestamp - a.timestamp);
  }

  async getMevStats(): Promise<MevStats> {
    return {
      totalMevProfit24h: Number((Math.random() * 500 + 200).toFixed(2)),
      totalTransactions24h: Math.floor(Math.random() * 500) + 100,
      sandwichAttacks24h: Math.floor(Math.random() * 200) + 50,
      arbitrages24h: Math.floor(Math.random() * 150) + 30,
      liquidations24h: Math.floor(Math.random() * 100) + 20,
      avgGasPrice: Number((Math.random() * 80 + 30).toFixed(2)),
      topBot: this.mockBots[Math.floor(Math.random() * this.mockBots.length)],
      topBotProfit: Number((Math.random() * 50 + 10).toFixed(2))
    };
  }

  async getGasAnalysis(): Promise<GasAnalysis> {
    const current = Math.random() * 100 + 20;
    const avg1h = Math.random() * 80 + 30;
    const avg24h = Math.random() * 60 + 40;
    
    let recommendation: GasAnalysis['recommendation'] = 'optimal';
    if (current > avg24h * 1.3) {
      recommendation = 'high';
    } else if (current < avg24h * 0.7) {
      recommendation = 'wait';
    }
    
    return {
      current: Number(current.toFixed(2)),
      avg1h: Number(avg1h.toFixed(2)),
      avg24h: Number(avg24h.toFixed(2)),
      recommendation
    };
  }

  async getTopBots(limit: number = 10): Promise<{address: string; profit: number; txCount: number}[]> {
    return this.mockBots.slice(0, limit).map(bot => ({
      address: bot,
      profit: Number((Math.random() * 100 + 10).toFixed(2)),
      txCount: Math.floor(Math.random() * 50) + 5
    })).sort((a, b) => b.profit - a.profit);
  }

  async getMevByType(type?: MevTransaction['type']): Promise<MevTransaction[]> {
    let transactions = await this.getRecentTransactions(100);
    if (type) {
      transactions = transactions.filter(t => t.type === type);
    }
    return transactions;
  }

  async searchByAddress(address: string): Promise<MevTransaction[]> {
    const all = await this.getRecentTransactions(100);
    return all.filter(t => t.botAddress.toLowerCase().includes(address.toLowerCase()));
  }

  async getHistoricalData(period: string = '24h'): Promise<{time: string; profit: number; count: number}[]> {
    const points = period === '1h' ? 12 : period === '24h' ? 24 : 168;
    const data: {time: string; profit: number; count: number}[] = [];
    const now = Date.now();
    
    for (let i = 0; i < points; i++) {
      data.push({
        time: new Date(now - i * (period === '1h' ? 300000 : 3600000)).toISOString(),
        profit: Number((Math.random() * 50 + 5).toFixed(2)),
        count: Math.floor(Math.random() * 30) + 5
      });
    }
    
    return data.reverse();
  }
}
