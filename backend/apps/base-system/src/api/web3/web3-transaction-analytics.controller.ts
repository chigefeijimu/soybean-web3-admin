import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@ApiTags('Web3 Transaction Analytics')
@Controller('web3')
export class Web3TransactionAnalyticsController {
  constructor(private readonly httpService: HttpService) {}

  @Get('transaction-analytics')
  @ApiOperation({ summary: '交易分析 - 分析钱包交易模式、Gas使用和时间分布' })
  async getTransactionAnalytics(
    @Query('address') address: string,
    @Query('chainId') chainId: number = 1,
    @Query('days') days: number = 30,
  ) {
    if (!address || !address.startsWith('0x') || address.length !== 42) {
      throw new Error('Invalid wallet address');
    }

    const chain = this.getChainConfig(chainId);
    const transactions = await this.getTransactions(address, chain, days);
    
    // 分析交易模式
    const analytics = this.analyzeTransactions(transactions, days);
    
    return {
      address,
      chainId,
      period: days,
      summary: analytics.summary,
      gasStats: analytics.gasStats,
      timeDistribution: analytics.timeDistribution,
      transactionTypes: analytics.transactionTypes,
      topContracts: analytics.topContracts,
      activityHeatmap: analytics.activityHeatmap,
    };
  }

  @Get('transaction-timeline')
  @ApiOperation({ summary: '交易时间线 - 获取交易时间序列数据' })
  async getTransactionTimeline(
    @Query('address') address: string,
    @Query('chainId') chainId: number = 1,
    @Query('days') days: number = 30,
  ) {
    const chain = this.getChainConfig(chainId);
    const transactions = await this.getTransactions(address, chain, days);
    
    // 生成每日交易统计
    const timeline = this.generateTimeline(transactions, days);
    
    return {
      address,
      chainId,
      period: days,
      dailyStats: timeline,
    };
  }

  @Get('gas-analysis')
  @ApiOperation({ summary: 'Gas分析 - 详细Gas使用分析' })
  async getGasAnalysis(
    @Query('address') address: string,
    @Query('chainId') chainId: number = 1,
    @Query('days') days: number = 30,
  ) {
    const chain = this.getChainConfig(chainId);
    const transactions = await this.getTransactions(address, chain, days);
    
    const gasAnalysis = this.analyzeGasUsage(transactions);
    
    return {
      address,
      chainId,
      period: days,
      totalGas: gasAnalysis.totalGas,
      avgGasPrice: gasAnalysis.avgGasPrice,
      avgGasUsed: gasAnalysis.avgGasUsed,
      gasByDay: gasAnalysis.gasByDay,
      gasByHour: gasAnalysis.gasByHour,
      gasSavingTips: gasAnalysis.tips,
      costAnalysis: gasAnalysis.costAnalysis,
    };
  }

  @Get('activity-pattern')
  @ApiOperation({ summary: '活动模式分析 - 识别交易习惯' })
  async getActivityPattern(
    @Query('address') address: string,
    @Query('chainId') chainId: number = 1,
    @Query('days') days: number = 90,
  ) {
    const chain = this.getChainConfig(chainId);
    const transactions = await this.getTransactions(address, chain, days);
    
    const pattern = this.analyzeActivityPattern(transactions);
    
    return {
      address,
      chainId,
      period: days,
      profile: pattern.profile,
      habits: pattern.habits,
      insights: pattern.insights,
      recommendations: pattern.recommendations,
    };
  }

  private getChainConfig(chainId: number) {
    const chains: Record<number, { name: string; apiUrl: string; explorer: string }> = {
      1: { name: 'Ethereum', apiUrl: 'https://api.etherscan.io/api', explorer: 'https://etherscan.io' },
      56: { name: 'BSC', apiUrl: 'https://api.bscscan.com/api', explorer: 'https://bscscan.com' },
      137: { name: 'Polygon', apiUrl: 'https://api.polygonscan.com/api', explorer: 'https://polygonscan.com' },
      42161: { name: 'Arbitrum', apiUrl: 'https://api.arbiscan.io/api', explorer: 'https://arbiscan.io' },
      10: { name: 'Optimism', apiUrl: 'https://api-optimistic.etherscan.io/api', explorer: 'https://optimistic.etherscan.io' },
      8453: { name: 'Base', apiUrl: 'https://api.basescan.org/api', explorer: 'https://basescan.org' },
      43114: { name: 'Avalanche', apiUrl: 'https://api.snowtrace.io/api', explorer: 'https://snowtrace.io' },
    };
    return chains[chainId] || chains[1];
  }

  private async getTransactions(address: string, chain: any, days: number) {
    const apiKey = process.env.ETHERSCAN_API_KEY || '';
    const now = Math.floor(Date.now() / 1000);
    const startBlock = now - days * 24 * 60 * 60;
    
    try {
      const response = await firstValueFrom(
        this.httpService.get(chain.apiUrl, {
          params: {
            module: 'account',
            action: 'txlist',
            address,
            startblock: 0,
            endblock: 99999999,
            page: 1,
            offset: 1000,
            sort: 'desc',
          },
        }),
      );

      if (response.data.status === '1' && response.data.result) {
        const txs = response.data.result.filter((tx: any) => {
          const txTime = parseInt(tx.timeStamp);
          return txTime >= startBlock;
        });
        return txs;
      }
      return [];
    } catch {
      return [];
    }
  }

  private analyzeTransactions(transactions: any[], days: number) {
    if (!transactions.length) {
      return {
        summary: { total: 0, incoming: 0, outgoing: 0 },
        gasStats: { total: 0, avg: 0 },
        timeDistribution: { byHour: [], byDay: [] },
        transactionTypes: {},
        topContracts: [],
        activityHeatmap: [],
      };
    }

    // 基本统计
    const total = transactions.length;
    let incoming = 0;
    let outgoing = 0;
    let totalGas = 0;
    const byHour = new Array(24).fill(0);
    const byDay = new Array(7).fill(0);
    const byDate: Record<string, number> = {};
    const contractCalls: Record<string, { count: number; totalGas: number }> = {};

    transactions.forEach((tx: any) => {
      const value = parseFloat(tx.value);
      const gasUsed = parseInt(tx.gasUsed);
      const gasPrice = parseFloat(tx.gasPrice);
      const timestamp = parseInt(tx.timeStamp);
      const date = new Date(timestamp * 1000);
      
      if (value > 0) {
        if (tx.from?.toLowerCase() === tx.to?.toLowerCase()) {
          // self
        } else if (tx.from?.toLowerCase() === (tx.from || '').toLowerCase()) {
          outgoing++;
        } else {
          incoming++;
        }
      } else {
        outgoing++;
      }

      totalGas += gasUsed * gasPrice;
      byHour[date.getHours()]++;
      byDay[date.getDay()]++;
      
      const dateKey = date.toISOString().split('T')[0];
      byDate[dateKey] = (byDate[dateKey] || 0) + 1;

      // 追踪合约调用
      if (tx.to && tx.input && tx.input !== '0x') {
        const toAddr = tx.to.toLowerCase();
        if (!contractCalls[toAddr]) {
          contractCalls[toAddr] = { count: 0, totalGas: 0 };
        }
        contractCalls[toAddr].count++;
        contractCalls[toAddr].totalGas += gasUsed * gasPrice;
      }
    });

    // 时间分布
    const timeDistribution = {
      byHour: byHour.map((count, hour) => ({ hour, count })),
      byDay: byDay.map((count, day) => ({ 
        day: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day], 
        count 
      })),
    };

    // 交易类型分类
    const transactionTypes = this.classifyTransactions(transactions);

    // Top合约
    const topContracts = Object.entries(contractCalls)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10)
      .map(([address, data]) => ({
        address,
        interactions: data.count,
        totalGas: data.totalGas,
      }));

    // 活动热力图数据
    const activityHeatmap = Object.entries(byDate)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      summary: { total, incoming, outgoing },
      gasStats: { total: totalGas / 1e18, avg: totalGas / total / 1e18 },
      timeDistribution,
      transactionTypes,
      topContracts,
      activityHeatmap,
    };
  }

  private classifyTransactions(transactions: any[]) {
    const types: Record<string, number> = {
      'ETH Transfer': 0,
      'Token Transfer': 0,
      'Swap': 0,
      'NFT Transfer': 0,
      'Contract Call': 0,
      'Other': 0,
    };

    transactions.forEach((tx: any) => {
      const input = tx.input || '';
      const to = tx.to || '';
      
      if (input === '0x' || input === '0x00') {
        if (parseFloat(tx.value) > 0) {
          types['ETH Transfer']++;
        } else {
          types['Other']++;
        }
      } else if (input.startsWith('0xa9059cbb')) {
        types['Token Transfer']++;
      } else if (input.startsWith('0x23b872dd')) {
        types['NFT Transfer']++;
      } else if (to.toLowerCase() === '0x7a250d5630b4cf539739df2c5dacb4c659f2488d' || // Uniswap
                 to.toLowerCase() === '0xd9e1ce17f2641f24ae83637ab66a2cca9c378b9f' || // SushiSwap
                 to.toLowerCase() === '0xcbcdf9626bc03e24f779434178a73a0b4bad62ed') { // Curve
        types['Swap']++;
      } else if (input.length > 10) {
        types['Contract Call']++;
      } else {
        types['Other']++;
      }
    });

    return types;
  }

  private generateTimeline(transactions: any[], days: number) {
    const now = new Date();
    const timeline: Record<string, { date: string; count: number; gas: number; volume: number }> = {};

    // 初始化每一天
    for (let i = days; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      timeline[dateKey] = { date: dateKey, count: 0, gas: 0, volume: 0 };
    }

    // 填充数据
    transactions.forEach((tx: any) => {
      const date = new Date(parseInt(tx.timeStamp) * 1000);
      const dateKey = date.toISOString().split('T')[0];
      if (timeline[dateKey]) {
        timeline[dateKey].count++;
        timeline[dateKey].gas += parseInt(tx.gasUsed) * parseFloat(tx.gasPrice);
        timeline[dateKey].volume += parseFloat(tx.value);
      }
    });

    return Object.values(timeline);
  }

  private analyzeGasUsage(transactions: any[]) {
    if (!transactions.length) {
      return {
        totalGas: 0,
        avgGasPrice: 0,
        avgGasUsed: 0,
        gasByDay: [],
        gasByHour: [],
        tips: [],
        costAnalysis: {},
      };
    }

    const gasPrices: number[] = [];
    const gasUsed: number[] = [];
    const byDay: Record<string, number> = {};
    const byHour: Record<string, number> = {};

    transactions.forEach((tx: any) => {
      const gp = parseFloat(tx.gasPrice);
      const gu = parseInt(tx.gasUsed);
      const timestamp = parseInt(tx.timeStamp) * 1000;
      const date = new Date(timestamp);
      const dayKey = date.toISOString().split('T')[0];
      const hourKey = `${date.getHours()}:00`;

      gasPrices.push(gp);
      gasUsed.push(gu);
      byDay[dayKey] = (byDay[dayKey] || 0) + gp * gu;
      byHour[hourKey] = (byHour[hourKey] || 0) + gp * gu;
    });

    const avgGasPrice = gasPrices.reduce((a, b) => a + b, 0) / gasPrices.length;
    const avgGasUsed = gasUsed.reduce((a, b) => a + b, 0) / gasUsed.length;
    const totalGas = gasPrices.reduce((acc, gp, i) => acc + gp * gasUsed[i], 0);

    // 成本分析
    const ethPrice = 3000; // 简化
    const totalCostUSD = (totalGas / 1e18) * ethPrice;
    const costAnalysis = {
      totalETH: totalGas / 1e18,
      totalUSD: totalCostUSD,
      avgCostPerTx: totalCostUSD / transactions.length,
    };

    // Gas优化建议
    const tips: { type: string; title: string; description: string }[] = [];
    const avgHourGas = Object.values(byHour).reduce((a, b) => a + b, 0) / 24;
    const cheapestHours = Object.entries(byHour)
      .sort((a, b) => a[1] - b[1])
      .slice(0, 3)
      .map(([hour]) => hour);

    if (cheapestHours.length) {
      tips.push({
        type: 'timing',
        title: '最佳交易时间',
        description: `在 ${cheapestHours.join(', ')} 时段交易可节省 Gas`,
      });
    }

    if (avgGasUsed > 150000) {
      tips.push({
        type: 'optimization',
        title: '降低 Gas 使用',
        description: '您的交易平均使用较高 Gas，考虑使用批处理交易',
      });
    }

    return {
      totalGas: totalGas / 1e18,
      avgGasPrice: avgGasPrice / 1e9, // Gwei
      avgGasUsed,
      gasByDay: Object.entries(byDay).map(([date, gas]) => ({ date, gas: gas / 1e18 })),
      gasByHour: Object.entries(byHour).map(([hour, gas]) => ({ hour, gas: gas / 1e18 })),
      tips,
      costAnalysis,
    };
  }

  private analyzeActivityPattern(transactions: any[]) {
    if (!transactions.length) {
      return {
        profile: 'No activity',
        habits: [],
        insights: [],
        recommendations: [],
      };
    }

    const hours: number[] = [];
    const days: number[] = [];
    
    transactions.forEach((tx: any) => {
      const date = new Date(parseInt(tx.timeStamp) * 1000);
      hours.push(date.getHours());
      days.push(date.getDay());
    });

    // 计算最活跃时间
    const hourCounts = new Array(24).fill(0);
    hours.forEach(h => hourCounts[h]++);
    const peakHour = hourCounts.indexOf(Math.max(...hourCounts));

    const dayCounts = new Array(7).fill(0);
    days.forEach(d => dayCounts[d]++);
    const peakDay = dayCounts.indexOf(Math.max(...dayCounts));

    // 钱包画像
    let profile = 'Occasional Trader';
    const total = transactions.length;
    const daysActive = new Set(transactions.map((tx: any) => 
      new Date(parseInt(tx.timeStamp) * 1000).toISOString().split('T')[0]
    )).size;

    if (total > 500) profile = 'Active Trader';
    else if (total > 100) profile = 'Regular Trader';
    else if (total > 20) profile = 'Casual Trader';

    const dayFreq = total / daysActive;
    if (dayFreq > 5) profile = 'Day Trader';
    if (dayFreq < 0.2) profile = 'HODLer';

    const habits: { type: string; title: string; value: string; description: string }[] = [
      {
        type: 'timing',
        title: '最活跃时段',
        value: `${peakHour}:00 - ${peakHour + 1}:00`,
        description: '您最常在这个时间段进行交易',
      },
      {
        type: 'day',
        title: '最活跃日',
        value: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][peakDay],
        description: '您最常在这个日期进行交易',
      },
      {
        type: 'frequency',
        title: '活跃频率',
        value: `${dayFreq.toFixed(1)} 次/天`,
        description: `在过去${transactions.length}天内，您平均每天进行${dayFreq.toFixed(1)}次交易`,
      },
    ];

    const insights: { type: string; title: string; description: string }[] = [];
    if (peakHour >= 20 || peakHour <= 2) {
      insights.push({
        type: 'night',
        title: '夜间交易者',
        description: '您倾向于在晚上进行交易，可能是为了避开高峰时段',
      });
    }
    if (peakDay === 0 || peakDay === 6) {
      insights.push({
        type: 'weekend',
        title: '周末交易者',
        description: '您更倾向于在周末进行交易',
      });
    }

    const recommendations: { type: string; title: string; description: string }[] = [];
    if (peakHour >= 8 && peakHour <= 18) {
      recommendations.push({
        type: 'timing',
        title: '尝试非高峰时段交易',
        description: '在凌晨或深夜交易可能节省 20-30% 的 Gas 费用',
      });
    }

    return { profile, habits, insights, recommendations };
  }
}
