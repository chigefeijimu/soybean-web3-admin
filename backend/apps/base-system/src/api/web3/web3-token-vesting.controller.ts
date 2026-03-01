import { Controller, Get, Post, Body, Param, Query, DefaultValuePipe, ParseIntPipe } from '@nestjs/common';
import { TokenVestingService, VestingSchedule, VestingInfo, TokenVestingStats } from './web3-token-vesting.service';

@Controller('api/web3/token-vesting')
export class TokenVestingController {
  constructor(private readonly tokenVestingService: TokenVestingService) {}

  @Get('address/:address')
  async getVestingByAddress(
    @Param('address') address: string,
    @Query('chainId', new DefaultValuePipe(1), ParseIntPipe) chainId: number,
  ): Promise<VestingInfo> {
    return this.tokenVestingService.getVestingByAddress(chainId, address);
  }

  @Get('schedule/:scheduleId')
  async getVestingSchedule(
    @Param('scheduleId') scheduleId: string,
    @Query('chainId', new DefaultValuePipe(1), ParseIntPipe) chainId: number,
  ): Promise<VestingSchedule | null> {
    return this.tokenVestingService.getVestingSchedule(chainId, scheduleId);
  }

  @Get('popular')
  async getPopularVestingContracts(
    @Query('chainId', new DefaultValuePipe(1), ParseIntPipe) chainId: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ): Promise<VestingSchedule[]> {
    return this.tokenVestingService.getPopularVestingContracts(chainId, limit);
  }

  @Get('upcoming')
  async getUpcomingUnlocks(
    @Query('chainId', new DefaultValuePipe(1), ParseIntPipe) chainId: number,
    @Query('days', new DefaultValuePipe(7), ParseIntPipe) days: number,
  ): Promise<VestingSchedule[]> {
    return this.tokenVestingService.getUpcomingUnlocks(chainId, days);
  }

  @Get('stats')
  async getVestingStats(
    @Query('chainId') chainId?: number,
  ): Promise<TokenVestingStats> {
    return this.tokenVestingService.getVestingStats(chainId);
  }

  @Get('token/:tokenAddress')
  async searchByToken(
    @Param('tokenAddress') tokenAddress: string,
    @Query('chainId', new DefaultValuePipe(1), ParseIntPipe) chainId: number,
  ): Promise<VestingSchedule[]> {
    return this.tokenVestingService.searchVestingByToken(chainId, tokenAddress);
  }

  @Get('chains')
  getSupportedChains() {
    return [
      { chainId: 1, name: 'Ethereum', symbol: 'ETH' },
      { chainId: 56, name: 'BNB Chain', symbol: 'BNB' },
      { chainId: 137, name: 'Polygon', symbol: 'MATIC' },
      { chainId: 42161, name: 'Arbitrum', symbol: 'ARB' },
      { chainId: 10, name: 'Optimism', symbol: 'OP' },
      { chainId: 8453, name: 'Base', symbol: 'BASE' },
    ];
  }
}
