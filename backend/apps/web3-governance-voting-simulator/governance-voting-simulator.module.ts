import { Module } from '@nestjs/common';
import { GovernanceVotingSimulatorController } from './governance-voting-simulator.controller';
import { GovernanceVotingSimulatorService } from './governance-voting-simulator.service';

@Module({
  controllers: [GovernanceVotingSimulatorController],
  providers: [GovernanceVotingSimulatorService],
  exports: [GovernanceVotingSimulatorService],
})
export class GovernanceVotingSimulatorModule {}
