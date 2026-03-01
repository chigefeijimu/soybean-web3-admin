import { Controller, Get, Query } from '@nestjs/common';
import { AppService } from './app.service';

@Controller('web3/wallet-analyzer')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('analyze')
  async analyzeWallet(@Query('address') address: string) {
    return this.appService.analyzeWallet(address);
  }

  @Get('patterns')
  async getPatterns(@Query('address') address: string) {
    return this.appService.getTransactionPatterns(address);
  }

  @Get('behavior')
  async getBehavior(@Query('address') address: string) {
    return this.appService.getWalletBehavior(address);
  }

  @Get('classification')
  async classifyWallet(@Query('address') address: string) {
    return this.appService.classifyWallet(address);
  }
}
