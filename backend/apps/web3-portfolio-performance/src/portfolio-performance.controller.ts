import { Controller, Get, Query, Logger } from '@nestjs/common';
import { PortfolioPerformanceService } from './portfolio-performance.service';

@Controller('web3/portfolio-performance')
export class PortfolioPerformanceController {
  private readonly logger = new Logger(PortfolioPerformanceController.name);

  constructor(private readonly portfolioService: PortfolioPerformanceService) {}

  @Get('portfolio')
  async getPortfolio(
    @Query('address') address: string,
    @Query('chainId') chainId: string,
  ) {
    if (!address) {
      return { error: 'Address is required' };
    }
    
    const chainIdNum = chainId ? parseInt(chainId, 10) : 1;
    return this.portfolioService.getPortfolioPerformance(address, chainIdNum);
  }

  @Get('compare')
  async compareWallets(
    @Query('addresses') addresses: string,
    @Query('chainId') chainId: string,
  ) {
    if (!addresses) {
      return { error: 'Addresses are required (comma-separated)' };
    }
    
    const addressList = addresses.split(',').map(a => a.trim());
    const chainIdNum = chainId ? parseInt(chainId, 10) : 1;
    
    return this.portfolioService.compareWallets(addressList, chainIdNum);
  }

  @Get('history')
  async getHistory(
    @Query('address') address: string,
    @Query('chainId') chainId: string,
    @Query('days') days: string,
  ) {
    if (!address) {
      return { error: 'Address is required' };
    }
    
    const chainIdNum = chainId ? parseInt(chainId, 10) : 1;
    const { history } = await this.portfolioService.getPortfolioPerformance(address, chainIdNum);
    
    const daysNum = days ? parseInt(days, 10) : 30;
    return history.slice(-daysNum);
  }
}
