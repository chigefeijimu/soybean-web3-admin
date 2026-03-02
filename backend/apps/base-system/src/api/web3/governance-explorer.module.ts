import { Module } from '@nestjs/common';
import { GovernanceExplorerController } from './governance-explorer.controller';
import { GovernanceExplorerService } from './governance-explorer.service';

@Module({
  controllers: [GovernanceExplorerController],
  providers: [GovernanceExplorerService],
  exports: [GovernanceExplorerService],
})
export class GovernanceExplorerModule {}
