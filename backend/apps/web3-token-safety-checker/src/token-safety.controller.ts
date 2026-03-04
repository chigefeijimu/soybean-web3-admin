import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { TokenSafetyService } from './token-safety.service';

@Controller('token-safety')
export class TokenSafetyController {
  constructor(private readonly tokenSafetyService: TokenSafetyService) {}

  @Get('analyze')
  async analyzeToken(
    @Query('address') address: string,
    @Query('chain') chain: string = 'ethereum',
  ) {
    if (!address) {
      return { error: 'Address is required' };
    }
    return this.tokenSafetyService.analyzeToken(address, chain);
  }

  @Get('trending-scams')
  async getTrendingScams() {
    return this.tokenSafetyService.getTrendingScams();
  }

  @Get('safety-tips')
  async getSafetyTips() {
    return this.tokenSafetyService.getSafetyTips();
  }

  @Post('batch-analyze')
  async batchAnalyze(
    @Body() body: { addresses: string[]; chain?: string },
  ) {
    const { addresses, chain = 'ethereum' } = body;
    if (!addresses || addresses.length === 0) {
      return { error: 'Addresses array is required' };
    }
    
    const results = await Promise.all(
      addresses.map(addr => this.tokenSafetyService.analyzeToken(addr, chain))
    );
    
    return results;
  }

  @Get('health')
  health() {
    return { status: 'ok', service: 'Token Safety Checker' };
  }
}
