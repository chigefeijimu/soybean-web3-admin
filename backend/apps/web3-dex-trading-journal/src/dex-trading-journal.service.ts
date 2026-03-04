import { Injectable } from '@nestjs/common';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsArray, IsEnum, Min, Max } from 'class-validator';

// Enums
export enum TradeType {
  SWAP = 'swap',
  ADD_LIQUIDITY = 'add_liquidity',
  REMOVE_LIQUIDITY = 'remove_liquidity',
}

export enum TradeStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  FAILED = 'failed',
}

export enum TimeRange {
  DAY = '24h',
  WEEK = '7d',
  MONTH = '30d',
  THREE_MONTHS = '90d',
  YEAR = '1y',
}

// DTOs
export class DexTradeQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ enum: TimeRange })
  @IsOptional()
  @IsEnum(TimeRange)
  timeRange?: TimeRange;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  page?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  limit?: number;
}

export class DexTradeCreateDto {
  @ApiProperty()
  @IsString()
  txHash: string;

  @ApiProperty()
  @IsString()
  walletAddress: string;

  @ApiProperty({ enum: TradeType })
  @IsEnum(TradeType)
  tradeType: TradeType;

  @ApiProperty()
  @IsString()
  fromToken: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  fromAmount: number;

  @ApiProperty()
  @IsString()
  toToken: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  toAmount: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  gasFee: number;

  @ApiProperty()
  @IsString()
  chain: string;

  @ApiProperty()
  @IsString()
  dex: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  @Max(100)
  slippage: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

// Response DTOs
export class DexTradeDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  txHash: string;

  @ApiProperty()
  walletAddress: string;

  @ApiProperty({ enum: TradeType })
  tradeType: TradeType;

  @ApiProperty()
  fromToken: string;

  @ApiProperty()
  fromAmount: number;

  @ApiProperty()
  toToken: string;

  @ApiProperty()
  toAmount: number;

  @ApiProperty()
  price: number;

  @ApiProperty()
  gasFee: number;

  @ApiProperty()
  totalCost: number;

  @ApiProperty()
  chain: string;

  @ApiProperty()
  dex: string;

  @ApiProperty()
  slippage: number;

  @ApiProperty({ enum: TradeStatus })
  status: TradeStatus;

  @ApiProperty()
  timestamp: string;

  @ApiPropertyOptional()
  notes?: string;
}

export class DexTradingStatsDto {
  @ApiProperty()
  totalTrades: number;

  @ApiProperty()
  confirmedTrades: number;

  @ApiProperty()
  failedTrades: number;

  @ApiProperty()
  totalVolume: number;

  @ApiProperty()
  totalGasFees: number;

  @ApiProperty()
  avgSlippage: number;

  @ApiProperty()
  profitLoss: number;

  @ApiProperty()
  bestTrade: DexTradeDto;

  @ApiProperty()
  worstTrade: DexTradeDto;

  @ApiProperty()
  mostUsedDex: string;

  @ApiProperty()
  mostTradedChain: string;
}

export class DexTradingSummaryDto {
  @ApiProperty()
  period: string;

  @ApiProperty()
  stats: DexTradingStatsDto;

  @ApiProperty()
  volumeByChain: { chain: string; volume: number; trades: number }[];

  @ApiProperty()
  volumeByDex: { dex: string; volume: number; trades: number }[];

  @ApiProperty()
  topTokens: { token: string; volume: number; trades: number }[];

  @ApiProperty()
  dailyVolume: { date: string; volume: number; trades: number }[];
}

export class DexTradeAnalysisDto {
  @ApiProperty()
  tradeFrequency: number;

  @ApiProperty()
  avgTradeSize: number;

  @ApiProperty()
  preferredDex: string;

  @ApiProperty()
  preferredChain: string;

  @ApiProperty()
  tradingStyle: string;

  @ApiProperty()
  riskScore: number;

  @ApiProperty()
  gasEfficiency: number;

  @ApiProperty()
  slippagePerformance: string;

  @ApiProperty()
  recommendations: string[];
}

// Mock data generator
const MOCK_CHAINS = ['Ethereum', 'Polygon', 'Arbitrum', 'Optimism', 'BSC', 'Base', 'Avalanche'];
const MOCK_DEXES = ['Uniswap V3', 'Uniswap V2', 'SushiSwap', 'Curve', 'Balancer', 'PancakeSwap', 'QuickSwap', 'Aerodrome'];
const MOCK_TOKENS = ['ETH', 'USDC', 'USDT', 'WBTC', 'DAI', 'LINK', 'UNI', 'AAVE', 'MKR', 'CRV', 'LDO', 'ARB', 'OP', 'SOL'];

function generateMockTrades(count: number, address: string): DexTradeDto[] {
  const trades: DexTradeDto[] = [];
  const now = Date.now();
  
  for (let i = 0; i < count; i++) {
    const daysAgo = Math.floor(Math.random() * 90);
    const timestamp = now - daysAgo * 24 * 60 * 60 * 1000;
    const fromToken = MOCK_TOKENS[Math.floor(Math.random() * MOCK_TOKENS.length)];
    let toToken = MOCK_TOKENS[Math.floor(Math.random() * MOCK_TOKENS.length)];
    while (toToken === fromToken) {
      toToken = MOCK_TOKENS[Math.floor(Math.random() * MOCK_TOKENS.length)];
    }
    
    const fromAmount = Math.random() * 10 + 0.1;
    const price = Math.random() * 1000 + 10;
    const toAmount = fromAmount * price * (1 + (Math.random() - 0.5) * 0.1);
    const gasFee = Math.random() * 50 + 1;
    const slippage = Math.random() * 5;
    
    trades.push({
      id: `trade_${i}_${timestamp}`,
      txHash: `0x${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}`,
      walletAddress: address,
      tradeType: TradeType.SWAP,
      fromToken,
      fromAmount: parseFloat(fromAmount.toFixed(4)),
      toToken,
      toAmount: parseFloat(toAmount.toFixed(4)),
      price,
      gasFee: parseFloat(gasFee.toFixed(2)),
      totalCost: parseFloat((fromAmount * price + gasFee).toFixed(2)),
      chain: MOCK_CHAINS[Math.floor(Math.random() * MOCK_CHAINS.length)],
      dex: MOCK_DEXES[Math.floor(Math.random() * MOCK_DEXES.length)],
      slippage: parseFloat(slippage.toFixed(2)),
      status: Math.random() > 0.1 ? TradeStatus.CONFIRMED : TradeStatus.FAILED,
      timestamp: new Date(timestamp).toISOString(),
      notes: Math.random() > 0.7 ? 'Manual trade entry' : undefined,
    });
  }
  
  return trades.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

@Injectable()
export class DexTradingJournalService {
  private mockTrades: Map<string, DexTradeDto[]> = new Map();

  constructor() {
    // Initialize with mock data for common addresses
    const testAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f1234';
    this.mockTrades.set(testAddress, generateMockTrades(150, testAddress));
  }

  getTrades(query: DexTradeQueryDto) {
    const { address, timeRange, page = 1, limit = 20 } = query;
    
    if (!address) {
      return {
        trades: [],
        total: 0,
        page,
        limit,
        totalPages: 0,
      };
    }

    let trades = this.mockTrades.get(address) || generateMockTrades(50, address);
    this.mockTrades.set(address, trades);

    // Filter by time range
    if (timeRange) {
      const now = Date.now();
      let cutoffTime = now;
      switch (timeRange) {
        case TimeRange.DAY:
          cutoffTime = now - 24 * 60 * 60 * 1000;
          break;
        case TimeRange.WEEK:
          cutoffTime = now - 7 * 24 * 60 * 60 * 1000;
          break;
        case TimeRange.MONTH:
          cutoffTime = now - 30 * 24 * 60 * 60 * 1000;
          break;
        case TimeRange.THREE_MONTHS:
          cutoffTime = now - 90 * 24 * 60 * 60 * 1000;
          break;
        case TimeRange.YEAR:
          cutoffTime = now - 365 * 24 * 60 * 60 * 1000;
          break;
      }
      trades = trades.filter(t => new Date(t.timestamp).getTime() >= cutoffTime);
    }

    const total = trades.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const paginatedTrades = trades.slice(startIndex, startIndex + limit);

    return {
      trades: paginatedTrades,
      total,
      page,
      limit,
      totalPages,
    };
  }

  getTradeById(id: string): DexTradeDto | null {
    for (const trades of this.mockTrades.values()) {
      const trade = trades.find(t => t.id === id);
      if (trade) return trade;
    }
    return null;
  }

  createTrade(dto: DexTradeCreateDto): DexTradeDto {
    const newTrade: DexTradeDto = {
      id: `trade_${Date.now()}`,
      txHash: dto.txHash,
      walletAddress: dto.walletAddress,
      tradeType: dto.tradeType,
      fromToken: dto.fromToken,
      fromAmount: dto.fromAmount,
      toToken: dto.toToken,
      toAmount: dto.toAmount,
      price: dto.toAmount / dto.fromAmount,
      gasFee: dto.gasFee,
      totalCost: dto.fromAmount * (dto.toAmount / dto.fromAmount) + dto.gasFee,
      chain: dto.chain,
      dex: dto.dex,
      slippage: dto.slippage,
      status: TradeStatus.CONFIRMED,
      timestamp: new Date().toISOString(),
      notes: dto.notes,
    };

    const existingTrades = this.mockTrades.get(dto.walletAddress) || [];
    existingTrades.unshift(newTrade);
    this.mockTrades.set(dto.walletAddress, existingTrades);

    return newTrade;
  }

  getTradingSummary(address: string, timeRange?: TimeRange): DexTradingSummaryDto {
    let trades = this.mockTrades.get(address) || generateMockTrades(50, address);
    this.mockTrades.set(address, trades);

    // Filter by time range
    if (timeRange) {
      const now = Date.now();
      let cutoffTime = now;
      switch (timeRange) {
        case TimeRange.DAY:
          cutoffTime = now - 24 * 60 * 60 * 1000;
          break;
        case TimeRange.WEEK:
          cutoffTime = now - 7 * 24 * 60 * 60 * 1000;
          break;
        case TimeRange.MONTH:
          cutoffTime = now - 30 * 24 * 60 * 60 * 1000;
          break;
        case TimeRange.THREE_MONTHS:
          cutoffTime = now - 90 * 24 * 60 * 60 * 1000;
          break;
        case TimeRange.YEAR:
          cutoffTime = now - 365 * 24 * 60 * 60 * 1000;
          break;
      }
      trades = trades.filter(t => new Date(t.timestamp).getTime() >= cutoffTime);
    }

    const stats = this.calculateStats(trades);
    const volumeByChain = this.aggregateByChain(trades);
    const volumeByDex = this.aggregateByDex(trades);
    const topTokens = this.getTopTokens(trades);
    const dailyVolume = this.getDailyVolume(trades);

    return {
      period: timeRange || TimeRange.MONTH,
      stats,
      volumeByChain,
      volumeByDex,
      topTokens,
      dailyVolume,
    };
  }

  getTradingAnalysis(address: string): DexTradeAnalysisDto {
    const trades = this.mockTrades.get(address) || generateMockTrades(50, address);
    
    const confirmedTrades = trades.filter(t => t.status === TradeStatus.CONFIRMED);
    const totalVolume = confirmedTrades.reduce((sum, t) => sum + t.totalCost, 0);
    const avgTradeSize = totalVolume / confirmedTrades.length;
    
    // Calculate most used DEX and chain
    const dexCounts = new Map<string, number>();
    const chainCounts = new Map<string, number>();
    
    confirmedTrades.forEach(t => {
      dexCounts.set(t.dex, (dexCounts.get(t.dex) || 0) + 1);
      chainCounts.set(t.chain, (chainCounts.get(t.chain) || 0) + 1);
    });

    let preferredDex = '';
    let maxDexCount = 0;
    dexCounts.forEach((count, dex) => {
      if (count > maxDexCount) {
        maxDexCount = count;
        preferredDex = dex;
      }
    });

    let preferredChain = '';
    let maxChainCount = 0;
    chainCounts.forEach((count, chain) => {
      if (count > maxChainCount) {
        maxChainCount = count;
        preferredChain = chain;
      }
    });

    // Determine trading style based on frequency and size
    let tradingStyle = 'Casual Trader';
    if (confirmedTrades.length > 100) {
      tradingStyle = 'Active Day Trader';
    } else if (confirmedTrades.length > 50) {
      tradingStyle = 'Regular Trader';
    } else if (avgTradeSize > 5000) {
      tradingStyle = 'Whale Trader';
    }

    // Calculate risk score (0-100)
    const avgSlippage = confirmedTrades.reduce((sum, t) => sum + t.slippage, 0) / confirmedTrades.length;
    const failedRatio = (trades.length - confirmedTrades.length) / trades.length;
    const riskScore = Math.min(100, Math.round(avgSlippage * 10 + failedRatio * 50));

    // Calculate gas efficiency
    const avgGasFee = confirmedTrades.reduce((sum, t) => sum + t.gasFee, 0) / confirmedTrades.length;
    const gasEfficiency = Math.max(0, 100 - (avgGasFee / 100) * 100);

    // Determine slippage performance
    let slippagePerformance = 'Average';
    if (avgSlippage < 0.5) {
      slippagePerformance = 'Excellent';
    } else if (avgSlippage < 1) {
      slippagePerformance = 'Good';
    } else if (avgSlippage > 3) {
      slippagePerformance = 'Needs Improvement';
    }

    // Generate recommendations
    const recommendations: string[] = [];
    if (avgSlippage > 1) {
      recommendations.push('Consider using lower slippage settings or gas priority to reduce slippage');
    }
    if (avgGasFee > 30) {
      recommendations.push('Consider trading during off-peak hours to reduce gas fees');
    }
    if (dexCounts.size < 2) {
      recommendations.push('Try comparing prices across multiple DEXes for better execution');
    }
    if (chainCounts.size < 2) {
      recommendations.push('Explore other chains for potentially better rates');
    }
    if (recommendations.length === 0) {
      recommendations.push('Your trading performance looks great! Keep up the good work.');
    }

    return {
      tradeFrequency: confirmedTrades.length,
      avgTradeSize: parseFloat(avgTradeSize.toFixed(2)),
      preferredDex,
      preferredChain,
      tradingStyle,
      riskScore,
      gasEfficiency: parseFloat(gasEfficiency.toFixed(1)),
      slippagePerformance,
      recommendations,
    };
  }

  getDexRankings(): { dex: string; volume: number; trades: number; avgSlippage: number }[] {
    const allTrades: DexTradeDto[] = [];
    this.mockTrades.forEach(trades => allTrades.push(...trades));

    const dexStats = new Map<string, { volume: number; trades: number; totalSlippage: number }>();
    
    allTrades.forEach(t => {
      const existing = dexStats.get(t.dex) || { volume: 0, trades: 0, totalSlippage: 0 };
      dexStats.set(t.dex, {
        volume: existing.volume + t.totalCost,
        trades: existing.trades + 1,
        totalSlippage: existing.totalSlippage + t.slippage,
      });
    });

    const rankings: { dex: string; volume: number; trades: number; avgSlippage: number }[] = [];
    dexStats.forEach((stats, dex) => {
      rankings.push({
        dex,
        volume: parseFloat(stats.volume.toFixed(2)),
        trades: stats.trades,
        avgSlippage: parseFloat((stats.totalSlippage / stats.trades).toFixed(2)),
      });
    });

    return rankings.sort((a, b) => b.volume - a.volume);
  }

  private calculateStats(trades: DexTradeDto[]): DexTradingStatsDto {
    const confirmedTrades = trades.filter(t => t.status === TradeStatus.CONFIRMED);
    const failedTrades = trades.filter(t => t.status === TradeStatus.FAILED);
    
    const totalVolume = confirmedTrades.reduce((sum, t) => sum + t.totalCost, 0);
    const totalGasFees = confirmedTrades.reduce((sum, t) => sum + t.gasFee, 0);
    const avgSlippage = confirmedTrades.length > 0 
      ? confirmedTrades.reduce((sum, t) => sum + t.slippage, 0) / confirmedTrades.length 
      : 0;

    // Calculate profit/loss (simplified - assumes token appreciation)
    const profitLoss = totalVolume * 0.05; // Mock 5% profit

    let bestTrade = confirmedTrades[0];
    let worstTrade = confirmedTrades[0];
    
    if (confirmedTrades.length > 0) {
      bestTrade = [...confirmedTrades].sort((a, b) => b.totalCost - a.totalCost)[0];
      worstTrade = [...confirmedTrades].sort((a, b) => a.totalCost - b.totalCost)[0];
    }

    // Find most used DEX and chain
    const dexCounts = new Map<string, number>();
    const chainCounts = new Map<string, number>();
    
    confirmedTrades.forEach(t => {
      dexCounts.set(t.dex, (dexCounts.get(t.dex) || 0) + 1);
      chainCounts.set(t.chain, (chainCounts.get(t.chain) || 0) + 1);
    });

    let mostUsedDex = '';
    let maxDexCount = 0;
    dexCounts.forEach((count, dex) => {
      if (count > maxDexCount) {
        maxDexCount = count;
        mostUsedDex = dex;
      }
    });

    let mostTradedChain = '';
    let maxChainCount = 0;
    chainCounts.forEach((count, chain) => {
      if (count > maxChainCount) {
        maxChainCount = count;
        mostTradedChain = chain;
      }
    });

    return {
      totalTrades: trades.length,
      confirmedTrades: confirmedTrades.length,
      failedTrades: failedTrades.length,
      totalVolume: parseFloat(totalVolume.toFixed(2)),
      totalGasFees: parseFloat(totalGasFees.toFixed(2)),
      avgSlippage: parseFloat(avgSlippage.toFixed(2)),
      profitLoss: parseFloat(profitLoss.toFixed(2)),
      bestTrade,
      worstTrade,
      mostUsedDex,
      mostTradedChain,
    };
  }

  private aggregateByChain(trades: DexTradeDto[]): { chain: string; volume: number; trades: number }[] {
    const counts = new Map<string, { volume: number; trades: number }>();
    
    trades.forEach(t => {
      const existing = counts.get(t.chain) || { volume: 0, trades: 0 };
      counts.set(t.chain, {
        volume: existing.volume + t.totalCost,
        trades: existing.trades + 1,
      });
    });

    const result: { chain: string; volume: number; trades: number }[] = [];
    counts.forEach((stats, key) => {
      result.push({
        chain: key,
        volume: parseFloat(stats.volume.toFixed(2)),
        trades: stats.trades,
      });
    });

    return result.sort((a, b) => b.volume - a.volume);
  }

  private aggregateByDex(trades: DexTradeDto[]): { dex: string; volume: number; trades: number }[] {
    const counts = new Map<string, { volume: number; trades: number }>();
    
    trades.forEach(t => {
      const existing = counts.get(t.dex) || { volume: 0, trades: 0 };
      counts.set(t.dex, {
        volume: existing.volume + t.totalCost,
        trades: existing.trades + 1,
      });
    });

    const result: { dex: string; volume: number; trades: number }[] = [];
    counts.forEach((stats, key) => {
      result.push({
        dex: key,
        volume: parseFloat(stats.volume.toFixed(2)),
        trades: stats.trades,
      });
    });

    return result.sort((a, b) => b.volume - a.volume);
  }

  private getTopTokens(trades: DexTradeDto[]): { token: string; volume: number; trades: number }[] {
    const tokenStats = new Map<string, { volume: number; trades: number }>();
    
    trades.forEach(t => {
      // Count both from and to tokens
      const fromStats = tokenStats.get(t.fromToken) || { volume: 0, trades: 0 };
      tokenStats.set(t.fromToken, {
        volume: fromStats.volume + t.fromAmount * t.price,
        trades: fromStats.trades + 1,
      });
      
      const toStats = tokenStats.get(t.toToken) || { volume: 0, trades: 0 };
      tokenStats.set(t.toToken, {
        volume: toStats.volume + t.toAmount,
        trades: toStats.trades + 1,
      });
    });

    const result: { token: string; volume: number; trades: number }[] = [];
    tokenStats.forEach((stats, token) => {
      result.push({
        token,
        volume: parseFloat(stats.volume.toFixed(2)),
        trades: stats.trades,
      });
    });

    return result.sort((a, b) => b.volume - a.volume).slice(0, 10);
  }

  private getDailyVolume(trades: DexTradeDto[]): { date: string; volume: number; trades: number }[] {
    const dailyStats = new Map<string, { volume: number; trades: number }>();
    
    trades.forEach(t => {
      const date = t.timestamp.split('T')[0];
      const existing = dailyStats.get(date) || { volume: 0, trades: 0 };
      dailyStats.set(date, {
        volume: existing.volume + t.totalCost,
        trades: existing.trades + 1,
      });
    });

    const result: { date: string; volume: number; trades: number }[] = [];
    dailyStats.forEach((stats, date) => {
      result.push({
        date,
        volume: parseFloat(stats.volume.toFixed(2)),
        trades: stats.trades,
      });
    });

    return result.sort((a, b) => a.date.localeCompare(b.date)).slice(-30);
  }
}
