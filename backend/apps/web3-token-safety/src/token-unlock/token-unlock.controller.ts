import { Controller, Get, Param, Query } from '@nestjs/common';
import { TokenUnlockService } from './token-unlock.service';

@Controller('token-unlock')
export class TokenUnlockController {
  constructor(private readonly tokenUnlockService: TokenUnlockService) {}

  @Get('list')
  async getUpcomingUnlocks(
    @Query('days') days: string = '30',
    @Query('chain') chain: string = 'ethereum',
  ) {
    return this.tokenUnlockService.getUpcomingUnlocks(parseInt(days), chain);
  }

  @Get('token/:address')
  async getTokenUnlocks(
    @Param('address') address: string,
    @Query('chain') chain: string = 'ethereum',
  ) {
    return this.tokenUnlockService.getTokenUnlocks(address, chain);
  }

  @Get('calendar')
  async getCalendarView(
    @Query('months') months: string = '6',
    @Query('chain') chain: string = 'ethereum',
  ) {
    return this.tokenUnlockService.getCalendarView(parseInt(months), chain);
  }

  @Get('stats')
  async getUnlockStats(@Query('chain') chain: string = 'ethereum') {
    return this.tokenUnlockService.getUnlockStats(chain);
  }

  @Get('search')
  async searchTokens(@Query('q') query: string) {
    return this.tokenUnlockService.searchTokens(query);
  }
}
