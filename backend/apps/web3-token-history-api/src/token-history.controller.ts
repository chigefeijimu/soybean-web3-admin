import { Controller, Get, Post, Query, Body, Param } from '@nestjs/common';
import { TokenHistoryService } from './token-history.service';

interface PriceHistoryQuery {
  tokenId: string;
  days?: number;
  currency?: string;
}

interface BatchPriceQuery {
  tokenIds: string[];
  days?: number;
  currency?: string;
}

interface TechnicalIndicatorQuery {
  tokenId: string;
  days?: number;
  indicator?: string;
  period?: number;
  currency?: string;
}

@Controller('api/token-history')
export class TokenHistoryController {
  constructor(private readonly tokenHistoryService: TokenHistoryService) {}

  /**
   * GET /api/token-history/price/:tokenId
   * Get historical price data for a token
   */
  @Get('price/:tokenId')
  async getPriceHistory(
    @Param('tokenId') tokenId: string,
    @Query('days') days: string = '30',
    @Query('currency') currency: string = 'usd',
  ) {
    const priceData = await this.tokenHistoryService.getPriceHistory(
      tokenId,
      parseInt(days),
      currency,
    );
    
    // Add calculated metrics
    const prices = priceData.map(p => p.price);
    const volatility = this.tokenHistoryService.calculateVolatility(prices);
    
    return {
      success: true,
      data: {
        tokenId,
        prices: priceData,
        volatility,
        summary: {
          latestPrice: prices[prices.length - 1] || 0,
          highestPrice: Math.max(...prices),
          lowestPrice: Math.min(...prices),
          priceChange: prices.length > 1 ? prices[prices.length - 1] - prices[0] : 0,
          priceChangePercent: prices.length > 1 ? ((prices[prices.length - 1] - prices[0]) / prices[0]) * 100 : 0,
        },
      },
    };
  }

  /**
   * POST /api/token-history/batch
   * Get batch price history for multiple tokens
   */
  @Post('batch')
  async getBatchPriceHistory(@Body() body: BatchPriceQuery) {
    const { tokenIds, days = 7, currency = 'usd' } = body;
    
    if (!tokenIds || !Array.isArray(tokenIds)) {
      return { success: false, error: 'tokenIds must be an array' };
    }
    
    const data = await this.tokenHistoryService.getBatchPriceHistory(
      tokenIds,
      days,
      currency,
    );
    
    return { success: true, data };
  }

  /**
   * GET /api/token-history/ohlc/:tokenId
   * Get OHLC candlestick data
   */
  @Get('ohlc/:tokenId')
  async getOHLCData(
    @Param('tokenId') tokenId: string,
    @Query('days') days: string = '30',
    @Query('currency') currency: string = 'usd',
  ) {
    const ohlcData = await this.tokenHistoryService.getOHLCData(
      tokenId,
      parseInt(days),
      currency,
    );
    
    return { success: true, data: ohlcData };
  }

  /**
   * GET /api/token-history/indicators/:tokenId
   * Get technical indicators for a token
   */
  @Get('indicators/:tokenId')
  async getTechnicalIndicators(
    @Param('tokenId') tokenId: string,
    @Query('days') days: string = '30',
    @Query('indicator') indicator: string = 'all',
    @Query('period') period: string = '14',
    @Query('currency') currency: string = 'usd',
  ) {
    const priceData = await this.tokenHistoryService.getPriceHistory(
      tokenId,
      parseInt(days),
      currency,
    );
    
    const prices = priceData.map(p => p.price);
    const indicators: Record<string, any> = {};
    const periodNum = parseInt(period);
    
    if (indicator === 'all' || indicator === 'sma') {
      indicators.sma = {
        '20': this.tokenHistoryService.calculateSMA(prices, 20),
        '50': this.tokenHistoryService.calculateSMA(prices, 50),
        '200': this.tokenHistoryService.calculateSMA(prices, 200),
      };
    }
    
    if (indicator === 'all' || indicator === 'ema') {
      indicators.ema = {
        '12': this.tokenHistoryService.calculateEMA(prices, 12),
        '26': this.tokenHistoryService.calculateEMA(prices, 26),
      };
    }
    
    if (indicator === 'all' || indicator === 'rsi') {
      indicators.rsi = this.tokenHistoryService.calculateRSI(prices, periodNum);
    }
    
    if (indicator === 'all' || indicator === 'macd') {
      indicators.macd = this.tokenHistoryService.calculateMACD(prices);
    }
    
    if (indicator === 'all' || indicator === 'bollinger') {
      indicators.bollinger = this.tokenHistoryService.calculateBollingerBands(prices);
    }
    
    return { success: true, data: indicators };
  }

  /**
   * GET /api/token-history/info/:tokenId
   * Get token information and current price
   */
  @Get('info/:tokenId')
  async getTokenInfo(
    @Param('tokenId') tokenId: string,
    @Query('currency') currency: string = 'usd',
  ) {
    const info = await this.tokenHistoryService.getTokenInfo(tokenId, currency);
    return { success: true, data: info };
  }

  /**
   * POST /api/token-history/market
   * Get market data for multiple tokens
   */
  @Post('market')
  async getMarketData(
    @Body() body: { tokenIds: string[]; currency?: string; order?: string; perPage?: number },
  ) {
    const { tokenIds, currency = 'usd', order = 'market_cap_desc', perPage = 100 } = body;
    
    if (!tokenIds || !Array.isArray(tokenIds)) {
      return { success: false, error: 'tokenIds must be an array' };
    }
    
    const data = await this.tokenHistoryService.getMarketData(
      tokenIds,
      currency,
      order,
      perPage,
    );
    
    return { success: true, data };
  }

  /**
   * GET /api/token-history/search
   * Search for tokens
   */
  @Get('search')
  async searchTokens(@Query('q') query: string) {
    if (!query || query.length < 2) {
      return { success: false, error: 'Query must be at least 2 characters' };
    }
    
    const results = await this.tokenHistoryService.searchTokens(query);
    return { success: true, data: results };
  }

  /**
   * GET /api/token-history/global
   * Get global market data
   */
  @Get('global')
  async getGlobalData() {
    const data = await this.tokenHistoryService.getGlobalData();
    return { success: true, data };
  }

  /**
   * GET /api/token-history/chains
   * Get supported chains
   */
  @Get('chains')
  getSupportedChains() {
    return {
      success: true,
      data: this.tokenHistoryService.getSupportedChains(),
    };
  }

  /**
   * GET /api/token-history/popular
   * Get popular/trending tokens
   */
  @Get('popular')
  async getPopularTokens(@Query('currency') currency: string = 'usd') {
    try {
      const url = 'https://api.coingecko.com/api/v3/search';
      const response = await fetch(`${url}?query=crypto`);
      
      // Get top tokens by market cap
      const marketData = await this.tokenHistoryService.getMarketData(
        ['bitcoin', 'ethereum', 'tether', 'binancecoin', 'solana', 'ripple', 'cardano', 'dogecoin', 'polkadot', 'polygon'],
        currency,
        'market_cap_desc',
        10,
      );
      
      return { success: true, data: marketData };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * GET /api/token-history/volatility/:tokenId
   * Get volatility analysis for a token
   */
  @Get('volatility/:tokenId')
  async getVolatility(
    @Param('tokenId') tokenId: string,
    @Query('days') days: string = '30',
    @Query('currency') currency: string = 'usd',
  ) {
    const priceData = await this.tokenHistoryService.getPriceHistory(
      tokenId,
      parseInt(days),
      currency,
    );
    
    const prices = priceData.map(p => p.price);
    const volatility = this.tokenHistoryService.calculateVolatility(prices);
    
    // Calculate additional metrics
    const returns: number[] = [];
    for (let i = 1; i < prices.length; i++) {
      returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
    }
    
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const positiveDays = returns.filter(r => r > 0).length;
    const negativeDays = returns.filter(r => r < 0).length;
    
    return {
      success: true,
      data: {
        tokenId,
        period: parseInt(days),
        volatility,
        statistics: {
          averageReturn: mean * 100,
          positiveDays,
          negativeDays,
          winRate: returns.length > 0 ? (positiveDays / returns.length) * 100 : 0,
        },
      },
    };
  }
}
