import { Controller, Get, Post, Body, Param, Query, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { Web3MultisigHealthMonitorService } from './service/web3-multisig-health-monitor.service';

@Controller('web3/multisig-health')
export class Web3MultisigHealthMonitorController {
  constructor(private readonly service: Web3MultisigHealthMonitorService) {}

  @Get('health/:address')
  async getWalletHealth(
    @Param('address') address: string,
    @Query('chainId', new DefaultValuePipe(1), ParseIntPipe) chainId: number,
  ) {
    return this.service.getWalletHealth(address, chainId);
  }

  @Get('signers/:address')
  async getSignerRanking(
    @Param('address') address: string,
    @Query('chainId', new DefaultValuePipe(1), ParseIntPipe) chainId: number,
  ) {
    return this.service.getSignerRanking(address, chainId);
  }

  @Get('transactions/:address')
  async getWalletTransactions(
    @Param('address') address: string,
    @Query('chainId', new DefaultValuePipe(1), ParseIntPipe) chainId: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.service.getWalletTransactions(address, chainId, limit);
  }

  @Get('pending/:address')
  async getPendingTransactions(
    @Param('address') address: string,
    @Query('chainId', new DefaultValuePipe(1), ParseIntPipe) chainId: number,
  ) {
    return this.service.getPendingTransactions(address, chainId);
  }

  @Post('compare')
  async compareWallets(
    @Body() body: { addresses: string[]; chainId: number },
  ) {
    return this.service.compareWallets(body.addresses, body.chainId);
  }

  @Get('trends/:address')
  async getHealthTrends(
    @Param('address') address: string,
    @Query('chainId', new DefaultValuePipe(1), ParseIntPipe) chainId: number,
    @Query('days', new DefaultValuePipe(30), ParseIntPipe) days: number,
  ) {
    return this.service.getHealthTrends(address, chainId, days);
  }

  @Get('chains')
  getSupportedChains() {
    return this.service.getSupportedChains();
  }
}
