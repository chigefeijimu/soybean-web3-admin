import { Controller, Get, Param, Query, HttpStatus, HttpCode } from '@nestjs/common';
import { TokenSentimentService } from './token-sentiment.service';

@Controller('web3/token-sentiment')
export class TokenSentimentController {
  constructor(private readonly tokenSentimentService: TokenSentimentService) {}

  @Get(':symbol')
  @HttpCode(HttpStatus.OK)
  async getTokenSentiment(@Param('symbol') symbol: string) {
    const sentiment = await this.tokenSentimentService.getTokenSentiment(symbol);
    return {
      success: true,
      data: sentiment,
    };
  }

  @Get('batch/list')
  @HttpCode(HttpStatus.OK)
  async getMultipleTokenSentiment(@Query('symbols') symbols: string) {
    const symbolList = symbols.split(',').map(s => s.trim());
    const sentiments = await this.tokenSentimentService.getMultipleTokenSentiment(symbolList);
    return {
      success: true,
      data: sentiments,
    };
  }

  @Get('all/list')
  @HttpCode(HttpStatus.OK)
  async getAllTokensSentiment() {
    const sentiments = await this.tokenSentimentService.getAllTokensSentiment();
    return {
      success: true,
      data: sentiments,
    };
  }

  @Get('top/bullish')
  @HttpCode(HttpStatus.OK)
  async getTopBullishTokens(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    const tokens = await this.tokenSentimentService.getTopBullishTokens(limitNum);
    return {
      success: true,
      data: tokens,
    };
  }

  @Get('top/bearish')
  @HttpCode(HttpStatus.OK)
  async getTopBearishTokens(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    const tokens = await this.tokenSentimentService.getTopBearishTokens(limitNum);
    return {
      success: true,
      data: tokens,
    };
  }

  @Get('overview/market')
  @HttpCode(HttpStatus.OK)
  async getMarketSentimentOverview() {
    const overview = await this.tokenSentimentService.getMarketSentimentOverview();
    return {
      success: true,
      data: overview,
    };
  }

  @Get('history/:symbol')
  @HttpCode(HttpStatus.OK)
  async getSentimentHistory(
    @Param('symbol') symbol: string,
    @Query('days') days?: string,
  ) {
    const daysNum = days ? parseInt(days, 10) : 7;
    const history = await this.tokenSentimentService.getSentimentHistory(symbol, daysNum);
    return {
      success: true,
      data: history,
    };
  }

  @Get('tokens/list')
  @HttpCode(HttpStatus.OK)
  async getSupportedTokens() {
    const tokens = this.tokenSentimentService.getSupportedTokens();
    return {
      success: true,
      data: tokens,
    };
  }
}
