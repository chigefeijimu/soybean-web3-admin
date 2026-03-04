import { Module } from '@nestjs/common';
import { GovernanceImpactAnalyzerController } from './governance-impact-analyzer.controller';
import { GovernanceImpactAnalyzerService } from './governance-impact-analyzer.service';

@Module({
  controllers: [GovernanceImpactAnalyzerController],
  providers: [GovernanceImpactAnalyzerService],
  exports: [GovernanceImpactAnalyzerService],
})
export class GovernanceImpactAnalyzerModule {}
