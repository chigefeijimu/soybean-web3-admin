import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { GovernanceProposalImpactService, ProposalImpact, DaoProposalQuery } from './governance-proposal-impact.service';

@Controller('governance-proposal-impact')
export class GovernanceProposalImpactController {
  constructor(private readonly governanceService: GovernanceProposalImpactService) {}

  @Get('daos')
  async getSupportedDaos() {
    return this.governanceService.getDaos();
  }

  @Get('proposals')
  async getProposals(
    @Query('dao') dao?: string,
    @Query('chain') chain?: string,
    @Query('status') status?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string
  ) {
    const query: DaoProposalQuery = {
      dao,
      chain,
      status,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined
    };
    return this.governanceService.getProposals(query);
  }

  @Get('proposals/:id')
  async getProposalDetails(
    @Param('id') proposalId: string,
    @Query('dao') dao?: string
  ) {
    return this.governanceService.analyzeProposal(proposalId, dao);
  }

  @Post('analyze')
  async analyzeProposal(@Body() body: { proposalId: string; dao?: string }) {
    return this.governanceService.analyzeProposal(body.proposalId, body.dao);
  }

  @Post('compare')
  async compareProposals(@Body() body: { proposalIds: string[]; dao: string }) {
    return this.governanceService.compareProposals(body.proposalIds, body.dao);
  }

  @Get('historical/:dao')
  async getHistoricalAnalysis(
    @Param('dao') dao: string,
    @Query('days') days?: string
  ) {
    return this.governanceService.getHistoricalAnalysis(dao, days ? parseInt(days) : undefined);
  }

  @Get('health')
  async healthCheck() {
    return {
      status: 'ok',
      service: 'Governance Proposal Impact Analyzer',
      timestamp: new Date().toISOString(),
      supportedDAOs: 20,
      supportedChains: 7
    };
  }
}
