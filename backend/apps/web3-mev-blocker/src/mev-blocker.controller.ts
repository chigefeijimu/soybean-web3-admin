import { Controller, Get, Post, Body, Param, Query, Headers } from '@nestjs/common';
import { MevBlockerService, MEVProtectionRequest } from './mev-blocker.service';

@Controller()
export class MevBlockerController {
  constructor(private readonly mevBlockerService: MevBlockerService) {}

  @Get('health')
  getHealth() {
    return { status: 'ok', service: 'MEV Blocker API', timestamp: new Date().toISOString() };
  }

  @Get('chains')
  getSupportedChains() {
    return this.mevBlockerService.getAllChainsSupported();
  }

  @Get('relays/:chain')
  getRelays(@Param('chain') chain: string) {
    return this.mevBlockerService.getAvailableRelays(chain);
  }

  @Get('stats/:chain')
  getStats(@Param('chain') chain: string) {
    return this.mevBlockerService.getProtectionStats(chain);
  }

  @Post('submit')
  submitTransaction(
    @Body() request: MEVProtectionRequest,
    @Headers('x-user-id') userId?: string,
  ) {
    return this.mevBlockerService.submitProtectedTransaction(request);
  }

  @Get('status/:txId')
  getTransactionStatus(@Param('txId') txId: string) {
    return this.mevBlockerService.getTransactionStatus(txId);
  }

  @Get('history')
  getHistory(
    @Headers('x-user-id') userId: string,
    @Query('chain') chain?: string,
  ) {
    return this.mevBlockerService.getProtectionHistory(userId, chain);
  }

  @Post('cancel/:txId')
  cancelTransaction(@Param('txId') txId: string) {
    return this.mevBlockerService.cancelProtectedTransaction(txId);
  }

  @Post('simulate')
  simulateProtection(@Body() request: MEVProtectionRequest) {
    return this.mevBlockerService.simulateProtection(request);
  }

  @Get('fee/:chain')
  estimateFee(
    @Param('chain') chain: string,
    @Query('level') level: 'standard' | 'high' | 'maximum' = 'standard',
  ) {
    return this.mevBlockerService.estimateProtectionFee(chain, level);
  }

  @Get('detect-sandwich/:txHash')
  detectSandwich(
    @Param('txHash') txHash: string,
    @Query('chain') chain: string,
  ) {
    return this.mevBlockerService.detectSandwichAttack(txHash, chain);
  }

  @Get('privacy-analysis/:txHash')
  analyzePrivacy(
    @Param('txHash') txHash: string,
    @Query('chain') chain: string,
  ) {
    return this.mevBlockerService.analyzeTransactionPrivacy(txHash, chain);
  }
}
