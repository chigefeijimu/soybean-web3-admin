import { Module } from '@nestjs/common';
import { LiquidationAlertApiController } from './liquidation-alert-api.controller';
import { LiquidationAlertApiService } from './liquidation-alert-api.service';

@Module({
  imports: [],
  controllers: [LiquidationAlertApiController],
  providers: [LiquidationAlertApiService],
})
export class LiquidationAlertApiModule {}
