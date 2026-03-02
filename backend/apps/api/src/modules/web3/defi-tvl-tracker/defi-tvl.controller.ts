import { Controller, Get, Query } from '@nestjs/common';
import { DefiTvlService } from './defi-tvl.service';

@Controller('web3/defi-tvl')
export class DefiTvlController {
  constructor(private readonly defiTvlService: DefiTvlService) {}

  @Get('protocols')
  async getProtocols() {
    return this.defiTvlService.getProtocols();
  }

  @Get('overview')
  async getOverview() {
    return this.defiTvlService.getOverview();
  }

  @Get('history')
  async getHistory(
    @Query('protocol') protocol: string,
    @Query('days') days: string = '30',
  ) {
    return this.defiTvlService.getProtocolHistory(protocol, parseInt(days, 10));
  }

  @Get('compare')
  async compareProtocols(@Query('protocols') protocols: string) {
    const protocolList = protocols.split(',');
    return this.defiTvlService.compareProtocols(protocolList);
  }

  @Get('trending')
  async getTrending(@Query('days') days: string = '7') {
    return this.defiTvlService.getTrending(parseInt(days, 10));
  }

  @Get('categories')
  async getCategories() {
    return this.defiTvlService.getCategories();
  }
}
