import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { GovernanceAnalyticsService } from './governance-analytics.service';

@Controller('governance-analytics')
export class GovernanceAnalyticsController {
  constructor(private readonly governanceService: GovernanceAnalyticsService) {}

  @Get('dashboard')
  async getDashboardMetrics() {
    return this.governanceService.getDashboardMetrics();
  }

  @Get('daos')
  async getDAOList(
    @Query('chain') chain?: string,
    @Query('sortBy') sortBy?: string,
  ) {
    return this.governanceService.getDAOList(chain, sortBy);
  }

  @Get('daos/search')
  async searchDAOs(@Query('q') query: string) {
    return this.governanceService.searchDAOs(query);
  }

  @Get('daos/:daoId')
  async getDAODetails(@Param('daoId') daoId: string) {
    return this.governanceService.getDAODetails(daoId);
  }

  @Get('daos/:daoId/proposals')
  async getDAOProposals(
    @Param('daoId') daoId: string,
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ) {
    return this.governanceService.getDAOProposals(
      daoId,
      status,
      category,
      page || 1,
      pageSize || 20,
    );
  }

  @Get('daos/:daoId/delegates')
  async getDAODelegates(
    @Param('daoId') daoId: string,
    @Query('sortBy') sortBy?: string,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ) {
    return this.governanceService.getDAODelegates(
      daoId,
      sortBy,
      page || 1,
      pageSize || 20,
    );
  }

  @Get('daos/:daoId/proposals/:proposalId')
  async getProposalDetails(
    @Param('daoId') daoId: string,
    @Param('proposalId') proposalId: string,
  ) {
    return this.governanceService.getProposalDetails(daoId, proposalId);
  }

  @Get('daos/:daoId/delegates/:delegateAddress')
  async getDelegateDetails(
    @Param('daoId') daoId: string,
    @Param('delegateAddress') delegateAddress: string,
  ) {
    return this.governanceService.getDelegateDetails(daoId, delegateAddress);
  }

  @Get('stats')
  async getGovernanceStats(@Query('daoId') daoId?: string) {
    return this.governanceService.getGovernanceStats(daoId);
  }
}
