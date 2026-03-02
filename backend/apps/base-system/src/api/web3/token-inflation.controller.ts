import { Controller, Get, Param, Query } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { TokenInflationService, TokenInflationData, TokenSupplyHistory, InflationAnalysis } from './token-inflation.service';

@Controller('web3/token-inflation')
export class TokenInflationController {
  constructor(
    private readonly httpService: HttpService,
    private readonly tokenInflationService: TokenInflationService,
  ) {}

  @Get('supply/:chain/:address')
  async getTokenSupply(
    @Param('chain') chain: string,
    @Param('address') address: string,
  ): Promise<TokenInflationData> {
    return this.tokenInflationService.getTokenSupply(chain, address);
  }

  @Get('history/:chain/:address')
  async getSupplyHistory(
    @Param('chain') chain: string,
    @Param('address') address: string,
    @Query('days') days: string = '30',
  ): Promise<TokenSupplyHistory[]> {
    return this.tokenInflationService.getSupplyHistory(chain, address, parseInt(days, 10));
  }

  @Get('analysis/:chain/:address')
  async getInflationAnalysis(
    @Param('chain') chain: string,
    @Param('address') address: string,
  ): Promise<InflationAnalysis> {
    return this.tokenInflationService.getInflationAnalysis(chain, address);
  }

  @Get('trending')
  async getTrendingInflation(
    @Query('chain') chain: string = 'eth',
    @Query('limit') limit: string = '10',
  ): Promise<any[]> {
    return this.tokenInflationService.getTrendingInflation(chain, parseInt(limit, 10));
  }

  @Get('compare')
  async compareTokens(
    @Query('addresses') addresses: string,
    @Query('chain') chain: string = 'eth',
  ): Promise<InflationAnalysis[]> {
    const addressList = addresses.split(',');
    return this.tokenInflationService.compareTokens(chain, addressList);
  }

  @Get('inflation-rate/:chain/:address')
  async getInflationRate(
    @Param('chain') chain: string,
    @Param('address') address: string,
    @Query('period') period: string = '30',
  ): Promise<{ dailyRate: number; weeklyRate: number; monthlyRate: number; yearlyRate: number }> {
    return this.tokenInflationService.calculateInflationRate(chain, address, parseInt(period, 10));
  }
}
