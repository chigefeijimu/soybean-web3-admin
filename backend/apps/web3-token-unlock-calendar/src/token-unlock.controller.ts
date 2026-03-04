import { Controller, Get, Param, Query } from '@nestjs/common';
import { TokenUnlockService, TokenUnlock, UnlockStats } from './token-unlock.service';

@Controller('token-unlock')
export class TokenUnlockController {
  constructor(private readonly tokenUnlockService: TokenUnlockService) {}

  @Get()
  getUnlocks(
    @Query('chain') chain?: string,
    @Query('category') category?: string,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): TokenUnlock[] {
    return this.tokenUnlockService.getUnlocks({
      chain,
      category,
      status,
      startDate,
      endDate,
    });
  }

  @Get('stats')
  getStats(): UnlockStats {
    return this.tokenUnlockService.getStats();
  }

  @Get('upcoming')
  getUpcoming(@Query('days') days?: string): TokenUnlock[] {
    return this.tokenUnlockService.getUpcoming(days ? parseInt(days) : 30);
  }

  @Get('chains')
  getChains(): string[] {
    return this.tokenUnlockService.getChains();
  }

  @Get('protocols')
  getProtocols(): string[] {
    return this.tokenUnlockService.getProtocols();
  }

  @Get(':id')
  getUnlockById(@Param('id') id: string): TokenUnlock | undefined {
    return this.tokenUnlockService.getUnlockById(id);
  }
}
