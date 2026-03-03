import { Controller, Get, Query, HttpException, HttpStatus } from '@nestjs/common';
import { DefiMarketOverviewService } from './defi-market-overview.service';

@Controller('defi-market-overview')
export class DefiMarketOverviewController {
  constructor(private readonly service: DefiMarketOverviewService) {}

  @Get('overview')
  async getMarketOverview(@Query('chain') chain?: string) {
    try {
      return await this.service.getMarketOverview(chain);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('protocols')
  async getProtocols(
    @Query('chain') chain?: string,
    @Query('category') category?: string,
    @Query('sort') sort: string = 'tvl',
    @Query('limit') limit: number = 50,
  ) {
    try {
      return await this.service.getProtocols(chain, category, sort, limit);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('protocol/:id')
  async getProtocolDetails(@Query('id') id: string) {
    try {
      return await this.service.getProtocolDetails(id);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('categories')
  async getCategories() {
    try {
      return await this.service.getCategories();
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('trends')
  async getTrends(@Query('period') period: string = '7d') {
    try {
      return await this.service.getTrends(period);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('top-gainers-losers')
  async getTopGainersLosers(@Query('period') period: string = '24h') {
    try {
      return await this.service.getTopGainersLosers(period);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('yield-opportunities')
  async getYieldOpportunities(
    @Query('chain') chain?: string,
    @Query('minTvl') minTvl: number = 1000000,
  ) {
    try {
      return await this.service.getYieldOpportunities(chain, minTvl);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('chain-stats')
  async getChainStats() {
    try {
      return await this.service.getChainStats();
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('historical-tvl')
  async getHistoricalTvl(
    @Query('period') period: string = '30d',
    @Query('chain') chain?: string,
  ) {
    try {
      return await this.service.getHistoricalTvl(period, chain);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('search')
  async searchProtocols(@Query('q') query: string) {
    try {
      return await this.service.searchProtocols(query);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
