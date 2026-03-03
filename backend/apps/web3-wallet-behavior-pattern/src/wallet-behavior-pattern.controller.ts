import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { WalletBehaviorPatternService } from './wallet-behavior-pattern.service';

@Controller('api/wallet-behavior')
export class WalletBehaviorPatternController {
  constructor(private readonly walletBehaviorService: WalletBehaviorPatternService) {}

  @Get('analyze')
  async analyze(
    @Query('address') address: string,
    @Query('chain') chain: string = 'ethereum',
  ) {
    if (!address) {
      return { error: 'Address is required' };
    }
    return this.walletBehaviorService.analyzeWalletBehavior(address, chain);
  }

  @Get('profile/:address')
  async getProfile(
    @Param('address') address: string,
    @Query('chain') chain: string = 'ethereum',
  ) {
    return this.walletBehaviorService.analyzeWalletBehavior(address, chain);
  }

  @Post('batch')
  async batchAnalyze(
    @Body() body: { addresses: string[]; chain?: string },
  ) {
    const { addresses, chain = 'ethereum' } = body;
    
    if (!addresses || !Array.isArray(addresses)) {
      return { error: 'addresses array is required' };
    }
    
    if (addresses.length > 10) {
      return { error: 'Maximum 10 addresses allowed per request' };
    }
    
    return this.walletBehaviorService.analyzeMultipleWallets(addresses, chain);
  }

  @Get('compare')
  async compare(
    @Query('address1') address1: string,
    @Query('address2') address2: string,
    @Query('chain') chain: string = 'ethereum',
  ) {
    if (!address1 || !address2) {
      return { error: 'Both address1 and address2 are required' };
    }
    
    return this.walletBehaviorService.compareWallets(address1, address2, chain);
  }

  @Get('health')
  health() {
    return { 
      status: 'ok', 
      service: 'wallet-behavior-pattern',
      timestamp: new Date().toISOString(),
    };
  }

  @Get()
  root() {
    return {
      name: 'Wallet Behavior Pattern Analysis API',
      version: '1.0.0',
      description: 'Analyze wallet behavioral patterns and classify wallets',
      endpoints: {
        analyze: 'GET /api/wallet-behavior/analyze?address=0x...&chain=ethereum',
        profile: 'GET /api/wallet-behavior/profile/:address?chain=ethereum',
        batch: 'POST /api/wallet-behavior/batch',
        compare: 'GET /api/wallet-behavior/compare?address1=0x...&address2=0x...&chain=ethereum',
        health: 'GET /api/wallet-behavior/health',
      },
      supportedChains: ['ethereum', 'polygon', 'arbitrum', 'optimism', 'bsc', 'base', 'avalanche'],
      behaviorPatterns: [
        'trader', 'hodler', 'defi_user', 'nft_trader', 'whale', 
        'bot', 'social_actor', 'yield_farmer', 'gambler', 'airdrop_hunter'
      ],
    };
  }
}
