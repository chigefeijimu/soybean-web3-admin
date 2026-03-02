import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class WalletActivityService {
  private readonly logger = new Logger(WalletActivityService.name);

  // Chain RPC mappings
  private readonly CHAIN_RPC: Record<string, string> = {
    '1': 'https://eth.llamarpc.com',
    '137': 'https://polygon-rpc.com',
    '42161': 'https://arb1.arbitrum.io/rpc',
    '10': 'https://mainnet.optimism.io',
    '56': 'https://bsc-dataseed.binance.org',
    '8453': 'https://mainnet.base.org',
    '43114': 'https://api.avax.network/ext/bc/C/rpc',
  };

  private readonly CHAIN_EXPLORER: Record<string, string> = {
    '1': 'https://api.etherscan.io/api',
    '137': 'https://api.polygonscan.com/api',
    '42161': 'https://api.arbiscan.io/api',
    '10': 'https://api-optimistic.etherscan.io/api',
    '56': 'https://api.bscscan.com/api',
    '8453': 'https://api.basescan.org/api',
    '43114': 'api.snowtrace.io/api',
  };

  private readonly CHAIN_NAME: Record<string, string> = {
    '1': 'Ethereum',
    '137': 'Polygon',
    '42161': 'Arbitrum',
    '10': 'Optimism',
    '56': 'BSC',
    '8453': 'Base',
    '43114': 'Avalanche',
  };

  // In-memory storage for tracked wallets
  private trackedWallets: Map<string, { address: string; chainId: string; lastUpdated: number }> = new Map();

  async analyzeWalletActivity(address: string, chainId: string = '1') {
    try {
      const transactions = await this.getTransactions(address, chainId);
      
      if (!transactions || transactions.length === 0) {
        return this.getEmptyAnalysis(address, chainId);
      }

      // Calculate statistics
      const totalTx = transactions.length;
      const totalGasSpent = transactions.reduce((sum: number, tx: any) => sum + (tx.gasUsed || 0), 0);
      const totalGasValue = transactions.reduce((sum: number, tx: any) => sum + (tx.gasValue || 0), 0);
      
      // Group by day
      const dailyActivity = this.groupByDay(transactions);
      
      // Group by hour
      const hourlyActivity = this.groupByHour(transactions);
      
      // Group by day of week
      const weeklyActivity = this.groupByWeekday(transactions);
      
      // Transaction types
      const txTypes = this.analyzeTransactionTypes(transactions);
      
      // Activity score (0-100)
      const activityScore = this.calculateActivityScore(transactions);
      
      // Time since last activity
      const lastActivity = transactions[0]?.timeStamp ? new Date(parseInt(transactions[0].timeStamp) * 1000) : null;
      const daysSinceLastActivity = lastActivity ? Math.floor((Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)) : -1;

      return {
        address,
        chainId,
        chainName: this.CHAIN_NAME[chainId] || 'Unknown',
        summary: {
          totalTransactions: totalTx,
          totalGasSpent: this.formatGas(totalGasSpent),
          totalGasValueUSD: totalGasValue.toFixed(2),
          averageGasPerTx: this.formatGas(Math.floor(totalGasSpent / totalTx)),
          activityScore,
          daysSinceLastActivity,
          firstActivity: transactions[transactions.length - 1]?.timeStamp 
            ? new Date(parseInt(transactions[transactions.length - 1].timeStamp) * 1000).toISOString()
            : null,
          lastActivity: lastActivity ? lastActivity.toISOString() : null,
        },
        dailyActivity,
        hourlyActivity,
        weeklyActivity,
        transactionTypes: txTypes,
      };
    } catch (error) {
      this.logger.error(`Error analyzing wallet ${address}: ${error.message}`);
      return this.getEmptyAnalysis(address, chainId);
    }
  }

  async getGasStats(address: string, chainId: string = '1') {
    try {
      const transactions = await this.getTransactions(address, chainId);
      
      if (!transactions || transactions.length === 0) {
        return { address, chainId, gasStats: null };
      }

      // Calculate gas statistics
      const gasPrices = transactions.map((tx: any) => tx.gasPrice || 0).filter((g: number) => g > 0);
      const gasUsed = transactions.map((tx: any) => tx.gasUsed || 0).filter((g: number) => g > 0);
      
      const avgGasPrice = gasPrices.length > 0 
        ? gasPrices.reduce((a: number, b: number) => a + b, 0) / gasPrices.length 
        : 0;
      
      const avgGasUsed = gasUsed.length > 0 
        ? gasUsed.reduce((a: number, b: number) => a + b, 0) / gasUsed.length 
        : 0;

      // Group by month
      const monthlyGas = this.groupGasByMonth(transactions);
      
      // Gas trends
      const recentTx = transactions.slice(0, 10);
      const olderTx = transactions.slice(10, 20);
      const recentAvgGas = recentTx.length > 0 
        ? recentTx.reduce((sum: number, tx: any) => sum + (tx.gasValue || 0), 0) / recentTx.length 
        : 0;
      const olderAvgGas = olderTx.length > 0 
        ? olderTx.reduce((sum: number, tx: any) => sum + (tx.gasValue || 0), 0) / olderTx.length 
        : 0;
      
      const gasTrend = olderAvgGas > 0 ? ((recentAvgGas - olderAvgGas) / olderAvgGas * 100).toFixed(1) : '0';

      return {
        address,
        chainId,
        chainName: this.CHAIN_NAME[chainId] || 'Unknown',
        gasStats: {
          averageGasPrice: this.formatGas(Math.floor(avgGasPrice)),
          averageGasUsed: avgGasUsed.toFixed(0),
          averageTxCostUSD: (avgGasPrice * avgGasUsed / 1e18 * 2500).toFixed(4),
          totalGasSpent: this.formatGas(transactions.reduce((sum: number, tx: any) => sum + (tx.gasUsed || 0), 0)),
          totalGasValueUSD: transactions.reduce((sum: number, tx: any) => sum + (tx.gasValue || 0), 0).toFixed(2),
          monthlyGas,
          gasTrend: parseFloat(gasTrend),
          cheapestTx: this.findCheapestTx(transactions),
          mostExpensiveTx: this.findMostExpensiveTx(transactions),
        },
      };
    } catch (error) {
      this.logger.error(`Error getting gas stats for ${address}: ${error.message}`);
      return { address, chainId, gasStats: null };
    }
  }

  async getActivityHeatmap(address: string, chainId: string = '1') {
    try {
      const transactions = await this.getTransactions(address, chainId);
      
      if (!transactions || transactions.length === 0) {
        return { address, chainId, heatmap: [] };
      }

      // Create 7x24 heatmap (day of week x hour)
      const heatmap: number[][] = Array(7).fill(null).map(() => Array(24).fill(0));
      
      transactions.forEach((tx: any) => {
        const timestamp = parseInt(tx.timeStamp) * 1000;
        const date = new Date(timestamp);
        const dayOfWeek = date.getDay();
        const hour = date.getHours();
        heatmap[dayOfWeek][hour]++;
      });

      // Normalize to 0-100
      const maxVal = Math.max(...heatmap.flat());
      const normalizedHeatmap = heatmap.map(day => 
        day.map(hour => maxVal > 0 ? Math.round((hour / maxVal) * 100) : 0)
      );

      // Day labels
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      
      return {
        address,
        chainId,
        heatmap: normalizedHeatmap.map((day, index) => ({
          day: days[index],
          hours: day,
        })),
        totalTransactions: transactions.length,
        peakDay: this.findPeakDay(heatmap, days),
        peakHour: this.findPeakHour(heatmap),
      };
    } catch (error) {
      this.logger.error(`Error getting activity heatmap for ${address}: ${error.message}`);
      return { address, chainId, heatmap: [] };
    }
  }

  async getTransactionPatterns(address: string, chainId: string = '1') {
    try {
      const transactions = await this.getTransactions(address, chainId);
      
      if (!transactions || transactions.length === 0) {
        return { address, chainId, patterns: null };
      }

      // Analyze patterns
      const patterns = {
        isActive: transactions.length > 50,
        isHeavyUser: transactions.length > 200,
        avgTxPerDay: 0,
        mostActiveHour: '',
        mostActiveDay: '',
        txFrequency: 'low',
        commonContractInteractions: this.getCommonContracts(transactions),
        recurringCounterparties: this.getRecurringCounterparties(transactions),
        isTrader: this.isTraderPattern(transactions),
        isDefiUser: this.isDefiUserPattern(transactions),
        isNftTrader: this.isNftTraderPattern(transactions),
      };

      // Calculate average transactions per day
      if (transactions.length > 0) {
        const firstTx = new Date(parseInt(transactions[transactions.length - 1].timeStamp) * 1000);
        const lastTx = new Date(parseInt(transactions[0].timeStamp) * 1000);
        const daysDiff = Math.max(1, (lastTx.getTime() - firstTx.getTime()) / (1000 * 60 * 60 * 24));
        patterns.avgTxPerDay = parseFloat((transactions.length / daysDiff).toFixed(2));

        if (patterns.avgTxPerDay > 10) patterns.txFrequency = 'very_high';
        else if (patterns.avgTxPerDay > 5) patterns.txFrequency = 'high';
        else if (patterns.avgTxPerDay > 1) patterns.txFrequency = 'medium';
      }

      // Most active hour
      const hourlyCounts = Array(24).fill(0);
      transactions.forEach((tx: any) => {
        const hour = new Date(parseInt(tx.timeStamp) * 1000).getHours();
        hourlyCounts[hour]++;
      });
      const peakHour = hourlyCounts.indexOf(Math.max(...hourlyCounts));
      patterns.mostActiveHour = `${peakHour}:00 - ${peakHour + 1}:00`;

      // Most active day
      const dailyCounts = Array(7).fill(0);
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      transactions.forEach((tx: any) => {
        const day = new Date(parseInt(tx.timeStamp) * 1000).getDay();
        dailyCounts[day]++;
      });
      patterns.mostActiveDay = days[dailyCounts.indexOf(Math.max(...dailyCounts))];

      return {
        address,
        chainId,
        patterns,
      };
    } catch (error) {
      this.logger.error(`Error getting transaction patterns for ${address}: ${error.message}`);
      return { address, chainId, patterns: null };
    }
  }

  async getHourlyStats(address: string, chainId: string = '1') {
    try {
      const transactions = await this.getTransactions(address, chainId);
      
      if (!transactions || transactions.length === 0) {
        return { address, chainId, hourlyStats: [] };
      }

      const hourlyStats = Array(24).fill(0).map((_, hour) => ({
        hour: `${hour}:00`,
        count: 0,
        totalGas: 0,
      }));

      transactions.forEach((tx: any) => {
        const hour = new Date(parseInt(tx.timeStamp) * 1000).getHours();
        hourlyStats[hour].count++;
        hourlyStats[hour].totalGas += tx.gasValue || 0;
      });

      return {
        address,
        chainId,
        hourlyStats: hourlyStats.map(h => ({
          hour: h.hour,
          transactionCount: h.count,
          totalGasUSD: h.totalGas.toFixed(4),
        })),
      };
    } catch (error) {
      this.logger.error(`Error getting hourly stats for ${address}: ${error.message}`);
      return { address, chainId, hourlyStats: [] };
    }
  }

  async getWeeklyStats(address: string, chainId: string = '1') {
    try {
      const transactions = await this.getTransactions(address, chainId);
      
      if (!transactions || transactions.length === 0) {
        return { address, chainId, weeklyStats: [] };
      }

      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const weeklyStats = days.map(day => ({
        day,
        count: 0,
        totalGas: 0,
      }));

      transactions.forEach((tx: any) => {
        const day = new Date(parseInt(tx.timeStamp) * 1000).getDay();
        weeklyStats[day].count++;
        weeklyStats[day].totalGas += tx.gasValue || 0;
      });

      return {
        address,
        chainId,
        weeklyStats: weeklyStats.map(w => ({
          day: w.day,
          transactionCount: w.count,
          totalGasUSD: w.totalGas.toFixed(4),
        })),
      };
    } catch (error) {
      this.logger.error(`Error getting weekly stats for ${address}: ${error.message}`);
      return { address, chainId, weeklyStats: [] };
    }
  }

  async getTopInteractions(address: string, chainId: string = '1') {
    try {
      const transactions = await this.getTransactions(address, chainId);
      
      if (!transactions || transactions.length === 0) {
        return { address, chainId, topInteractions: [] };
      }

      // Count interactions by contract
      const contractCounts: Record<string, { count: number; totalGas: number; firstTx: number; lastTx: number }> = {};
      
      transactions.forEach((tx: any) => {
        const to = tx.to || tx.contractAddress;
        if (to) {
          if (!contractCounts[to]) {
            contractCounts[to] = { count: 0, totalGas: 0, firstTx: parseInt(tx.timeStamp), lastTx: parseInt(tx.timeStamp) };
          }
          contractCounts[to].count++;
          contractCounts[to].totalGas += tx.gasValue || 0;
          contractCounts[to].firstTx = Math.min(contractCounts[to].firstTx, parseInt(tx.timeStamp));
          contractCounts[to].lastTx = Math.max(contractCounts[to].lastTx, parseInt(tx.timeStamp));
        }
      });

      // Sort by count and get top 10
      const topInteractions = Object.entries(contractCounts)
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 10)
        .map(([address, data]) => ({
          address,
          transactionCount: data.count,
          totalGasUSD: data.totalGas.toFixed(2),
          firstInteraction: new Date(data.firstTx * 1000).toISOString(),
          lastInteraction: new Date(data.lastTx * 1000).toISOString(),
        }));

      return {
        address,
        chainId,
        topInteractions,
      };
    } catch (error) {
      this.logger.error(`Error getting top interactions for ${address}: ${error.message}`);
      return { address, chainId, topInteractions: [] };
    }
  }

  async trackWallet(address: string, chainId: string = '1') {
    const key = `${chainId}-${address}`;
    this.trackedWallets.set(key, {
      address,
      chainId,
      lastUpdated: Date.now(),
    });
    
    return {
      success: true,
      message: `Wallet ${address} on ${this.CHAIN_NAME[chainId] || chainId} is now being tracked`,
      trackedCount: this.trackedWallets.size,
    };
  }

  // Helper methods
  private async getTransactions(address: string, chainId: string): Promise<any[]> {
    try {
      const apiKey = process.env.ETHERSCAN_API_KEY || 'YourApiKeyToken';
      const explorer = this.CHAIN_EXPLORER[chainId];
      
      if (!explorer) {
        return [];
      }

      const url = `${explorer}?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=100&sort=desc&apikey=${apiKey}`;
      
      const response = await axios.get(url, { timeout: 10000 });
      
      if (response.data.status === '1' && response.data.result) {
        const txs = response.data.result.slice(0, 100); // Limit to 100 transactions
        
        // Add calculated fields
        return txs.map((tx: any) => ({
          ...tx,
          gasUsed: parseInt(tx.gasUsed) || 0,
          gasPrice: parseInt(tx.gasPrice) || 0,
          gasValue: (parseInt(tx.gasUsed) * parseInt(tx.gasPrice) / 1e18) * 2500, // Approximate USD value
        }));
      }
      
      return [];
    } catch (error) {
      this.logger.error(`Error fetching transactions: ${error.message}`);
      return [];
    }
  }

  private groupByDay(transactions: any[]): any[] {
    const daily: Record<string, { date: string; count: number; gas: number }> = {};
    
    transactions.forEach((tx: any) => {
      const date = new Date(parseInt(tx.timeStamp) * 1000).toISOString().split('T')[0];
      if (!daily[date]) {
        daily[date] = { date, count: 0, gas: 0 };
      }
      daily[date].count++;
      daily[date].gas += tx.gasValue || 0;
    });

    return Object.values(daily)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 30)
      .map(d => ({
        date: d.date,
        transactionCount: d.count,
        totalGasUSD: d.gas.toFixed(2),
      }));
  }

  private groupByHour(transactions: any[]): any[] {
    const hourly: number[] = Array(24).fill(0);
    
    transactions.forEach((tx: any) => {
      const hour = new Date(parseInt(tx.timeStamp) * 1000).getHours();
      hourly[hour]++;
    });

    return hourly.map((count, hour) => ({
      hour: `${hour}:00`,
      count,
    }));
  }

  private groupByWeekday(transactions: any[]): any[] {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const weekly: number[] = Array(7).fill(0);
    
    transactions.forEach((tx: any) => {
      const day = new Date(parseInt(tx.timeStamp) * 1000).getDay();
      weekly[day]++;
    });

    return days.map((day, index) => ({
      day,
      count: weekly[index],
    }));
  }

  private analyzeTransactionTypes(transactions: any[]): any {
    // Simple heuristic based on transaction value and gas
    const smallTx = transactions.filter((tx: any) => parseFloat(tx.value) < 0.01).length;
    const mediumTx = transactions.filter((tx: any) => parseFloat(tx.value) >= 0.01 && parseFloat(tx.value) < 1).length;
    const largeTx = transactions.filter((tx: any) => parseFloat(tx.value) >= 1).length;
    const contractCalls = transactions.filter((tx: any) => tx.input && tx.input !== '0x').length;

    const total = transactions.length || 1;
    
    return {
      smallValue: smallTx,
      mediumValue: mediumTx,
      largeValue: largeTx,
      contractInteractions: contractCalls,
      percentages: {
        smallValue: ((smallTx / total) * 100).toFixed(1),
        mediumValue: ((mediumTx / total) * 100).toFixed(1),
        largeValue: ((largeTx / total) * 100).toFixed(1),
        contractInteractions: ((contractCalls / total) * 100).toFixed(1),
      },
    };
  }

  private calculateActivityScore(transactions: any[]): number {
    if (!transactions || transactions.length === 0) return 0;
    
    const totalTx = transactions.length;
    const recentTx = transactions.slice(0, 10);
    
    // Check if wallet is active recently
    const lastTxTime = parseInt(transactions[0]?.timeStamp || '0') * 1000;
    const daysSinceLastTx = (Date.now() - lastTxTime) / (1000 * 60 * 60 * 24);
    
    // Calculate score based on activity
    let score = 0;
    
    // Activity volume (0-40)
    score += Math.min(40, totalTx / 5);
    
    // Recency (0-30)
    if (daysSinceLastTx < 1) score += 30;
    else if (daysSinceLastTx < 7) score += 20;
    else if (daysSinceLastTx < 30) score += 10;
    
    // Consistency (0-30)
    if (transactions.length > 50) score += 15;
    if (transactions.length > 100) score += 15;
    
    return Math.min(100, Math.round(score));
  }

  private groupGasByMonth(transactions: any[]): any[] {
    const monthly: Record<string, { month: string; totalGas: number; txCount: number }> = {};
    
    transactions.forEach((tx: any) => {
      const month = new Date(parseInt(tx.timeStamp) * 1000).toISOString().slice(0, 7);
      if (!monthly[month]) {
        monthly[month] = { month, totalGas: 0, txCount: 0 };
      }
      monthly[month].totalGas += tx.gasValue || 0;
      monthly[month].txCount++;
    });

    return Object.values(monthly)
      .sort((a, b) => b.month.localeCompare(a.month))
      .slice(0, 12)
      .map(m => ({
        month: m.month,
        transactionCount: m.txCount,
        totalGasUSD: m.totalGas.toFixed(2),
      }));
  }

  private findCheapestTx(transactions: any[]): any {
    if (!transactions.length) return null;
    const sorted = [...transactions].sort((a, b) => (a.gasValue || 0) - (b.gasValue || 0));
    const cheapest = sorted[0];
    return {
      hash: cheapest.hash,
      gasUSD: (cheapest.gasValue || 0).toFixed(4),
      date: new Date(parseInt(cheapest.timeStamp) * 1000).toISOString(),
    };
  }

  private findMostExpensiveTx(transactions: any[]): any {
    if (!transactions.length) return null;
    const sorted = [...transactions].sort((a, b) => (b.gasValue || 0) - (a.gasValue || 0));
    const mostExpensive = sorted[0];
    return {
      hash: mostExpensive.hash,
      gasUSD: (mostExpensive.gasValue || 0).toFixed(4),
      date: new Date(parseInt(mostExpensive.timeStamp) * 1000).toISOString(),
    };
  }

  private findPeakDay(heatmap: number[][], days: string[]): string {
    const dayTotals = heatmap.map(day => day.reduce((a, b) => a + b, 0));
    return days[dayTotals.indexOf(Math.max(...dayTotals))];
  }

  private findPeakHour(heatmap: number[][]): string {
    const hourTotals = Array(24).fill(0);
    heatmap.forEach(day => {
      day.forEach((count, hour) => {
        hourTotals[hour] += count;
      });
    });
    const peakHour = hourTotals.indexOf(Math.max(...hourTotals));
    return `${peakHour}:00 - ${peakHour + 1}:00`;
  }

  private getCommonContracts(transactions: any[]): string[] {
    const contracts: Record<string, number> = {};
    transactions.forEach((tx: any) => {
      if (tx.to) {
        contracts[tx.to] = (contracts[tx.to] || 0) + 1;
      }
    });
    return Object.entries(contracts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([addr]) => addr);
  }

  private getRecurringCounterparties(transactions: any[]): string[] {
    const counterparties: Record<string, number> = {};
    transactions.forEach((tx: any) => {
      if (tx.from !== tx.to && tx.to) {
        counterparties[tx.to] = (counterparties[tx.to] || 0) + 1;
      }
    });
    return Object.entries(counterparties)
      .filter(([_, count]) => count > 3)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([addr]) => addr);
  }

  private isTraderPattern(transactions: any[]): boolean {
    // Check for frequent transactions with similar values
    const valueCounts: Record<string, number> = {};
    transactions.slice(0, 50).forEach((tx: any) => {
      const valueBucket = parseFloat(tx.value) > 0.1 ? 'large' : parseFloat(tx.value) > 0.01 ? 'medium' : 'small';
      valueCounts[valueBucket] = (valueCounts[valueBucket] || 0) + 1;
    });
    return valueCounts.medium !== undefined && valueCounts.medium > 10;
  }

  private isDefiUserPattern(transactions: any[]): boolean {
    // Check for contract interactions (non-empty input data)
    const contractCalls = transactions.filter((tx: any) => tx.input && tx.input !== '0x').length;
    return contractCalls > 10;
  }

  private isNftTraderPattern(transactions: any[]): boolean {
    // Check for NFT-related contracts (OpenSea, Blur, etc.)
    const nftContracts = ['0x495f947276749ce646f68ac8c248420045cb7b5', '0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d', '0x23581767a106ae21c074b2276d25e5c3e136a68'];
    const nftTx = transactions.filter((tx: any) => nftContracts.includes(tx.to?.toLowerCase()));
    return nftTx.length > 5;
  }

  private formatGas(gas: number): string {
    if (gas >= 1e9) return (gas / 1e9).toFixed(2) + ' Gwei';
    if (gas >= 1e6) return (gas / 1e6).toFixed(2) + ' Mwei';
    return gas.toString() + ' Wei';
  }

  private getEmptyAnalysis(address: string, chainId: string) {
    return {
      address,
      chainId,
      chainName: this.CHAIN_NAME[chainId] || 'Unknown',
      summary: {
        totalTransactions: 0,
        totalGasSpent: '0 Gwei',
        totalGasValueUSD: '0',
        averageGasPerTx: '0 Gwei',
        activityScore: 0,
        daysSinceLastActivity: -1,
        firstActivity: null,
        lastActivity: null,
      },
      dailyActivity: [],
      hourlyActivity: Array(24).fill(0).map((_, h) => ({ hour: `${h}:00`, count: 0 })),
      weeklyActivity: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => ({ day, count: 0 })),
      transactionTypes: { smallValue: 0, mediumValue: 0, largeValue: 0, contractInteractions: 0, percentages: {} },
    };
  }
}
