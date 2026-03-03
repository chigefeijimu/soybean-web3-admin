import { Module } from '@nestjs/common';
import { GovernanceVotingAdvisorController } from './governance-voting-advisor.controller';
import { GovernanceVotingAdvisorService } from './governance-voting-advisor.service';

@Module({
  controllers: [GovernanceVotingAdvisorController],
  providers: [GovernanceVotingAdvisorService],
  exports: [GovernanceVotingAdvisorService],
})
export class GovernanceVotingAdvisorModule {}
