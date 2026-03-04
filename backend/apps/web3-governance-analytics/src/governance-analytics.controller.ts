import { Controller, Get, Param, Query } from '@nestjs/common';
import { GovernanceAnalyticsService } from './governance-analytics.service';

@Controller('governance-analytics')
export class GovernanceAnalyticsController {
  constructor(
    private readonly governanceAnalyticsService: GovernanceAnalyticsService,
  ) {}

  @Get('daos')
  async getDAOsByChain(@Query('chain') chain?: string) {
    return this.governanceAnalyticsService.getDAOsByChain(chain);
  }

  @Get('dao/:name')
  async getDAOStats(@Param('name') name: string) {
    return this.governanceAnalyticsService.getDAOStats(name);
  }

  @Get('delegates/:dao')
  async getDelegates(
    @Param('dao') dao: string,
    @Query('address') address?: string,
  ) {
    return this.governanceAnalyticsService.getDelegatePerformance(dao, address);
  }

  @Get('voting-power/:address')
  async getVotingPower(@Param('address') address: string) {
    return this.governanceAnalyticsService.getVotingPowerAnalysis(address);
  }

  @Get('participation')
  async getParticipation() {
    return this.governanceAnalyticsService.getGovernanceParticipation();
  }

  @Get('cross-chain')
  async getCrossChainStats() {
    return this.governanceAnalyticsService.getCrossChainGovernanceStats();
  }

  @Get('alerts')
  async getAlerts(@Query('dao') dao?: string) {
    return this.governanceAnalyticsService.getGovernanceAlerts(dao);
  }

  @Get('health')
  async health() {
    return { status: 'ok', service: 'Governance Analytics API' };
  }
}
