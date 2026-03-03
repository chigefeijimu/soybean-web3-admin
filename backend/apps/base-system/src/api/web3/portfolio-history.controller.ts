import { Controller, Get, Post, Put, Delete, Body, Param, Query, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@ApiTags('Portfolio History')
@Controller('web3/portfolio-history')
export class PortfolioHistoryController {
  constructor(private readonly httpService: HttpService) {}

  private readonly CHAIN_RPC: Record<string, string> = {
    ethereum: 'https://api.etherscan.io/api',
    arbitrum: 'https://api.arbiscan.io/api',
    optimism: 'https://api-optimistic.etherscan.io/api',
    polygon: 'https://api.polygonscan.com/api',
    bsc: 'https://api.bscscan.com/api',
    base: 'https://api.basescan.org/api',
    avalanche: 'https://api.snowtrace.io/api',
  };

  private readonly CHAIN_IDS: Record<string, number> = {
    ethereum: 1,
    arbitrum: 42161,
    optimism: 10,
    polygon: 137,
    bsc: 56,
    base: 8453,
    avalanche: 43114,
  };

  private async getApiKey(chain: string): Promise<string> {
    return process.env[`${chain.toUpperCase()}_SCAN_API_KEY`] || '';
  }

  @Get(':address')
  @ApiOperation({ summary: 'Get portfolio history for a wallet address' })
  @ApiQuery({ name: 'chain', required: false, enum: ['ethereum', 'arbitrum', 'optimism', 'polygon', 'bsc', 'base', 'avalanche'] })
  @ApiQuery({ name: 'timeRange', required: false, enum: ['7d', '30d', '90d', '1y'] })
  async getPortfolioHistory(
    @Param('address') address: string,
    @Query('chain') chain: string = 'ethereum',
    @Query('timeRange') timeRange: string = '30d',
  ) {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
    
    // Get current portfolio snapshot
    const currentSnapshot = await this.getCurrentSnapshot(address, chain);
    
    // Generate historical data (simulated for demo - in production would use actual stored snapshots)
    const historicalData = await this.generateHistoricalData(address, chain, days);
    
    // Calculate performance metrics
    const performance = this.calculatePerformance(historicalData);
    
    // Get transactions for analysis
    const transactions = await this.getTransactionHistory(address, chain, days);
    
    // Analyze holdings changes
    const holdingsChanges = this.analyzeHoldingsChanges(transactions, currentSnapshot.holdings);

    return {
      address: address.toLowerCase(),
      chain,
      timeRange,
      currentSnapshot,
      historicalData,
      performance,
      holdingsChanges,
      summary: {
        totalValue: currentSnapshot.totalValue,
        change24h: this.calculate24hChange(historicalData),
        changePeriod: performance.totalChange,
        changePercent: performance.changePercent,
        bestPerformer: performance.bestPerformer,
        worstPerformer: performance.worstPerformer,
      },
    };
  }

  @Get(':address/snapshots')
  @ApiOperation({ summary: 'Get historical snapshots' })
  @ApiQuery({ name: 'chain', required: false })
  @ApiQuery({ name: 'days', required: false })
  async getSnapshots(
    @Param('address') address: string,
    @Query('chain') chain: string = 'ethereum',
    @Query('days') days: string = '30',
  ) {
    const numDays = parseInt(days) || 30;
    const snapshots = await this.generateHistoricalData(address, chain, numDays);
    
    return {
      address: address.toLowerCase(),
      chain,
      snapshots,
    };
  }

  @Get(':address/performance')
  @ApiOperation({ summary: 'Get portfolio performance metrics' })
  @ApiQuery({ name: 'chain', required: false })
  @ApiQuery({ name: 'timeRange', required: false })
  async getPerformance(
    @Param('address') address: string,
    @Query('chain') chain: string = 'ethereum',
    @Query('timeRange') timeRange: string = '30d',
  ) {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
    const historicalData = await this.generateHistoricalData(address, chain, days);
    
    return {
      address: address.toLowerCase(),
      chain,
      timeRange,
      ...this.calculatePerformance(historicalData),
    };
  }

  @Post(':address/snapshot')
  @ApiOperation({ summary: 'Create a new portfolio snapshot' })
  async createSnapshot(
    @Param('address') address: string,
    @Body('chain') chain: string = 'ethereum',
  ) {
    const snapshot = await this.getCurrentSnapshot(address, chain);
    
    return {
      success: true,
      snapshot,
      message: 'Snapshot created successfully',
    };
  }

  @Get(':address/compare')
  @ApiOperation({ summary: 'Compare portfolio at different time points' })
  @ApiQuery({ name: 'chain', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  async comparePeriods(
    @Param('address') address: string,
    @Query('chain') chain: string = 'ethereum',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const days = 30; // Default comparison period
    const historicalData = await this.generateHistoricalData(address, chain, days);
    
    const startValue = historicalData[0]?.totalValue || 0;
    const endValue = historicalData[historicalData.length - 1]?.totalValue || 0;
    const change = endValue - startValue;
    const changePercent = startValue > 0 ? (change / startValue) * 100 : 0;

    return {
      address: address.toLowerCase(),
      chain,
      startDate: startDate || historicalData[0]?.date,
      endDate: endDate || historicalData[historicalData.length - 1]?.date,
      startValue,
      endValue,
      change,
      changePercent: changePercent.toFixed(2),
      dailyAverage: change / days,
      bestDay: this.findBestDay(historicalData),
      worstDay: this.findWorstDay(historicalData),
    };
  }

  private async getCurrentSnapshot(address: string, chain: string) {
    const holdings = await this.getHoldings(address, chain);
    const totalValue = holdings.reduce((sum: number, h: any) => sum + (h.value || 0), 0);
    
    return {
      timestamp: Date.now(),
      date: new Date().toISOString().split('T')[0],
      totalValue,
      holdings: holdings.slice(0, 10),
      tokenCount: holdings.length,
    };
  }

  private async getHoldings(address: string, chain: string): Promise<Array<{symbol: string; name: string; balance: number; value: number}>> {
    // Mock data for demonstration - in production would query actual chain
    const mockTokens = [
      { symbol: 'ETH', name: 'Ethereum', balance: 2.5, value: 4875 },
      { symbol: 'USDC', name: 'USD Coin', balance: 5000, value: 5000 },
      { symbol: 'USDT', name: 'Tether', balance: 2000, value: 2000 },
      { symbol: 'WBTC', name: 'Wrapped Bitcoin', balance: 0.1, value: 4500 },
      { symbol: 'UNI', name: 'Uniswap', balance: 100, value: 850 },
      { symbol: 'AAVE', name: 'Aave', balance: 20, value: 1800 },
      { symbol: 'LINK', name: 'Chainlink', balance: 150, value: 1350 },
      { symbol: 'MATIC', name: 'Polygon', balance: 3000, value: 2100 },
    ];

    // Simulate some variation for different chains
    const multiplier = chain === 'ethereum' ? 1 : chain === 'polygon' ? 0.3 : chain === 'bsc' ? 0.8 : 0.5;
    
    return mockTokens.map(t => ({
      ...t,
      balance: t.balance * multiplier,
      value: t.value * multiplier,
    }));
  }

  private async generateHistoricalData(address: string, chain: string, days: number): Promise<Array<{date: string; timestamp: number; totalValue: number; change: number; changePercent: number}>> {
    const data: Array<{date: string; timestamp: number; totalValue: number; change: number; changePercent: number}> = [];
    const now = Date.now();
    const baseValue = 18000 + Math.random() * 5000; // Starting value
    
    for (let i = days; i >= 0; i--) {
      const timestamp = now - i * 24 * 60 * 60 * 1000;
      const date = new Date(timestamp).toISOString().split('T')[0];
      
      // Generate realistic-looking price movements
      const trend = 1 + (Math.sin(i / 7) * 0.02); // Weekly trend
      const random = 1 + (Math.random() - 0.5) * 0.05; // Daily variance
      const value = baseValue * trend * random * ((days - i + 7) / (days + 7));
      
      const prevValue = data.length > 0 ? data[data.length - 1].totalValue : 0;
      
      data.push({
        date,
        timestamp,
        totalValue: Math.round(value * 100) / 100,
        change: i === days ? 0 : Math.round((value - prevValue) * 100) / 100,
        changePercent: i === days ? 0 : parseFloat((((value - prevValue) / prevValue) * 100).toFixed(2)),
      });
    }
    
    return data;
  }

  private calculatePerformance(historicalData: Array<{date: string; timestamp: number; totalValue: number; change: number; changePercent: number}>) {
    if (historicalData.length < 2) {
      return {
        totalChange: 0,
        changePercent: 0,
        volatility: 0,
        sharpeRatio: 0,
        maxDrawdown: 0,
        bestPerformer: null,
        worstPerformer: null,
      };
    }

    const startValue = historicalData[0].totalValue;
    const endValue = historicalData[historicalData.length - 1].totalValue;
    const totalChange = endValue - startValue;
    const changePercent = ((totalChange / startValue) * 100);

    // Calculate volatility (standard deviation of daily returns)
    const returns: number[] = [];
    for (let i = 1; i < historicalData.length; i++) {
      returns.push((historicalData[i].totalValue - historicalData[i - 1].totalValue) / historicalData[i - 1].totalValue);
    }
    
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
    const volatility = Math.sqrt(variance) * Math.sqrt(252) * 100; // Annualized

    // Calculate max drawdown
    let maxDrawdown = 0;
    let peak = historicalData[0].totalValue;
    for (const point of historicalData) {
      if (point.totalValue > peak) peak = point.totalValue;
      const drawdown = (peak - point.totalValue) / peak;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    }

    // Sharpe ratio (assuming risk-free rate of 5%)
    const riskFreeRate = 0.05;
    const annualizedReturn = changePercent * (365 / historicalData.length);
    const sharpeRatio = volatility > 0 ? (annualizedReturn - riskFreeRate) / volatility : 0;

    // Mock best/worst performers
    const bestPerformer = { symbol: 'ETH', change: 12.5 };
    const worstPerformer = { symbol: 'MATIC', change: -3.2 };

    return {
      totalChange: Math.round(totalChange * 100) / 100,
      changePercent: parseFloat(changePercent.toFixed(2)),
      volatility: parseFloat(volatility.toFixed(2)),
      sharpeRatio: parseFloat(sharpeRatio.toFixed(2)),
      maxDrawdown: parseFloat((maxDrawdown * 100).toFixed(2)),
      bestPerformer,
      worstPerformer,
      daysAnalyzed: historicalData.length,
    };
  }

  private async getTransactionHistory(address: string, chain: string, days: number): Promise<Array<{hash: string; timestamp: number; type: string; value: number; token: string}>> {
    // Mock transaction history for demonstration
    const transactions: Array<{hash: string; timestamp: number; type: string; value: number; token: string}> = [];
    const now = Date.now();
    
    for (let i = 0; i < Math.min(days * 2, 50); i++) {
      const timestamp = now - Math.random() * days * 24 * 60 * 60 * 1000;
      const types = ['transfer', 'swap', 'stake', 'unstake', 'approve'];
      const type = types[Math.floor(Math.random() * types.length)];
      
      transactions.push({
        hash: `0x${Math.random().toString(16).substr(2, 64)}`,
        timestamp,
        type,
        value: Math.random() * 1000,
        token: type === 'swap' ? ['ETH', 'USDC'][Math.floor(Math.random() * 2)] : 'ETH',
      });
    }
    
    return transactions.sort((a, b) => b.timestamp - a.timestamp);
  }

  private analyzeHoldingsChanges(transactions: any[], currentHoldings: any[]) {
    const changes = currentHoldings.map(h => ({
      symbol: h.symbol,
      change: (Math.random() - 0.5) * 20, // Simulated change
      changePercent: parseFloat(((Math.random() - 0.5) * 20).toFixed(2)),
    }));
    
    return {
      gained: changes.filter(c => c.change > 0).sort((a, b) => b.change - a.change),
      lost: changes.filter(c => c.change < 0).sort((a, b) => a.change - b.change),
    };
  }

  private calculate24hChange(historicalData: any[]) {
    if (historicalData.length < 2) return 0;
    const last = historicalData[historicalData.length - 1];
    const prev = historicalData[historicalData.length - 2];
    return Math.round((last.totalValue - prev.totalValue) * 100) / 100;
  }

  private findBestDay(historicalData: any[]) {
    let best = historicalData[0];
    for (const point of historicalData) {
      if (point.change > best.change) best = point;
    }
    return { date: best.date, change: best.change };
  }

  private findWorstDay(historicalData: any[]) {
    let worst = historicalData[0];
    for (const point of historicalData) {
      if (point.change < worst.change) worst = point;
    }
    return { date: worst.date, change: worst.change };
  }
}
