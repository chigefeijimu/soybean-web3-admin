import { Injectable } from '@nestjs/common';
import { ApiProperty, ApiTags } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsArray, Min, Max } from 'class-validator';

export class TokenMetricsQueryDto {
  @ApiProperty({ description: 'Token symbol (e.g., ETH, BTC, USDC)', required: false })
  @IsOptional()
  @IsString()
  symbol?: string;

  @ApiProperty({ description: 'Chain ID or name', required: false })
  @IsOptional()
  @IsString()
  chain?: string;

  @ApiProperty({ description: 'Time range: 24h, 7d, 30d, 90d', required: false, default: '24h' })
  @IsOptional()
  @IsString()
  timeframe?: string = '24h';
}

export class CrossChainMetricsDto {
  @ApiProperty({ description: 'Token symbol' })
  symbol: string;

  @ApiProperty({ description: 'Chain name' })
  chain: string;

  @ApiProperty({ description: 'Current price in USD' })
  price: number;

  @ApiProperty({ description: '24h price change percentage' })
  change24h: number;

  @ApiProperty({ description: '24h trading volume' })
  volume24h: number;

  @ApiProperty({ description: 'Total liquidity' })
  liquidity: number;

  @ApiProperty({ description: 'Market cap' })
  marketCap: number;

  @ApiProperty({ description: 'Circulating supply' })
  circulatingSupply: number;

  @ApiProperty({ description: 'Total supply' })
  totalSupply: number;

  @ApiProperty({ description: 'Number of holders' })
  holders: number;

  @ApiProperty({ description: 'Number of transfers' })
  transfers24h: number;
}

export class ArbitrageOpportunityDto {
  @ApiProperty({ description: 'Token symbol' })
  symbol: string;

  @ApiProperty({ description: 'Buy chain' })
  buyChain: string;

  @ApiProperty({ description: 'Sell chain' })
  sellChain: string;

  @ApiProperty({ description: 'Buy price' })
  buyPrice: number;

  @ApiProperty({ description: 'Sell price' })
  sellPrice: number;

  @ApiProperty({ description: 'Price difference percentage' })
  priceDiff: number;

  @ApiProperty({ description: 'Potential profit after fees' })
  potentialProfit: number;

  @ApiProperty({ description: 'Confidence score 0-100' })
  confidence: number;

  @ApiProperty({ description: 'Risk level: low, medium, high' })
  riskLevel: string;
}

export class TokenHealthScoreDto {
  @ApiProperty({ description: 'Token symbol' })
  symbol: string;

  @ApiProperty({ description: 'Overall health score 0-100' })
  overallScore: number;

  @ApiProperty({ description: 'Liquidity score' })
  liquidityScore: number;

  @ApiProperty({ description: 'Volatility score' })
  volatilityScore: number;

  @ApiProperty({ description: 'Adoption score' })
  adoptionScore: number;

  @ApiProperty({ description: 'Security score' })
  securityScore: number;

  @ApiProperty({ description: 'Risk level: low, medium, high, critical' })
  riskLevel: string;

  @ApiProperty({ description: 'Health factors' })
  factors: {
    liquidity: string;
    volatility: string;
    holders: string;
    transfers: string;
  };
}

export class TokenMetricsResponseDto {
  @ApiProperty({ description: 'Token symbol' })
  symbol: string;

  @ApiProperty({ description: 'Token name' })
  name: string;

  @ApiProperty({ description: 'Current USD price' })
  price: number;

  @ApiProperty({ description: '24h change percentage' })
  change24h: number;

  @ApiProperty({ description: '7d change percentage' })
  change7d: number;

  @ApiProperty({ description: 'Market cap' })
  marketCap: number;

  @ApiProperty({ description: '24h volume' })
  volume24h: number;

  @ApiProperty({ description: 'All time high price' })
  ath: number;

  @ApiProperty({ description: 'All time low price' })
  atl: number;

  @ApiProperty({ description: 'Circulating supply' })
  circulatingSupply: number;

  @ApiProperty({ description: 'Total supply' })
  totalSupply: number;

  @ApiProperty({ description: 'Number of holders' })
  holders: number;

  @ApiProperty({ description: 'Cross-chain metrics' })
  crossChainMetrics: CrossChainMetricsDto[];

  @ApiProperty({ description: 'Arbitrage opportunities' })
  arbitrageOpportunities: ArbitrageOpportunityDto[];

  @ApiProperty({ description: 'Health score' })
  healthScore: TokenHealthScoreDto;
}

export class MarketOverviewDto {
  @ApiProperty({ description: 'Total market cap' })
  totalMarketCap: number;

  @ApiProperty({ description: '24h volume' })
  volume24h: number;

  @ApiProperty({ description: 'BTC dominance' })
  btcDominance: number;

  @ApiProperty({ description: 'ETH dominance' })
  ethDominance: number;

  @ApiProperty({ description: 'Defi TVL' })
  defiTvl: number;

  @ApiProperty({ description: 'Number of tokens tracked' })
  tokensTracked: number;

  @ApiProperty({ description: 'Active arbitrage opportunities' })
  activeArbitrageCount: number;

  @ApiProperty({ description: 'Top gainers' })
  topGainers: { symbol: string; change: number; price: number }[];

  @ApiProperty({ description: 'Top losers' })
  topLosers: { symbol: string; change: number; price: number }[];
}

export class TokenSearchDto {
  @ApiProperty({ description: 'Search query' })
  @IsString()
  query: string;

  @ApiProperty({ description: 'Limit results', required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  limit?: number = 10;
}

export class TokenComparisonDto {
  @ApiProperty({ description: 'Comma-separated token symbols' })
  @IsString()
  symbols: string;

  @ApiProperty({ description: 'Chain filter', required: false })
  @IsOptional()
  @IsString()
  chain?: string;
}

// Popular tokens across chains
const POPULAR_TOKENS = {
  Ethereum: ['ETH', 'WBTC', 'USDC', 'USDT', 'DAI', 'UNI', 'LINK', 'AAVE', 'MKR', 'CRV', 'LDO', 'ARB', 'OP', 'MATIC', 'SOL', 'BNB'],
  Polygon: ['MATIC', 'USDC', 'USDT', 'DAI', 'QUICK', 'LINK', 'AAVE', 'CRV', 'BAL', 'GHST'],
  Arbitrum: ['ETH', 'ARB', 'USDC', 'USDT', 'DAI', 'UNI', 'LINK', 'MKR', 'LDO', 'GMX'],
  Optimism: ['ETH', 'OP', 'USDC', 'USDT', 'DAI', 'UNI', 'LINK', 'MKR', 'VELO', 'PERP'],
  BSC: ['BNB', 'CAKE', 'BUSD', 'USDT', 'USDC', 'DAI', 'ETH', 'BTCB', 'XVS', 'VENOM'],
  Base: ['ETH', 'USDC', 'USDT', 'DAI', 'CBETH', 'DEGEN', 'BRETT', 'AERO'],
  Avalanche: ['AVAX', 'USDC', 'USDT', 'DAI', 'JOE', 'PNG', 'QI', 'GMX', 'LYS'],
};

// Simulated price data for demo (in real app, fetch from APIs)
const getMockPrice = (symbol: string, chain: string): number => {
  const basePrices: Record<string, number> = {
    ETH: 3250, WBTC: 68000, USDC: 1, USDT: 1, DAI: 1, UNI: 12.5, LINK: 18.2, AAVE: 280,
    MKR: 1800, CRV: 0.55, LDO: 2.8, ARB: 1.8, OP: 3.2, MATIC: 0.75, SOL: 145, BNB: 580,
    QUICK: 65, GHST: 0.35, GMX: 45, VELO: 0.12, PERP: 2.1, CAKE: 2.8, BTCB: 68000, XVS: 5.5,
    CBETH: 3400, DEGEN: 0.015, BRETT: 0.08, AERO: 1.2, AVAX: 38, JOE: 0.45, PNG: 0.28, QI: 0.08,
    BAL: 4.5, LYS: 0.22,
  };
  
  const variation = (Math.random() - 0.5) * 0.1;
  const basePrice = basePrices[symbol] || 10;
  return basePrice * (1 + variation);
};

const getChainId = (chain: string): string => {
  const chainIds: Record<string, string> = {
    Ethereum: '1', Polygon: '137', Arbitrum: '42161', Optimism: '10',
    BSC: '56', Base: '8453', Avalanche: '43114',
  };
  return chainIds[chain] || '1';
};

@Injectable()
export class TokenMetricsAggregatorService {
  private supportedChains = ['Ethereum', 'Polygon', 'Arbitrum', 'Optimism', 'BSC', 'Base', 'Avalanche'];

  async getTokenMetrics(query: TokenMetricsQueryDto): Promise<TokenMetricsResponseDto> {
    const symbol = query.symbol || 'ETH';
    const chain = query.chain || 'Ethereum';
    const timeframe = query.timeframe || '24h';

    // Get cross-chain metrics
    const crossChainMetrics = await this.getCrossChainMetrics(symbol);
    
    // Get arbitrage opportunities
    const arbitrageOpportunities = this.findArbitrageOpportunities(symbol);
    
    // Calculate health score
    const healthScore = await this.calculateTokenHealth(symbol, crossChainMetrics);

    // Mock base data
    const price = getMockPrice(symbol, chain);
    const volume24h = price * (Math.random() * 10000000 + 500000);
    const marketCap = price * (Math.random() * 1000000000 + 100000000);

    return {
      symbol,
      name: this.getTokenName(symbol),
      price,
      change24h: (Math.random() - 0.5) * 10,
      change7d: (Math.random() - 0.5) * 20,
      marketCap,
      volume24h,
      ath: price * 1.5,
      atl: price * 0.5,
      circulatingSupply: Math.random() * 100000000 + 10000000,
      totalSupply: Math.random() * 100000000 + 10000000,
      holders: Math.floor(Math.random() * 500000 + 10000),
      crossChainMetrics,
      arbitrageOpportunities,
      healthScore,
    };
  }

  async getCrossChainMetrics(symbol: string): Promise<CrossChainMetricsDto[]> {
    const metrics: CrossChainMetricsDto[] = [];
    
    for (const chain of this.supportedChains) {
      const price = getMockPrice(symbol, chain);
      const liquidity = price * (Math.random() * 10000000 + 1000000);
      const volume24h = price * (Math.random() * 5000000 + 100000);
      
      metrics.push({
        symbol,
        chain,
        price,
        change24h: (Math.random() - 0.5) * 8,
        volume24h,
        liquidity,
        marketCap: price * (Math.random() * 1000000000 + 100000000),
        circulatingSupply: Math.random() * 100000000 + 10000000,
        totalSupply: Math.random() * 100000000 + 10000000,
        holders: Math.floor(Math.random() * 100000 + 1000),
        transfers24h: Math.floor(Math.random() * 50000 + 1000),
      });
    }
    
    return metrics;
  }

  findArbitrageOpportunities(symbol: string): ArbitrageOpportunityDto[] {
    const opportunities: ArbitrageOpportunityDto[] = [];
    const chains = this.supportedChains;
    
    // Compare prices across chains to find arbitrage
    const prices: { chain: string; price: number }[] = chains.map(chain => ({
      chain,
      price: getMockPrice(symbol, chain) * (1 + (Math.random() - 0.5) * 0.05),
    }));
    
    for (let i = 0; i < prices.length; i++) {
      for (let j = i + 1; j < prices.length; j++) {
        const priceDiff = ((prices[i].price - prices[j].price) / prices[j].price) * 100;
        
        if (Math.abs(priceDiff) > 1) {
          const buy = priceDiff > 0 ? prices[j] : prices[i];
          const sell = priceDiff > 0 ? prices[i] : prices[j];
          const profit = Math.abs(priceDiff) * 0.8; // After fees
          
          opportunities.push({
            symbol,
            buyChain: buy.chain,
            sellChain: sell.chain,
            buyPrice: buy.price,
            sellPrice: sell.price,
            priceDiff: Math.abs(priceDiff),
            potentialProfit: profit,
            confidence: Math.max(0, 100 - Math.abs(priceDiff) * 10),
            riskLevel: Math.abs(priceDiff) > 5 ? 'high' : Math.abs(priceDiff) > 2 ? 'medium' : 'low',
          });
        }
      }
    }
    
    return opportunities.sort((a, b) => b.potentialProfit - a.potentialProfit).slice(0, 5);
  }

  async calculateTokenHealth(symbol: string, crossChainMetrics: CrossChainMetricsDto[]): Promise<TokenHealthScoreDto> {
    // Calculate individual scores
    const avgLiquidity = crossChainMetrics.reduce((sum, m) => sum + m.liquidity, 0) / crossChainMetrics.length;
    const avgHolders = crossChainMetrics.reduce((sum, m) => sum + m.holders, 0) / crossChainMetrics.length;
    const avgTransfers = crossChainMetrics.reduce((sum, m) => sum + m.transfers24h, 0) / crossChainMetrics.length;
    const avgChange = crossChainMetrics.reduce((sum, m) => sum + Math.abs(m.change24h), 0) / crossChainMetrics.length;
    
    const liquidityScore = Math.min(100, (avgLiquidity / 10000000) * 100);
    const adoptionScore = Math.min(100, (avgHolders / 100000) * 100);
    const activityScore = Math.min(100, (avgTransfers / 10000) * 100);
    const volatilityScore = Math.max(0, 100 - avgChange * 10);
    const securityScore = 85 + Math.random() * 15; // Mock security score
    
    const overallScore = (liquidityScore * 0.25 + adoptionScore * 0.2 + activityScore * 0.15 + 
                          volatilityScore * 0.2 + securityScore * 0.2);
    
    return {
      symbol,
      overallScore: Math.round(overallScore),
      liquidityScore: Math.round(liquidityScore),
      volatilityScore: Math.round(volatilityScore),
      adoptionScore: Math.round(adoptionScore),
      securityScore: Math.round(securityScore),
      riskLevel: overallScore > 70 ? 'low' : overallScore > 50 ? 'medium' : overallScore > 30 ? 'high' : 'critical',
      factors: {
        liquidity: avgLiquidity > 5000000 ? 'Healthy' : 'Low',
        volatility: avgChange < 5 ? 'Stable' : avgChange < 10 ? 'Moderate' : 'High',
        holders: avgHolders > 50000 ? 'Strong' : avgHolders > 10000 ? 'Normal' : 'Weak',
        transfers: avgTransfers > 5000 ? 'Active' : avgTransfers > 1000 ? 'Moderate' : 'Low',
      },
    };
  }

  async getMarketOverview(): Promise<MarketOverviewDto> {
    const tokens = ['ETH', 'BTC', 'SOL', 'BNB', 'XRP', 'ADA', 'AVAX', 'DOGE', 'LINK', 'UNI'];
    const prices = tokens.map(t => getMockPrice(t, 'Ethereum'));
    
    const topGainers = tokens.map((symbol, i) => ({
      symbol,
      change: (Math.random() * 15),
      price: prices[i],
    })).sort((a, b) => b.change - a.change).slice(0, 5);
    
    const topLosers = tokens.map((symbol, i) => ({
      symbol,
      change: -(Math.random() * 15),
      price: prices[i],
    })).sort((a, b) => a.change - b.change).slice(0, 5);
    
    return {
      totalMarketCap: 2500000000000,
      volume24h: 85000000000,
      btcDominance: 52,
      ethDominance: 18,
      defiTvl: 180000000000,
      tokensTracked: 15000,
      activeArbitrageCount: Math.floor(Math.random() * 20 + 5),
      topGainers,
      topLosers,
    };
  }

  async searchTokens(query: string, limit: number = 10): Promise<{ symbol: string; name: string; chain: string }[]> {
    const results: { symbol: string; name: string; chain: string }[] = [];
    const queryLower = query.toLowerCase();
    
    for (const [chain, tokens] of Object.entries(POPULAR_TOKENS)) {
      for (const symbol of tokens) {
        if (symbol.toLowerCase().includes(queryLower) || 
            this.getTokenName(symbol).toLowerCase().includes(queryLower)) {
          results.push({
            symbol,
            name: this.getTokenName(symbol),
            chain,
          });
        }
      }
    }
    
    return results.slice(0, limit);
  }

  async compareTokens(symbols: string[], chain?: string): Promise<{
    symbol: string;
    chain: string;
    price: number;
    change24h: number;
    volume24h: number;
    liquidity: number;
    holders: number;
  }[]> {
    const results = [];
    const chains = chain ? [chain] : this.supportedChains;
    
    for (const symbol of symbols) {
      for (const c of chains) {
        const price = getMockPrice(symbol, c);
        results.push({
          symbol,
          chain: c,
          price,
          change24h: (Math.random() - 0.5) * 10,
          volume24h: price * (Math.random() * 1000000 + 100000),
          liquidity: price * (Math.random() * 5000000 + 500000),
          holders: Math.floor(Math.random() * 100000 + 1000),
        });
      }
    }
    
    return results;
  }

  getSupportedChains(): string[] {
    return this.supportedChains;
  }

  getSupportedTokens(): { symbol: string; name: string }[] {
    const tokens = new Set<string>();
    for (const chainTokens of Object.values(POPULAR_TOKENS)) {
      chainTokens.forEach(t => tokens.add(t));
    }
    
    return Array.from(tokens).map(symbol => ({
      symbol,
      name: this.getTokenName(symbol),
    }));
  }

  private getTokenName(symbol: string): string {
    const names: Record<string, string> = {
      ETH: 'Ethereum', WBTC: 'Wrapped Bitcoin', USDC: 'USD Coin', USDT: 'Tether',
      DAI: 'Dai', UNI: 'Uniswap', LINK: 'Chainlink', AAVE: 'Aave', MKR: 'Maker',
      CRV: 'Curve DAO', LDO: 'Lido DAO', ARB: 'Arbitrum', OP: 'Optimism',
      MATIC: 'Polygon', SOL: 'Solana', BNB: 'BNB', QUICK: 'QuickSwap',
      GHST: 'Aavegotchi', GMX: 'GMX', VELO: 'Velodrome', PERP: 'Perpetual',
      CAKE: 'PancakeSwap', BTCB: 'Bitcoin BNB', XVS: 'Venom', CBETH: 'Coinbase Wrapped Staked ETH',
      DEGEN: 'Degen', BRETT: 'Brett', AERO: 'Aerodrome', AVAX: 'Avalanche',
      JOE: 'Trader Joe', PNG: 'Pangolin', QI: 'Qi DAO', BAL: 'Balancer',
      LYS: 'Lys', GHST: 'Aavegotchi',
    };
    return names[symbol] || symbol;
  }
}
