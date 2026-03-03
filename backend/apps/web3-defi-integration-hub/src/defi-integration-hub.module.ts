import { Module } from '@nestjs/common';
import { DefiIntegrationHubController } from './controllers/defi-integration-hub.controller';
import { DefiIntegrationHubService } from './services/defi-integration-hub.service';

@Module({
  controllers: [DefiIntegrationHubController],
  providers: [DefiIntegrationHubService],
  exports: [DefiIntegrationHubService],
})
export class DefiIntegrationHubModule {}
