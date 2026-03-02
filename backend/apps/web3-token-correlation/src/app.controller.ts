import { Controller, Get, Query } from '@nestjs/common';
import { TokenCorrelationService } from './app.service';

@Controller('web3/token-correlation')
export class TokenCorrelationController {
  constructor(private readonly tokenCorrelationService: TokenCorrelationService) {}

  @Get('matrix')
  async getCorrelationMatrix(
    @Query('tokens') tokens: string,
    @Query('chain') chain: string = 'ethereum',
    @Query('timeframe') timeframe: string = '30d',
  ) {
    const results = await this.tokenCorrelationService.getCorrelationMatrix(tokens, chain, timeframe);
    return {
      success: true,
      data: results,
    };
  }

  @Get('heatmap-data')
  async getHeatmapData(
    @Query('chain') chain: string = 'ethereum',
    @Query('timeframe') timeframe: string = '30d',
  ) {
    const results = await this.tokenCorrelationService.getHeatmapData(chain, timeframe);
    return {
      success: true,
      data: results,
    };
  }

  @Get('top-correlations')
  async getTopCorrelations(
    @Query('token') token: string,
    @Query('chain') chain: string = 'ethereum',
    @Query('timeframe') timeframe: string = '30d',
    @Query('limit') limit: string = '10',
  ) {
    const results = await this.tokenCorrelationService.getTopCorrelations(
      token,
      chain,
      timeframe,
      parseInt(limit, 10),
    );
    return {
      success: true,
      data: results,
    };
  }

  @Get('diversification-score')
  async getDiversificationScore(
    @Query('tokens') tokens: string,
    @Query('chain') chain: string = 'ethereum',
    @Query('timeframe') timeframe: string = '30d',
  ) {
    const results = await this.tokenCorrelationService.getDiversificationScore(tokens, chain, timeframe);
    return {
      success: true,
      data: results,
    };
  }

  @Get('trending')
  async getTrendingCorrelations(
    @Query('chain') chain: string = 'ethereum',
    @Query('timeframe') timeframe: string = '30d',
  ) {
    const results = await this.tokenCorrelationService.getTrendingCorrelations(chain, timeframe);
    return {
      success: true,
      data: results,
    };
  }
}
