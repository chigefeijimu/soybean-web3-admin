import { Controller, Get, Post, Query, Body } from '@nestjs/common';
import { TokenInsiderTrackerService, InsiderWallet, InsiderTransaction } from './token-insider-tracker.service';

interface GetInsiderDataDto {
  tokenAddress: string;
  chainId?: number;
}

interface SearchInsiderDto {
  query: string;
  chainId?: number;
}

interface GetInsiderTransactionsDto {
  tokenAddress?: string;
  address?: string;
  chainId?: number;
  startTime?: number;
  endTime?: number;
  limit?: number;
}

interface TrackInsiderDto {
  address: string;
  label: string;
  type: 'founder' | 'team' | 'investor' | 'advisor' | 'exchange';
  chainId?: number;
}

@Controller('web3/token-insider-tracker')
export class TokenInsiderTrackerController {
  constructor(private readonly tokenInsiderTrackerService: TokenInsiderTrackerService) {}

  @Get('token-data')
  async getTokenInsiderData(@Query() dto: GetInsiderDataDto) {
    return this.tokenInsiderTrackerService.getTokenInsiderData(dto);
  }

  @Get('search')
  async searchInsiders(@Query() dto: SearchInsiderDto) {
    return this.tokenInsiderTrackerService.searchInsiders(dto);
  }

  @Get('transactions')
  async getInsiderTransactions(@Query() dto: GetInsiderTransactionsDto) {
    return this.tokenInsiderTrackerService.getInsiderTransactions(dto);
  }

  @Post('track')
  async trackNewInsider(@Body() dto: TrackInsiderDto) {
    return this.tokenInsiderTrackerService.trackNewInsider(
      dto.address,
      dto.label,
      dto.type,
      dto.chainId || 1,
    );
  }

  @Get('top-tokens')
  async getTopInsiderTokens(@Query('chainId') chainId: number = 1) {
    return this.tokenInsiderTrackerService.getTopInsiderTokens(chainId);
  }

  @Get('health')
  health() {
    return { status: 'ok', service: 'TokenInsiderTracker' };
  }
}
