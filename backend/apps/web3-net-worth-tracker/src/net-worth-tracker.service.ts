import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';

// Chain name mapping
const CHAIN_NAMES: Record<number, string> = {
  1: 'Ethereum',
  137: 'Polygon',
  42161: 'Arbitrum',
  10: 'Optimism',
  56: 'BSC',
  8453: 'Base',
  43114: 'Avalanche',
};

// Popular tokens for price lookup
const POPULAR_TOKENS = [
  'ETH', 'WBTC', 'USDT', 'USDC', 'DAI', 'MATIC', 'ARB', 'OP', 
  'BNB', 'AVAX', 'SOL', 'LINK', 'UNI', 'AAVE', 'MKR', 'CRV',
  'LDO', 'STETH', 'WBETH', 'SUSHI', 'CURVE', 'SNX', 'COMP',
];

interface TokenBalance {
  symbol: string;
  address: string;
  balance: string;
  value: number;
  chainId: number;
  change24h: number;
}

interface NetWorthSnapshot {
  timestamp: number;
  totalValue: number;
  breakdown: {
    chainId: number;
    chainName: string;
    value: number;
    percentage: number;
  }[];
  tokens: TokenBalance[];
}

interface ValueAlert {
  id: string;
  address: string;
  threshold: number;
  direction: 'above' | 'below';
  createdAt: number;
  triggered: boolean;
}

@Injectable()
export class NetWorthTrackerService {
  private snapshots: Map<string, NetWorthSnapshot[]> = new Map();
  private alerts: Map<string, ValueAlert[]> = new Map();
  private mockPrices: Map<string, number> = new Map();

  constructor(private httpService: HttpService) {
    this.initializeMockPrices();
  }

  private initializeMockPrices() {
    // Mock prices for demo purposes
    const prices: Record<string, number> = {
      ETH: 2847.50, WBTC: 67234.20, USDT: 1.00, USDC: 1.00, DAI: 1.00,
      MATIC: 0.89, ARB: 1.12, OP: 1.78, BNB: 612.45, AVAX: 35.67,
      SOL: 142.35, LINK: 14.56, UNI: 7.89, AAVE: 156.78, MKR: 1245.67,
      CRV: 0.52, LDO: 2.34, STETH: 2845.67, WBETH: 2890.12, SUSHI: 6.78,
      CURVE: 0.45, SNX: 3.45, COMP: 52.34, SAND: 0.52, MANA: 0.48,
    };
    Object.entries(prices).forEach(([symbol, price]) => {
      this.mockPrices.set(symbol.toLowerCase(), price);
    });
  }

  /**
   * Get current net worth across multiple chains
   */
  async getCurrentNetWorth(address: string, chainIds: number[]): Promise<{
    address: string;
    totalValue: number;
    currency: string;
    chains: {
      chainId: number;
      chainName: string;
      value: number;
      percentage: number;
      tokenCount: number;
    }[];
    lastUpdated: number;
  }> {
    const chainData = await Promise.all(
      chainIds.map(async (chainId) => {
        const tokens = await this.getMockTokenBalances(address, chainId);
        const value = tokens.reduce((sum, t) => sum + t.value, 0);
        return {
          chainId,
          chainName: CHAIN_NAMES[chainId] || `Chain ${chainId}`,
          value,
          percentage: 0, // Will calculate after total
          tokenCount: tokens.length,
        };
      })
    );

    const totalValue = chainData.reduce((sum, c) => sum + c.value, 0);
    
    // Calculate percentages
    chainData.forEach(c => {
      c.percentage = totalValue > 0 ? (c.value / totalValue) * 100 : 0;
    });

    return {
      address: address.toLowerCase(),
      totalValue,
      currency: 'USD',
      chains: chainData,
      lastUpdated: Date.now(),
    };
  }

  /**
   * Get net worth history over time
   */
  async getNetWorthHistory(
    address: string, 
    chainIds: number[], 
    days: number
  ): Promise<{
    address: string;
    period: string;
    history: {
      timestamp: number;
      date: string;
      value: number;
      change: number;
      changePercent: number;
    }[];
    statistics: {
      startValue: number;
      endValue: number;
      highValue: number;
      lowValue: number;
      averageValue: number;
      volatility: number;
    };
  }> {
    const history = [];
    const now = Date.now();
    const msPerDay = 24 * 60 * 60 * 1000;
    
    // Generate mock historical data
    let previousValue = 0;
    for (let i = days; i >= 0; i--) {
      const timestamp = now - (i * msPerDay);
      // Simulate some variation with a trend
      const baseValue = 50000 + Math.sin(i / 7) * 5000 + Math.random() * 2000;
      const value = baseValue * (1 + (days - i) * 0.002); // Slight upward trend
      const change = previousValue > 0 ? value - previousValue : 0;
      const changePercent = previousValue > 0 ? (change / previousValue) * 100 : 0;
      
      history.push({
        timestamp,
        date: new Date(timestamp).toISOString().split('T')[0],
        value: Math.round(value * 100) / 100,
        change: Math.round(change * 100) / 100,
        changePercent: Math.round(changePercent * 100) / 100,
      });
      
      previousValue = value;
    }

    const values = history.map(h => h.value);
    const statistics = {
      startValue: values[0],
      endValue: values[values.length - 1],
      highValue: Math.max(...values),
      lowValue: Math.min(...values),
      averageValue: values.reduce((a, b) => a + b, 0) / values.length,
      volatility: this.calculateVolatility(values),
    };

    return {
      address: address.toLowerCase(),
      period: `${days}d`,
      history,
      statistics,
    };
  }

  /**
   * Calculate ROI metrics
   */
  async getROIMetrics(
    address: string, 
    chainIds: number[], 
    timeframe: string
  ): Promise<{
    address: string;
    timeframe: string;
    currentValue: number;
    roi: number;
    roiPercent: number;
    absoluteReturn: number;
    annualizedReturn: number;
    bestDay: { date: string; change: number };
    worstDay: { date: string; change: number };
    positiveDays: number;
    totalDays: number;
    winRate: number;
  }> {
    const days = this.parseTimeframe(timeframe);
    const history = await this.getNetWorthHistory(address, chainIds, days);
    
    const changes = history.history.map(h => h.change).filter(c => c !== 0);
    const positiveDays = changes.filter(c => c > 0).length;
    
    const bestDay = changes.reduce((best, c) => c > best.change ? { date: '', change: c } : best, { date: '', change: -Infinity });
    const worstDay = changes.reduce((worst, c) => c < worst.change ? { date: '', change: c } : worst, { date: '', change: Infinity });
    
    // Find actual dates
    const bestDayInfo = history.history.find(h => h.change === bestDay.change) || { date: '' };
    const worstDayInfo = history.history.find(h => h.change === worstDay.change) || { date: '' };

    const startValue = history.statistics.startValue;
    const endValue = history.statistics.endValue;
    const absoluteReturn = endValue - startValue;
    const roiPercent = startValue > 0 ? (absoluteReturn / startValue) * 100 : 0;
    
    // Annualized return
    const years = days / 365;
    const annualizedReturn = years > 0 ? (Math.pow(endValue / startValue, 1 / years) - 1) * 100 : 0;

    return {
      address: address.toLowerCase(),
      timeframe,
      currentValue: endValue,
      roi: Math.round(absoluteReturn * 100) / 100,
      roiPercent: Math.round(roiPercent * 100) / 100,
      absoluteReturn: Math.round(absoluteReturn * 100) / 100,
      annualizedReturn: Math.round(annualizedReturn * 100) / 100,
      bestDay: { date: bestDayInfo.date, change: Math.round(bestDay.change * 100) / 100 },
      worstDay: { date: worstDayInfo.date, change: Math.round(worstDay.change * 100) / 100 },
      positiveDays,
      totalDays: days,
      winRate: changes.length > 0 ? Math.round((positiveDays / changes.length) * 10000) / 100 : 0,
    };
  }

  /**
   * Get detailed value breakdown
   */
  async getValueBreakdown(
    address: string, 
    chainIds: number[]
  ): Promise<{
    address: string;
    totalValue: number;
    byCategory: {
      category: string;
      value: number;
      percentage: number;
      count: number;
    };
    byChain: {
      chainId: number;
      chainName: string;
      value: number;
      percentage: number;
    };
    topAssets: {
      symbol: string;
      value: number;
      percentage: number;
      chainId: number;
    }[];
  }> {
    const allTokens: TokenBalance[] = [];
    
    for (const chainId of chainIds) {
      const tokens = await this.getMockTokenBalances(address, chainId);
      allTokens.push(...tokens);
    }

    const totalValue = allTokens.reduce((sum, t) => sum + t.value, 0);

    // Group by category
    const categories: Record<string, { value: number; count: number }> = {
      'Stablecoins': { value: 0, count: 0 },
      'Layer1': { value: 0, count: 0 },
      'DeFi': { value: 0, count: 0 },
      'NFT': { value: 0, count: 0 },
      'Other': { value: 0, count: 0 },
    };

    const stablecoins = ['usdt', 'usdc', 'dai', 'busd', 'frax', 'tusd'];
    const layer1 = ['eth', 'btc', 'bnb', 'sol', 'avax', 'matic', 'arb', 'op'];
    const defi = ['uni', 'aave', 'mkx', 'crv', 'sushi', 'comp', 'snx', 'ldo', 'link'];

    allTokens.forEach(token => {
      const sym = token.symbol.toLowerCase();
      if (stablecoins.includes(sym)) {
        categories['Stablecoins'].value += token.value;
        categories['Stablecoins'].count++;
      } else if (layer1.includes(sym)) {
        categories['Layer1'].value += token.value;
        categories['Layer1'].count++;
      } else if (defi.includes(sym)) {
        categories['DeFi'].value += token.value;
        categories['DeFi'].count++;
      } else {
        categories['Other'].value += token.value;
        categories['Other'].count++;
      }
    });

    // Group by chain
    const chainBreakdown: Record<number, number> = {};
    allTokens.forEach(token => {
      chainBreakdown[token.chainId] = (chainBreakdown[token.chainId] || 0) + token.value;
    });

    // Sort top assets
    const sortedAssets = [...allTokens].sort((a, b) => b.value - a.value).slice(0, 10);

    return {
      address: address.toLowerCase(),
      totalValue,
      byCategory: Object.entries(categories).map(([category, data]) => ({
        category,
        value: Math.round(data.value * 100) / 100,
        percentage: totalValue > 0 ? Math.round((data.value / totalValue) * 10000) / 100 : 0,
        count: data.count,
      })),
      byChain: Object.entries(chainBreakdown).map(([chainId, value]) => ({
        chainId: parseInt(chainId),
        chainName: CHAIN_NAMES[parseInt(chainId)] || `Chain ${chainId}`,
        value: Math.round(value * 100) / 100,
        percentage: totalValue > 0 ? Math.round((value / totalValue) * 10000) / 100 : 0,
      })),
      topAssets: sortedAssets.map(token => ({
        symbol: token.symbol,
        value: Math.round(token.value * 100) / 100,
        percentage: totalValue > 0 ? Math.round((token.value / totalValue) * 10000) / 100 : 0,
        chainId: token.chainId,
      })),
    };
  }

  /**
   * Get value trends and predictions
   */
  async getValueTrends(
    address: string, 
    chainIds: number[]
  ): Promise<{
    address: string;
    trend: 'bullish' | 'bearish' | 'neutral';
    trendStrength: number;
    prediction: {
      next7d: number;
      next30d: number;
      confidence: number;
    };
    momentum: {
      score: number;
      label: 'strong_buy' | 'buy' | 'neutral' | 'sell' | 'strong_sell';
    };
    support: number;
    resistance: number;
  }> {
    const history = await this.getNetWorthHistory(address, chainIds, 30);
    const values = history.history.map(h => h.value);
    
    // Calculate trend
    const recentAvg = values.slice(-7).reduce((a, b) => a + b, 0) / 7;
    const olderAvg = values.slice(0, 7).reduce((a, b) => a + b, 0) / 7;
    const trendStrength = Math.abs((recentAvg - olderAvg) / olderAvg) * 100;
    
    let trend: 'bullish' | 'bearish' | 'neutral' = 'neutral';
    if (recentAvg > olderAvg * 1.02) trend = 'bullish';
    else if (recentAvg < olderAvg * 0.98) trend = 'bearish';

    // Simple prediction (mock)
    const lastValue = values[values.length - 1];
    const prediction = {
      next7d: lastValue * (1 + (Math.random() - 0.5) * 0.1),
      next30d: lastValue * (1 + (Math.random() - 0.5) * 0.2),
      confidence: 65 + Math.random() * 20,
    };

    // Momentum calculation
    const changes = values.slice(-7).map((v, i) => i > 0 ? v - values[i-1] : 0).filter(c => c !== 0);
    const avgChange = changes.reduce((a, b) => a + b, 0) / changes.length;
    const momentumScore = 50 + (avgChange / lastValue) * 1000;
    
    let momentumLabel: 'strong_buy' | 'buy' | 'neutral' | 'sell' | 'strong_sell' = 'neutral';
    if (momentumScore > 60) momentumLabel = 'strong_buy';
    else if (momentumScore > 55) momentumLabel = 'buy';
    else if (momentumScore < 40) momentumLabel = 'strong_sell';
    else if (momentumScore < 45) momentumLabel = 'sell';

    // Support and resistance
    const sorted = [...values].sort((a, b) => a - b);
    const support = sorted[Math.floor(sorted.length * 0.2)];
    const resistance = sorted[Math.floor(sorted.length * 0.8)];

    return {
      address: address.toLowerCase(),
      trend,
      trendStrength: Math.round(trendStrength * 100) / 100,
      prediction: {
        next7d: Math.round(prediction.next7d * 100) / 100,
        next30d: Math.round(prediction.next30d * 100) / 100,
        confidence: Math.round(prediction.confidence * 10) / 10,
      },
      momentum: {
        score: Math.round(momentumScore * 10) / 10,
        label: momentumLabel,
      },
      support: Math.round(support * 100) / 100,
      resistance: Math.round(resistance * 100) / 100,
    };
  }

  /**
   * Get top performing assets
   */
  async getTopPerformers(
    address: string, 
    chainIds: number[],
    limit: number
  ): Promise<{
    address: string;
    topPerformers: {
      symbol: string;
      chainId: number;
      currentValue: number;
      change24h: number;
      changePercent24h: number;
    }[];
  }> {
    const allTokens: TokenBalance[] = [];
    
    for (const chainId of chainIds) {
      const tokens = await this.getMockTokenBalances(address, chainId);
      allTokens.push(...tokens);
    }

    const sorted = [...allTokens].sort((a, b) => b.change24h - a.change24h);

    return {
      address: address.toLowerCase(),
      topPerformers: sorted.slice(0, limit).map(token => ({
        symbol: token.symbol,
        chainId: token.chainId,
        currentValue: Math.round(token.value * 100) / 100,
        change24h: Math.round(token.change24h * 100) / 100,
        changePercent24h: Math.round(token.change24h * 100) / 100,
      })),
    };
  }

  /**
   * Create a net worth snapshot
   */
  async createSnapshot(
    address: string, 
    chainIds: number[]
  ): Promise<{
    success: boolean;
    snapshot: NetWorthSnapshot;
  }> {
    const netWorth = await this.getCurrentNetWorth(address, chainIds);
    
    const snapshot: NetWorthSnapshot = {
      timestamp: Date.now(),
      totalValue: netWorth.totalValue,
      breakdown: netWorth.chains.map(c => ({
        chainId: c.chainId,
        chainName: c.chainName,
        value: c.value,
        percentage: c.percentage,
      })),
      tokens: [],
    };

    // Store snapshot
    const key = address.toLowerCase();
    if (!this.snapshots.has(key)) {
      this.snapshots.set(key, []);
    }
    this.snapshots.get(key)!.push(snapshot);

    return { success: true, snapshot };
  }

  /**
   * Get benchmark comparison
   */
  async getBenchmarkComparison(
    address: string,
    benchmark: string,
    timeframe: string
  ): Promise<{
    address: string;
    benchmark: string;
    timeframe: string;
    portfolioROI: number;
    benchmarkROI: number;
    difference: number;
    winner: 'portfolio' | 'benchmark';
  }> {
    const days = this.parseTimeframe(timeframe);
    const history = await this.getNetWorthHistory(address, [1], days);
    
    // Mock benchmark data
    const benchmarkReturns: Record<string, number> = {
      btc: 2.5 + Math.random() * 10,
      eth: 1.8 + Math.random() * 8,
      sp500: 0.5 + Math.random() * 3,
      defi: -2 + Math.random() * 15,
    };

    const portfolioROI = ((history.statistics.endValue - history.statistics.startValue) / history.statistics.startValue) * 100;
    const benchmarkROI = benchmarkReturns[benchmark.toLowerCase()] || 5;
    const difference = portfolioROI - benchmarkROI;

    return {
      address: address.toLowerCase(),
      benchmark: benchmark.toUpperCase(),
      timeframe,
      portfolioROI: Math.round(portfolioROI * 100) / 100,
      benchmarkROI: Math.round(benchmarkROI * 100) / 100,
      difference: Math.round(difference * 100) / 100,
      winner: difference > 0 ? 'portfolio' : 'benchmark',
    };
  }

  /**
   * Get value alerts for an address
   */
  async getValueAlerts(address: string): Promise<{
    address: string;
    alerts: ValueAlert[];
  }> {
    const key = address.toLowerCase();
    return {
      address: key,
      alerts: this.alerts.get(key) || [],
    };
  }

  /**
   * Set a value alert
   */
  async setValueAlert(
    address: string, 
    threshold: number, 
    direction: 'above' | 'below'
  ): Promise<{
    success: boolean;
    alert: ValueAlert;
  }> {
    const key = address.toLowerCase();
    if (!this.alerts.has(key)) {
      this.alerts.set(key, []);
    }

    const alert: ValueAlert = {
      id: `alert_${Date.now()}`,
      address: key,
      threshold,
      direction,
      createdAt: Date.now(),
      triggered: false,
    };

    this.alerts.get(key)!.push(alert);

    return { success: true, alert };
  }

  /**
   * Get diversification score
   */
  async getDiversificationScore(
    address: string, 
    chainIds: number[]
  ): Promise<{
    address: string;
    score: number;
    grade: string;
    analysis: {
      chainDiversification: number;
      categoryDiversification: number;
      tokenDiversification: number;
    };
    recommendations: string[];
  }> {
    const breakdown = await this.getValueBreakdown(address, chainIds);
    
    // Calculate diversification scores
    const chainConcentration = breakdown.byChain.reduce((max, c) => 
      c.percentage > max ? c.percentage : max, 0);
    const chainDiversification = Math.max(0, 100 - chainConcentration * 1.5);

    const categoryValues = breakdown.byCategory.map(c => c.percentage);
    const categoryConcentration = Math.max(...categoryValues);
    const categoryDiversification = Math.max(0, 100 - categoryConcentration * 1.5);

    const topAssetConcentration = breakdown.topAssets[0]?.percentage || 100;
    const tokenDiversification = Math.max(0, 100 - topAssetConcentration * 2);

    const overallScore = (chainDiversification + categoryDiversification + tokenDiversification) / 3;

    let grade: string;
    if (overallScore >= 80) grade = 'A';
    else if (overallScore >= 60) grade = 'B';
    else if (overallScore >= 40) grade = 'C';
    else if (overallScore >= 20) grade = 'D';
    else grade = 'F';

    const recommendations: string[] = [];
    if (chainDiversification < 50) {
      recommendations.push('Consider diversifying across more chains');
    }
    if (categoryDiversification < 50) {
      recommendations.push('Add more diverse asset categories');
    }
    if (tokenDiversification < 50) {
      recommendations.push('Reduce concentration in top assets');
    }

    return {
      address: address.toLowerCase(),
      score: Math.round(overallScore * 10) / 10,
      grade,
      analysis: {
        chainDiversification: Math.round(chainDiversification * 10) / 10,
        categoryDiversification: Math.round(categoryDiversification * 10) / 10,
        tokenDiversification: Math.round(tokenDiversification * 10) / 10,
      },
      recommendations,
    };
  }

  /**
   * Get multi-wallet net worth summary
   */
  async getMultiWalletNetWorth(
    addresses: string[], 
    chainIds: number[]
  ): Promise<{
    wallets: {
      address: string;
      totalValue: number;
      rank: number;
    }[];
    totalValue: number;
    averageValue: number;
    medianValue: number;
  }> {
    const results = await Promise.all(
      addresses.map(async addr => {
        const netWorth = await this.getCurrentNetWorth(addr, chainIds);
        return {
          address: addr.toLowerCase(),
          totalValue: netWorth.totalValue,
        };
      })
    );

    // Sort by value and add rank
    results.sort((a, b) => b.totalValue - a.totalValue);
    results.forEach((r, i) => r.rank = i + 1);

    const values = results.map(r => r.totalValue);
    const totalValue = values.reduce((a, b) => a + b, 0);
    const averageValue = totalValue / values.length;
    const sortedValues = [...values].sort((a, b) => a - b);
    const medianValue = sortedValues[Math.floor(sortedValues.length / 2)];

    return {
      wallets: results.map(r => ({
        ...r,
        totalValue: Math.round(r.totalValue * 100) / 100,
      })),
      totalValue: Math.round(totalValue * 100) / 100,
      averageValue: Math.round(averageValue * 100) / 100,
      medianValue: Math.round(medianValue * 100) / 100,
    };
  }

  /**
   * Compare different time periods
   */
  async comparePeriods(
    address: string, 
    chainIds: number[],
    period1: string,
    period2: string
  ): Promise<{
    address: string;
    period1: { period: string; value: number; change: number };
    period2: { period: string; value: number; change: number };
    comparison: {
      valueDifference: number;
      percentDifference: number;
      better: 'period1' | 'period2';
    };
  }> {
    const days1 = this.parseTimeframe(period1);
    const days2 = this.parseTimeframe(period2);

    const history1 = await this.getNetWorthHistory(address, chainIds, days1);
    const history2 = await this.getNetWorthHistory(address, chainIds, days2);

    const value1 = history1.statistics.endValue;
    const value2 = history2.statistics.endValue;
    const change1 = history1.statistics.endValue - history1.statistics.startValue;
    const change2 = history2.statistics.endValue - history2.statistics.startValue;

    const valueDifference = value2 - value1;
    const percentDifference = value1 > 0 ? (valueDifference / value1) * 100 : 0;

    return {
      address: address.toLowerCase(),
      period1: {
        period: period1,
        value: Math.round(value1 * 100) / 100,
        change: Math.round(change1 * 100) / 100,
      },
      period2: {
        period: period2,
        value: Math.round(value2 * 100) / 100,
        change: Math.round(change2 * 100) / 100,
      },
      comparison: {
        valueDifference: Math.round(valueDifference * 100) / 100,
        percentDifference: Math.round(percentDifference * 100) / 100,
        better: value2 > value1 ? 'period2' : 'period1',
      },
    };
  }

  /**
   * Get net worth ranking
   */
  async getNetWorthRanking(
    address: string, 
    timeframe: string
  ): Promise<{
    address: string;
    rank: number;
    percentile: number;
    category: 'whale' | 'large' | 'medium' | 'small' | 'nano';
    totalTracked: number;
  }> {
    // Mock ranking data
    const mockRank = Math.floor(Math.random() * 10000) + 1;
    const percentile = 100 - (mockRank / 100);
    
    let category: 'whale' | 'large' | 'medium' | 'small' | 'nano';
    if (mockRank <= 100) category = 'whale';
    else if (mockRank <= 1000) category = 'large';
    else if (mockRank <= 5000) category = 'medium';
    else if (mockRank <= 10000) category = 'small';
    else category = 'nano';

    return {
      address: address.toLowerCase(),
      rank: mockRank,
      percentile: Math.round(percentile * 10) / 10,
      category,
      totalTracked: 15000,
    };
  }

  /**
   * Export net worth data
   */
  async exportNetWorthData(
    address: string, 
    format: string,
    days: number
  ): Promise<{
    format: string;
    data: string | object;
    filename: string;
  }> {
    const history = await this.getNetWorthHistory(address, [1, 137, 42161], days);

    if (format === 'csv') {
      const headers = 'date,value,change,change_percent\n';
      const rows = history.history.map(h => 
        `${h.date},${h.value},${h.change},${h.changePercent}`
      ).join('\n');
      
      return {
        format: 'csv',
        data: headers + rows,
        filename: `networth_${address.toLowerCase()}_${days}d.csv`,
      };
    }

    return {
      format: 'json',
      data: history,
      filename: `networth_${address.toLowerCase()}_${days}d.json`,
    };
  }

  // Helper methods
  private async getMockTokenBalances(address: string, chainId: number): Promise<TokenBalance[]> {
    // Generate mock token balances based on address
    const seed = address.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const random = (i: number) => ((seed * (i + 1) * 9301 + 49297) % 233280) / 233280;

    const tokens: TokenBalance[] = [];
    const tokenConfigs = [
      { symbol: 'ETH', decimals: 18 },
      { symbol: 'USDC', decimals: 6 },
      { symbol: 'USDT', decimals: 6 },
      { symbol: 'DAI', decimals: 18 },
      { symbol: 'UNI', decimals: 18 },
      { symbol: 'LINK', decimals: 18 },
      { symbol: 'AAVE', decimals: 18 },
    ];

    tokenConfigs.forEach((token, i) => {
      const hasToken = random(i) > 0.3;
      if (hasToken) {
        const balance = random(i + 10) * 100;
        const price = this.mockPrices.get(token.symbol.toLowerCase()) || 1;
        const value = balance * price;
        
        tokens.push({
          symbol: token.symbol,
          address: `0x${(i + 1).toString().padStart(40, '0')}`,
          balance: balance.toFixed(token.decimals > 6 ? 4 : 2),
          value: Math.round(value * 100) / 100,
          chainId,
          change24h: (random(i + 20) - 0.5) * 10,
        });
      }
    });

    return tokens;
  }

  private parseTimeframe(timeframe: string): number {
    const match = timeframe.match(/^(\d+)([dh])$/);
    if (!match) return 30;
    const value = parseInt(match[1]);
    const unit = match[2];
    return unit === 'h' ? Math.ceil(value / 24) : value;
  }

  private calculateVolatility(values: number[]): number {
    if (values.length < 2) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    return Math.sqrt(variance) / mean * 100;
  }
}
