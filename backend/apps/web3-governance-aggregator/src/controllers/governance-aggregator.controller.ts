import { Controller, Get, Post, Query, Param } from '@nestjs/common';
import { GovernanceAggregatorService } from './services/governance-aggregator.service';

@Controller('governance-aggregator')
export class GovernanceAggregatorController {
  constructor(private readonly service: GovernanceAggregatorService) {}

  @Get('overview')
  async getOverview() {
    return this.service.getOverview();
  }

  @Get('proposals')
  async getProposals(
    @Query('chain') chain?: string,
    @Query('dao') dao?: string,
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.service.getProposals({
      chain,
      dao,
      status,
      category,
      limit: limit || 20,
      offset: offset || 0,
    });
  }

  @Get('proposals/:id')
  async getProposalDetails(@Param('id') id: number) {
    return this.service.getProposalDetails(id);
  }

  @Get('delegates')
  async getDelegates(
    @Query('chain') chain?: string,
    @Query('dao') dao?: string,
    @Query('sortBy') sortBy?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.service.getDelegates({
      chain,
      dao,
      sortBy,
      limit: limit || 20,
      offset: offset || 0,
    });
  }

  @Get('delegates/:address')
  async getDelegateDetails(
    @Param('address') address: string,
    @Query('chain') chain?: string,
  ) {
    return this.service.getDelegateDetails(address, chain);
  }

  @Get('daos')
  async getSupportedDaos() {
    return this.service.getSupportedDaos();
  }

  @Get('stats/:chain')
  async getChainStats(@Param('chain') chain: string) {
    return this.service.getChainStats(chain);
  }

  @Get('search')
  async searchProposals(@Query('q') query: string) {
    return this.service.searchProposals(query);
  }

  @Get('trending')
  async getTrendingProposals(@Query('limit') limit?: number) {
    return this.service.getTrendingProposals(limit || 10);
  }

  @Get('upcoming')
  async getUpcomingProposals(@Query('limit') limit?: number) {
    return this.service.getUpcomingProposals(limit || 10);
  }

  @Get('recent')
  async getRecentProposals(@Query('limit') limit?: number) {
    return this.service.getRecentProposals(limit || 10);
  }

  @Post('generate-mock-data')
  async generateMockData() {
    return this.service.generateMockData();
  }
}
