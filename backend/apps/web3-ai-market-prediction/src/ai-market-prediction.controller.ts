import { Controller, Get, Param, Query, HttpStatus, HttpCode } from '@nestjs/common';
import { AiMarketPredictionService } from './ai-market-prediction.service';

@Controller('web3/ai-market-prediction')
export class AiMarketPredictionController {
  constructor(private readonly aiMarketPredictionService: AiMarketPredictionService) {}

  /**
   * Get prediction for a single token
   * GET /web3/ai-market-prediction/:symbol
   */
  @Get(':symbol')
  @HttpCode(HttpStatus.OK)
  async getTokenPrediction(@Param('symbol') symbol: string) {
    const prediction = await this.aiMarketPredictionService.getTokenPrediction(symbol);
    if (!prediction) {
      return {
        success: false,
        error: 'Token not supported',
      };
    }
    return {
      success: true,
      data: prediction,
    };
  }

  /**
   * Get predictions for multiple tokens
   * GET /web3/ai-market-prediction/batch
   */
  @Get('batch/list')
  @HttpCode(HttpStatus.OK)
  async getMultipleTokenPredictions(@Query('symbols') symbols: string) {
    const symbolList = symbols.split(',').map(s => s.trim());
    const predictions = await this.aiMarketPredictionService.getMultipleTokenPredictions(symbolList);
    return {
      success: true,
      data: predictions,
    };
  }

  /**
   * Get all token predictions
   * GET /web3/ai-market-prediction/all
   */
  @Get('all/list')
  @HttpCode(HttpStatus.OK)
  async getAllTokenPredictions() {
    const predictions = await this.aiMarketPredictionService.getAllTokenPredictions();
    return {
      success: true,
      data: predictions,
    };
  }

  /**
   * Get top bullish predictions
   * GET /web3/ai-market-prediction/top/bullish
   */
  @Get('top/bullish')
  @HttpCode(HttpStatus.OK)
  async getTopBullishPredictions(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 5;
    const predictions = await this.aiMarketPredictionService.getTopBullishPredictions(limitNum);
    return {
      success: true,
      data: predictions,
    };
  }

  /**
   * Get top bearish predictions
   * GET /web3/ai-market-prediction/top/bearish
   */
  @Get('top/bearish')
  @HttpCode(HttpStatus.OK)
  async getTopBearishPredictions(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 5;
    const predictions = await this.aiMarketPredictionService.getTopBearishPredictions(limitNum);
    return {
      success: true,
      data: predictions,
    };
  }

  /**
   * Get strong buy signals
   * GET /web3/ai-market-prediction/signals/strong-buy
   */
  @Get('signals/strong-buy')
  @HttpCode(HttpStatus.OK)
  async getStrongBuySignals(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    const predictions = await this.aiMarketPredictionService.getStrongBuySignals(limitNum);
    return {
      success: true,
      data: predictions,
    };
  }

  /**
   * Get market summary
   * GET /web3/ai-market-prediction/summary
   */
  @Get('summary/market')
  @HttpCode(HttpStatus.OK)
  async getMarketSummary() {
    const summary = await this.aiMarketPredictionService.getMarketSummary();
    return {
      success: true,
      data: summary,
    };
  }

  /**
   * Get prediction history for a token
   * GET /web3/ai-market-prediction/history/:symbol
   */
  @Get('history/:symbol')
  @HttpCode(HttpStatus.OK)
  async getPredictionHistory(
    @Param('symbol') symbol: string,
    @Query('days') days?: string,
  ) {
    const daysNum = days ? parseInt(days, 10) : 7;
    const history = await this.aiMarketPredictionService.getPredictionHistory(symbol, daysNum);
    return {
      success: true,
      data: history,
    };
  }

  /**
   * Compare multiple tokens
   * GET /web3/ai-market-prediction/compare
   */
  @Get('compare/tokens')
  @HttpCode(HttpStatus.OK)
  async compareTokens(@Query('symbols') symbols: string) {
    const symbolList = symbols.split(',').map(s => s.trim());
    const result = await this.aiMarketPredictionService.compareTokens(symbolList);
    return {
      success: true,
      data: result,
    };
  }

  /**
   * Get supported tokens list
   * GET /web3/ai-market-prediction/tokens
   */
  @Get('tokens/list')
  @HttpCode(HttpStatus.OK)
  async getSupportedTokens() {
    const tokens = this.aiMarketPredictionService.getSupportedTokens();
    return {
      success: true,
      data: tokens,
    };
  }
}
