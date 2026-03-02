import { Controller, Get, Query } from '@nestjs/common';
import { TokenCorrelationService } from './token-correlation.service';

@Controller('web3/token-correlation')
export class TokenCorrelationController {
  constructor(private readonly tokenCorrelationService: TokenCorrelationService) {}

  @Get('matrix')
  async getCorrelationMatrix(
    @Query('tokens') tokens: string,
    @Query('chain') chain: string = 'ethereum',
    @Query('timeframe') timeframe: string = '30d',
  ) {
    const tokenList = tokens ? tokens.split(',') : [
      'ETH', 'BTC', 'SOL', 'BNB', 'XRP', 'ADA', 'MATIC', 'AVAX', 'LINK', 'UNI'
    ];
    return this.tokenCorrelationService.getCorrelationMatrix(tokenList, chain, timeframe);
  }

  @Get('top-correlations')
  async getTopCorrelations(
    @Query('token') token: string = 'ETH',
    @Query('chain') chain: string = 'ethereum',
    @Query('timeframe') timeframe: string = '30d',
    @Query('limit') limit: string = '10',
  ) {
    return this.tokenCorrelationService.getTopCorrelations(
      token, 
      chain, 
      timeframe, 
      parseInt(limit) || 10
    );
  }

  @Get('diversification-score')
  async getDiversificationScore(
    @Query('tokens') tokens: string,
    @Query('chain') chain: string = 'ethereum',
    @Query('timeframe') timeframe: string = '30d',
  ) {
    const tokenList = tokens ? tokens.split(',') : ['ETH', 'BTC', 'SOL', 'BNB'];
    return this.tokenCorrelationService.getDiversificationScore(tokenList, chain, timeframe);
  }

  @Get('trending')
  async getTrendingCorrelations(
    @Query('chain') chain: string = 'ethereum',
    @Query('timeframe') timeframe: string = '30d',
  ) {
    return this.tokenCorrelationService.getTrendingCorrelations(chain, timeframe);
  }

  @Get('heatmap-data')
  async getHeatmapData(
    @Query('chain') chain: string = 'ethereum',
    @Query('timeframe') timeframe: string = '30d',
  ) {
    return this.tokenCorrelationService.getHeatmapData(chain, timeframe);
  }
}
