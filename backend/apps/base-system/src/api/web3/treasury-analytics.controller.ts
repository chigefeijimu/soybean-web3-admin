import { Controller, Get, Param, Query, NotFoundException } from '@nestjs/common';
import { TreasuryAnalyticsService } from './treasury-analytics.service';

@Controller('web3/treasury-analytics')
export class TreasuryAnalyticsController {
  constructor(private readonly treasuryService: TreasuryAnalyticsService) {}

  @Get('overview/:dao')
  async getTreasuryOverview(@Param('dao') dao: string) {
    try {
      return await this.treasuryService.getTreasuryOverview(dao);
    } catch (e) {
      throw new NotFoundException(`DAO ${dao} not found`);
    }
  }

  @Get('list')
  async getAllTreasuries() {
    return await this.treasuryService.getAllTreasuries();
  }

  @Get('history/:dao')
  async getTreasuryHistory(
    @Param('dao') dao: string,
    @Query('days') days: string = '30',
  ) {
    try {
      return await this.treasuryService.getTreasuryHistory(dao, parseInt(days));
    } catch (e) {
      throw new NotFoundException(`DAO ${dao} not found`);
    }
  }

  @Get('flows/:dao')
  async getTreasuryFlows(
    @Param('dao') dao: string,
    @Query('days') days: string = '7',
  ) {
    try {
      return await this.treasuryService.getTreasuryFlows(dao, parseInt(days));
    } catch (e) {
      throw new NotFoundException(`DAO ${dao} not found`);
    }
  }

  @Get('allocation/:dao')
  async getAssetAllocation(@Param('dao') dao: string) {
    try {
      return await this.treasuryService.getAssetAllocation(dao);
    } catch (e) {
      throw new NotFoundException(`DAO ${dao} not found`);
    }
  }

  @Get('compare')
  async compareTreasuries(@Query('daos') daos: string) {
    const daoList = daos ? daos.split(',') : ['Uniswap', 'Aave', 'MakerDAO'];
    return await this.treasuryService.compareTreasuries(daoList);
  }

  @Get('alerts/:dao')
  async getTreasuryAlerts(@Param('dao') dao: string) {
    try {
      return await this.treasuryService.getTreasuryAlerts(dao);
    } catch (e) {
      throw new NotFoundException(`DAO ${dao} not found`);
    }
  }

  @Get('supported-daos')
  async getSupportedDaos() {
    return {
      daos: [
        { name: 'Uniswap', chain: 'ethereum', description: 'Uniswap DAO Treasury' },
        { name: 'Aave', chain: 'ethereum', description: 'Aave DAO Treasury' },
        { name: 'MakerDAO', chain: 'ethereum', description: 'MakerDAO Treasury' },
        { name: 'Compound', chain: 'ethereum', description: 'Compound DAO Treasury' },
        { name: 'Curve', chain: 'ethereum', description: 'Curve DAO Treasury' },
        { name: 'Lido', chain: 'ethereum', description: 'Lido DAO Treasury' },
        { name: 'ENS', chain: 'ethereum', description: 'ENS DAO Treasury' },
        { name: 'Balancer', chain: 'ethereum', description: 'Balancer DAO Treasury' },
      ],
      chains: ['ethereum', 'polygon', 'arbitrum', 'optimism', 'avalanche', 'bsc', 'base'],
    };
  }
}
