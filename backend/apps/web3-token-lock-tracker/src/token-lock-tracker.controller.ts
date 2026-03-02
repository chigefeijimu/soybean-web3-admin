import { Controller, Get, Param, Query, NotFoundException } from '@nestjs/common';
import { TokenLockTrackerService, TokenLockInfo, LockStats } from './token-lock-tracker.service';

@Controller('token-lock')
export class TokenLockTrackerController {
  constructor(private readonly tokenLockService: TokenLockTrackerService) {}

  @Get('locks/:tokenAddress')
  async getTokenLocks(
    @Param('tokenAddress') tokenAddress: string,
    @Query('chain') chain: string = 'ethereum',
  ): Promise<TokenLockInfo[]> {
    try {
      return await this.tokenLockService.getTokenLocks(tokenAddress, chain);
    } catch (error) {
      throw new NotFoundException(error.message);
    }
  }

  @Get('stats')
  async getLockStats(@Query('chain') chain: string = 'ethereum'): Promise<LockStats> {
    return await this.tokenLockService.getLockStats(chain);
  }

  @Get('search')
  async searchLockedTokens(
    @Query('q') query: string,
    @Query('chain') chain: string = 'ethereum',
  ): Promise<TokenLockInfo[]> {
    return await this.tokenLockService.searchLockedTokens(query, chain);
  }

  @Get('top')
  async getTopLockedTokens(
    @Query('chain') chain: string = 'ethereum',
    @Query('limit') limit: number = 10,
  ): Promise<TokenLockInfo[]> {
    return await this.tokenLockService.getTopLockedTokens(chain, limit);
  }

  @Get('chains')
  getSupportedChains(): string[] {
    return this.tokenLockService.getSupportedChains();
  }
}
