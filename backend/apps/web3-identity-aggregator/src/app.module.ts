import { Module } from '@nestjs/common';
import { IdentityAggregatorController } from './identity-aggregator.controller';
import { IdentityAggregatorService } from './identity-aggregator.service';

@Module({
  controllers: [IdentityAggregatorController],
  providers: [IdentityAggregatorService],
  exports: [IdentityAggregatorService],
})
export class IdentityAggregatorModule {}
