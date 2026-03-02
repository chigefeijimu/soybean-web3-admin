import { Controller, Get, Param, Query } from '@nestjs/common';
import { TokenEconomicsService } from './token-economics.service';

@Controller('token-economics')
export class TokenEconomicsController {
  constructor(private readonly tokenEconomicsService: TokenEconomicsService) {}

  @Get('analyze/:address')
  async analyzeToken(
    @Param('address') address: string,
    @Query('chain') chain: string = 'ethereum',
  ) {
    return this.tokenEconomicsService.getTokenEconomics(address, chain);
  }

  @Get('popular')
  async getPopularTokens() {
    return this.tokenEconomicsService.getPopularTokens();
  }

  @Get('list')
  async getTokenList(@Query('chain') chain: string = 'ethereum') {
    return this.tokenEconomicsService.getTokenList(chain);
  }
}
