import { Controller, Get, Param, Query, ParseIntPipe } from '@nestjs/common';
import { SmartAccountService } from './smart-account.service';

@Controller()
export class SmartAccountController {
  constructor(private readonly smartAccountService: SmartAccountService) {}

  @Get('stats')
  async getStats(@Query('chainId') chainId?: string) {
    const chainIdNum = chainId ? parseInt(chainId) : undefined;
    return this.smartAccountService.getStats(chainIdNum);
  }

  @Get('chain-status')
  async getChainStatus() {
    return this.smartAccountService.getChainStatus();
  }

  @Get('account/:address')
  async getSmartAccountInfo(
    @Param('address') address: string,
    @Query('chainId', ParseIntPipe) chainId: number,
  ) {
    return this.smartAccountService.getSmartAccountInfo(address, chainId);
  }

  @Get('account/:address/operations')
  async getUserOperations(
    @Param('address') address: string,
    @Query('chainId', ParseIntPipe) chainId: number,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    return this.smartAccountService.getUserOperations(
      address,
      chainId,
      parseInt(page),
      parseInt(limit),
    );
  }

  @Get('account/:address/analysis')
  async analyzeAccountUsage(
    @Param('address') address: string,
    @Query('chainId', ParseIntPipe) chainId: number,
  ) {
    return this.smartAccountService.analyzeAccountUsage(address, chainId);
  }

  @Get('bundlers')
  async getBundlers(
    @Query('chainId', ParseIntPipe) chainId: number,
    @Query('limit') limit: string = '10',
  ) {
    return this.smartAccountService.getBundlers(chainId, parseInt(limit));
  }

  @Get('paymasters')
  async getPaymasters(
    @Query('chainId', ParseIntPipe) chainId: number,
    @Query('limit') limit: string = '10',
  ) {
    return this.smartAccountService.getPaymasters(chainId, parseInt(limit));
  }
}
