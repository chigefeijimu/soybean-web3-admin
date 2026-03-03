import { Controller, Get, Post, Delete, Query, Param, Body } from '@nestjs/common';
import { TokenLaunchScannerService, TokenLaunch, WatchlistItem } from './token-launch-scanner.service';

@Controller('web3/token-launch-scanner')
export class TokenLaunchScannerController {
  constructor(private readonly scannerService: TokenLaunchScannerService) {}

  @Get('launches')
  async getRecentLaunches(
    @Query('chainId') chainId?: string,
    @Query('limit') limit?: string,
    @Query('suspicious') suspicious?: string
  ): Promise<TokenLaunch[]> {
    const chainIdNum = chainId ? parseInt(chainId) : undefined;
    const limitNum = limit ? parseInt(limit) : 20;
    const suspiciousFlag = suspicious ? suspicious === 'true' : undefined;
    
    return this.scannerService.getRecentLaunches(chainIdNum, limitNum, suspiciousFlag);
  }

  @Get('launches/:address')
  async getLaunchDetails(
    @Param('address') address: string,
    @Query('chainId') chainId: string
  ): Promise<TokenLaunch | null> {
    return this.scannerService.getLaunchDetails(address, parseInt(chainId));
  }

  @Get('stats')
  async getLaunchStats(@Query('chainId') chainId?: string): Promise<any[]> {
    const chainIdNum = chainId ? parseInt(chainId) : undefined;
    return this.scannerService.getLaunchStats(chainIdNum);
  }

  @Get('trending')
  async getTrendingLaunches(
    @Query('chainId') chainId?: string,
    @Query('limit') limit?: string
  ): Promise<TokenLaunch[]> {
    const chainIdNum = chainId ? parseInt(chainId) : undefined;
    const limitNum = limit ? parseInt(limit) : 10;
    return this.scannerService.getTrendingLaunches(chainIdNum, limitNum);
  }

  @Get('suspicious')
  async getSuspiciousLaunches(
    @Query('chainId') chainId?: string,
    @Query('limit') limit?: string
  ): Promise<TokenLaunch[]> {
    const chainIdNum = chainId ? parseInt(chainId) : undefined;
    const limitNum = limit ? parseInt(limit) : 20;
    return this.scannerService.getSuspiciousLaunches(chainIdNum, limitNum);
  }

  @Get('analyze/:address')
  async analyzeTokenRisks(
    @Param('address') address: string,
    @Query('chainId') chainId: string
  ): Promise<any> {
    return this.scannerService.analyzeTokenRisks(address, parseInt(chainId));
  }

  @Post('watchlist')
  async addToWatchlist(@Body() item: { address: string; name: string; notes?: string }): Promise<WatchlistItem> {
    return this.scannerService.addToWatchlist(item);
  }

  @Delete('watchlist/:id')
  async removeFromWatchlist(@Param('id') id: string): Promise<{ success: boolean }> {
    const success = await this.scannerService.removeFromWatchlist(id);
    return { success };
  }

  @Get('watchlist')
  async getWatchlist(): Promise<WatchlistItem[]> {
    return this.scannerService.getWatchlist();
  }
}
