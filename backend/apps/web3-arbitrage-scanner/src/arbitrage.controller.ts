import { Controller, Get, Post, Query, Body } from '@nestjs/common';
import { ArbitrageService } from './arbitrage.service';

@Controller('arbitrage')
export class ArbitrageController {
  constructor(private readonly arbitrageService: ArbitrageService) {}

  @Get('scan')
  async scanOpportunities(
    @Query('minProfit') minProfit: string = '0.5',
    @Query('volume') volume: string = '10000',
  ) {
    const opportunities = await this.arbitrageService.scanArbitrageOpportunities(
      parseFloat(minProfit),
      parseFloat(volume),
    );
    return {
      code: 200,
      data: opportunities,
      message: 'Arbitrage opportunities retrieved successfully',
    };
  }

  @Get('prices')
  async getPrices(@Query('chainId') chainId: string = '1') {
    const prices = await this.arbitrageService.getExchangePrices(parseInt(chainId));
    return {
      code: 200,
      data: prices,
      message: 'Exchange prices retrieved successfully',
    };
  }

  @Get('token-price')
  async getTokenPrice(
    @Query('address') address: string,
    @Query('chainId') chainId: string = '1',
  ) {
    const priceData = await this.arbitrageService.getTokenPriceFromDEX(
      address,
      parseInt(chainId),
    );
    return {
      code: 200,
      data: priceData,
      message: 'Token price retrieved successfully',
    };
  }

  @Get('history')
  async getHistory(
    @Query('token') token: string = 'ETH',
    @Query('days') days: string = '7',
  ) {
    const history = await this.arbitrageService.getHistoricalArbitrageData(
      token,
      parseInt(days),
    );
    return {
      code: 200,
      data: history,
      message: 'Historical arbitrage data retrieved successfully',
    };
  }

  @Get('overview')
  async getOverview() {
    const overview = await this.arbitrageService.getMarketOverview();
    return {
      code: 200,
      data: overview,
      message: 'Market overview retrieved successfully',
    };
  }
}
