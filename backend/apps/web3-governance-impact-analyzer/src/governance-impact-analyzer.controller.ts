import { Controller, Get, Param, Query } from '@nestjs/common';
import { GovernanceImpactAnalyzerService } from './governance-impact-analyzer.service';

@Controller('governance-impact-analyzer')
export class GovernanceImpactAnalyzerController {
  constructor(private readonly service: GovernanceImpactAnalyzerService) {}

  @Get('stats')
  getAggregatedStats() {
    return this.service.getAggregatedStats();
  }

  @Get('proposals')
  getProposalImpacts(
    @Query('dao') dao?: string,
    @Query('status') status?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.getProposalImpacts(
      dao,
      status,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Get('proposals/:id')
  getProposalImpactDetails(@Param('id') id: string) {
    return this.service.getProposalImpactDetails(id);
  }

  @Get('dao/:daoId')
  getDaoImpactSummary(@Param('daoId') daoId: string) {
    return this.service.getDaoImpactSummary(daoId);
  }

  @Get('compare')
  getImpactComparison(@Query('ids') ids: string) {
    const proposalIds = ids.split(',');
    return this.service.getImpactComparison(proposalIds);
  }

  @Get('simulate/:id')
  simulateScenario(
    @Param('id') id: string,
    @Query('scenario') scenario: 'optimistic' | 'realistic' | 'pessimistic' = 'realistic',
  ) {
    return this.service.simulateScenario(id, scenario);
  }
}
