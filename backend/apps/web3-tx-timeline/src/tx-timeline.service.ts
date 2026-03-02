import { Injectable } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

export interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  gasPrice: string;
  gasUsed: string;
  timestamp: number;
  blockNumber: number;
  status: 'success' | 'failed';
  tokenTransfers?: TokenTransfer[];
}

export interface TokenTransfer {
  from: string;
  to: string;
  token: string;
  symbol: string;
  value: string;
  decimals: number;
}

export interface TimelineGroup {
  date: string;
  transactions: Transaction[];
  totalValue: string;
  count: number;
  gasUsed: string;
}

export interface TimelineStats {
  totalTransactions: number;
  totalValue: string;
  totalGasUsed: string;
  averageGasPrice: string;
  successRate: string;
  dailyStats: DailyStat[];
}

export interface DailyStat {
  date: string;
  count: number;
  successCount: number;
  totalValue: string;
  totalGas: string;
}

@Injectable()
@ApiTags('Transaction Timeline')
export class TxTimelineService {
  private readonly supportedChains = [
    'ethereum', 'polygon', 'arbitrum', 'optimism', 'bsc', 'base', 'avalanche'
  ];

  // Mock data generators for demo
  private generateMockTransactions(address: string, days: number): Transaction[] {
    const transactions: Transaction[] = [];
    const now = Date.now();
    const msPerDay = 24 * 60 * 60 * 1000;
    
    const txTypes = [
      { to: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', type: 'uniswap_swap' },
      { to: '0xE592427A0AEce92De3Edee1F18E0157C05861564', type: 'uniswap_v3_swap' },
      { to: '0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F', type: 'sushi_swap' },
      { to: '0x3d9819210A31b4961b30EF54bE2aeD79B9c9Cd3B', type: 'compound_supply' },
      { to: '0x87870Bca3F3fD6335C3FbdC83E7a82f43aa5D91c', type: 'aave_supply' },
      { to: '0x0000000000000000000000000000000000000000', type: 'eth_transfer' },
    ];

    for (let i = 0; i < days * 3; i++) {
      const txType = txTypes[Math.floor(Math.random() * txTypes.length)];
      const timestamp = now - Math.floor(Math.random() * days * msPerDay);
      const value = (Math.random() * 10).toFixed(4);
      const gasUsed = Math.floor(21000 + Math.random() * 200000).toString();
      const gasPrice = Math.floor(10 + Math.random() * 100).toString();
      
      transactions.push({
        hash: `0x${this.generateRandomHex(64)}`,
        from: address,
        to: txType.to,
        value: value,
        gasPrice: gasPrice,
        gasUsed: gasUsed,
        timestamp,
        blockNumber: 19000000 + Math.floor(Math.random() * 1000000),
        status: Math.random() > 0.05 ? 'success' : 'failed',
        tokenTransfers: Math.random() > 0.5 ? [
          {
            from: address,
            to: txType.to,
            token: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
            symbol: 'USDC',
            value: (Math.random() * 1000).toFixed(2),
            decimals: 6,
          }
        ] : undefined,
      });
    }

    return transactions.sort((a, b) => b.timestamp - a.timestamp);
  }

  private generateRandomHex(length: number): string {
    const chars = '0123456789abcdef';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars[Math.floor(Math.random() * 16)];
    }
    return result;
  }

  async getTransactionTimeline(
    address: string,
    chain: string = 'ethereum',
    period: 'day' | 'week' | 'month' = 'day',
    days: number = 30,
  ): Promise<{ timeline: TimelineGroup[]; stats: TimelineStats }> {
    if (!this.supportedChains.includes(chain)) {
      throw new Error(`Unsupported chain: ${chain}`);
    }

    const transactions = this.generateMockTransactions(address.toLowerCase(), days);
    
    // Group transactions by time period
    const groups = new Map<string, Transaction[]>();
    
    transactions.forEach(tx => {
      const date = new Date(tx.timestamp);
      let key: string;
      
      if (period === 'day') {
        key = date.toISOString().split('T')[0];
      } else if (period === 'week') {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
      } else {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }
      
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(tx);
    });

    // Convert to timeline groups
    const timeline: TimelineGroup[] = Array.from(groups.entries())
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, txs]) => ({
        date,
        transactions: txs.slice(0, 50), // Limit to 50 per group
        totalValue: txs.reduce((sum, tx) => sum + parseFloat(tx.value), 0).toFixed(4),
        count: txs.length,
        gasUsed: txs.reduce((sum, tx) => sum + parseInt(tx.gasUsed), 0).toString(),
      }));

    // Calculate statistics
    const dailyStats: DailyStat[] = timeline.map(group => ({
      date: group.date,
      count: group.count,
      successCount: group.transactions.filter(tx => tx.status === 'success').length,
      totalValue: group.totalValue,
      totalGas: group.gasUsed,
    }));

    const totalValue = transactions.reduce((sum, tx) => sum + parseFloat(tx.value), 0);
    const totalGasUsed = transactions.reduce((sum, tx) => sum + parseInt(tx.gasUsed), 0);
    const avgGasPrice = transactions.length > 0 
      ? (transactions.reduce((sum, tx) => sum + parseInt(tx.gasPrice), 0) / transactions.length).toFixed(0)
      : '0';
    const successCount = transactions.filter(tx => tx.status === 'success').length;

    return {
      timeline,
      stats: {
        totalTransactions: transactions.length,
        totalValue: totalValue.toFixed(4),
        totalGasUsed: totalGasUsed.toString(),
        averageGasPrice: avgGasPrice,
        successRate: transactions.length > 0 ? (successCount / transactions.length * 100).toFixed(1) : '0',
        dailyStats,
      },
    };
  }

  async getTransactionPatterns(
    address: string,
    chain: string = 'ethereum',
  ): Promise<{
    mostActiveHour: number;
    mostActiveDay: number;
    averageTxValue: string;
    commonInteractions: { address: string; count: number }[];
    transactionTypes: { type: string; count: number }[];
  }> {
    const transactions = this.generateMockTransactions(address.toLowerCase(), 30);
    
    // Analyze patterns
    const hourCounts = new Array(24).fill(0);
    const dayCounts = new Array(7).fill(0);
    const interactionCounts = new Map<string, number>();
    const typeCounts = new Map<string, number>();

    transactions.forEach(tx => {
      const date = new Date(tx.timestamp);
      hourCounts[date.getHours()]++;
      dayCounts[date.getDay()]++;
      
      const interactionKey = tx.to.toLowerCase();
      interactionCounts.set(interactionKey, (interactionCounts.get(interactionKey) || 0) + 1);
      
      // Simplified type classification
      let type = 'transfer';
      if (tx.to === '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D') type = 'uniswap_swap';
      else if (tx.to === '0xE592427A0AEce92De3Edee1F18E0157C05861564') type = 'uniswap_v3';
      else if (tx.to === '0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F') type = 'sushi_swap';
      else if (tx.to === '0x3d9819210A31b4961b30EF54bE2aeD79B9c9Cd3B') type = 'compound';
      else if (tx.to === '0x87870Bca3F3fD6335C3FbdC83E7a82f43aa5D91c') type = 'aave';
      
      typeCounts.set(type, (typeCounts.get(type) || 0) + 1);
    });

    const mostActiveHour: number = hourCounts.indexOf(Math.max(...hourCounts));
    const mostActiveDay: number = dayCounts.indexOf(Math.max(...dayCounts));
    const avgValue = transactions.length > 0 
      ? (transactions.reduce((sum, tx) => sum + parseFloat(tx.value), 0) / transactions.length).toFixed(4)
      : '0';

    const commonInteractions = Array.from(interactionCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([address, count]) => ({ address, count }));

    const transactionTypes = Array.from(typeCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([type, count]) => ({ type, count }));

    return {
      mostActiveHour,
      mostActiveDay,
      averageTxValue: avgValue,
      commonInteractions,
      transactionTypes,
    };
  }

  async getHourlyDistribution(address: string, chain: string = 'ethereum'): Promise<{
    hours: { hour: number; count: number; percentage: string }[];
    days: { day: number; name: string; count: number; percentage: string }[];
  }> {
    const transactions = this.generateMockTransactions(address.toLowerCase(), 30);
    
    const hourCounts = new Array(24).fill(0);
    const dayCounts = new Array(7).fill(0);
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    transactions.forEach(tx => {
      const date = new Date(tx.timestamp);
      hourCounts[date.getHours()]++;
      dayCounts[date.getDay()]++;
    });

    const total = transactions.length || 1;

    const hours = hourCounts.map((count, hour) => ({
      hour,
      count,
      percentage: (count / total * 100).toFixed(1),
    }));

    const days = dayCounts.map((count, day) => ({
      day,
      name: dayNames[day],
      count,
      percentage: (count / total * 100).toFixed(1),
    }));

    return { hours, days };
  }

  getSupportedChains(): string[] {
    return this.supportedChains;
  }
}
