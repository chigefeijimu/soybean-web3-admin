import { Module } from '@nestjs/common';
import { GovernanceProposalImpactController } from './governance-proposal-impact.controller';
import { GovernanceProposalImpactService } from './governance-proposal-impact.service';

@Module({
  imports: [],
  controllers: [GovernanceProposalImpactController],
  providers: [GovernanceProposalImpactService],
  exports: [GovernanceProposalImpactService],
})
export class GovernanceProposalImpactModule {}
