import { Module, Controller, Get, Query, Post, Body } from '@nestjs/common';
import { AppService } from './flashloan.service';

@Controller('flashloan-arbitrage')
class FlashloanController {
  constructor(private readonly appService: AppService) {}

  @Get('opportunities')
  getOpportunities(
    @Query('chain') chain?: string,
    @Query('minProfit') minProfit?: string,
    @Query('limit') limit?: string,
  ) {
    return this.appService.getOpportunities(
      chain,
      minProfit ? parseFloat(minProfit) : undefined,
      limit ? parseInt(limit) : 20,
    );
  }

  @Get('opportunities/:id')
  getOpportunity(@Query('id') id: string) {
    return this.appService.getOpportunity(id);
  }

  @Get('pools')
  getPools(
    @Query('chain') chain?: string,
    @Query('token') token?: string,
  ) {
    return this.appService.getPools(chain, token);
  }

  @Get('history')
  getHistory(
    @Query('chain') chain?: string,
    @Query('limit') limit?: string,
  ) {
    return this.appService.getHistory(
      chain,
      limit ? parseInt(limit) : 50,
    );
  }

  @Post('alerts')
  createAlert(@Body() body: any) {
    return this.appService.createAlert(body);
  }

  @Get('alerts')
  getAlerts(@Query('address') address?: string) {
    return this.appService.getAlerts(address);
  }

  @Get('stats')
  getStats(@Query('chain') chain?: string) {
    return this.appService.getStats(chain);
  }

  @Get('pairs')
  getPairs(@Query('chain') chain?: string) {
    return this.appService.getTradingPairs(chain);
  }
}

@Module({
  imports: [],
  controllers: [FlashloanController],
  providers: [AppService],
})
export class FlashloanModule {}
