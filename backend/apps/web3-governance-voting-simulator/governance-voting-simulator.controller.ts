import { Controller, Get, Post, Param, Query, Body } from '@nestjs/common';
import { GovernanceVotingSimulatorService } from './governance-voting-simulator.service';

@Controller('governance-voting-simulator')
export class GovernanceVotingSimulatorController {
  constructor(
    private readonly governanceVotingSimulatorService: GovernanceVotingSimulatorService,
  ) {}

  @Get('daos')
  getSupportedDAOs() {
    return this.governanceVotingSimulatorService.getSupportedDAOs();
  }

  @Get('proposals')
  getProposals(
    @Query('dao') dao?: string,
    @Query('status') status?: string,
  ) {
    return this.governanceVotingSimulatorService.getProposals(dao, status);
  }

  @Get('proposals/:id')
  getProposalById(@Param('id') id: string) {
    return this.governanceVotingSimulatorService.getProposalById(id);
  }

  @Get('scenarios')
  getVotingScenarios() {
    return this.governanceVotingSimulatorService.getVotingScenarios();
  }

  @Post('simulate/:proposalId')
  simulateVoting(
    @Param('proposalId') proposalId: string,
    @Body('scenarioId') scenarioId: string,
  ) {
    return this.governanceVotingSimulatorService.simulateVoting(
      proposalId,
      scenarioId || 'scenario-realistic',
    );
  }

  @Get('voting-power/:proposalId')
  getVotingPowerAnalysis(@Param('proposalId') proposalId: string) {
    return this.governanceVotingSimulatorService.getVotingPowerAnalysis(proposalId);
  }

  @Get('delegates/:dao')
  getTopDelegates(
    @Param('dao') dao: string,
    @Query('limit') limit?: string,
  ) {
    return this.governanceVotingSimulatorService.getTopDelegates(
      dao,
      limit ? parseInt(limit, 10) : 10,
    );
  }

  @Get('voting-history/:address')
  getVotingHistory(
    @Param('address') address: string,
    @Query('dao') dao?: string,
  ) {
    return this.governanceVotingSimulatorService.getVotingHistory(address, dao);
  }

  @Get('trends')
  getProposalTrends(@Query('dao') dao?: string) {
    return this.governanceVotingSimulatorService.getProposalTrends(dao);
  }

  @Post('impact/:proposalId')
  calculateVoteImpact(
    @Param('proposalId') proposalId: string,
    @Body() body: { additionalVotes: number; voteType: 'for' | 'against' },
  ) {
    return this.governanceVotingSimulatorService.calculateVoteImpact(
      proposalId,
      body.additionalVotes,
      body.voteType,
    );
  }
}
