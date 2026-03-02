import { Module } from '@nestjs/common';
import { PortfolioAlertApiController } from './portfolio-alert-api.controller';
import { PortfolioAlertApiService } from './portfolio-alert-api.service';

@Module({
  controllers: [PortfolioAlertApiController],
  providers: [PortfolioAlertApiService],
  exports: [PortfolioAlertApiService],
})
export class PortfolioAlertApiModule {}
