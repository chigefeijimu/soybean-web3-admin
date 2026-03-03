import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { WalletReputationService } from './wallet-reputation.service';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';

@ApiTags('Wallet Reputation')
@Controller('web3/wallet-reputation')
export class WalletReputationController {
  constructor(private readonly walletReputationService: WalletReputationService) {}

  @Get('score/:address')
  @ApiOperation({ summary: 'Get wallet reputation score' })
  async getReputationScore(@Param('address') address: string) {
    return this.walletReputationService.calculateReputation(address);
  }

  @Get('batch')
  @ApiOperation({ summary: 'Batch get wallet reputation scores' })
  @ApiQuery({ name: 'addresses', required: true, description: 'Comma-separated addresses' })
  async batchGetReputation(@Query('addresses') addresses: string) {
    const addressList = addresses.split(',').map((a) => a.trim());
    return this.walletReputationService.batchCalculateReputation(addressList);
  }

  @Get('factors/:address')
  @ApiOperation({ summary: 'Get detailed reputation factors' })
  async getReputationFactors(@Param('address') address: string) {
    return this.walletReputationService.getDetailedFactors(address);
  }

  @Get('leaderboard')
  @ApiOperation({ summary: 'Get reputation leaderboard' })
  @ApiQuery({ name: 'chain', required: false, description: 'Chain name (ethereum/polygon/etc)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Limit results' })
  async getLeaderboard(
    @Query('chain') chain?: string,
    @Query('limit') limit: string = '10',
  ) {
    return this.walletReputationService.getLeaderboard(chain, parseInt(limit));
  }

  @Get('compare')
  @ApiOperation({ summary: 'Compare multiple wallets reputation' })
  @ApiQuery({ name: 'addresses', required: true, description: 'Comma-separated addresses' })
  async compareWallets(@Query('addresses') addresses: string) {
    const addressList = addresses.split(',').map((a) => a.trim());
    return this.walletReputationService.compareWallets(addressList);
  }
}
