import { Module } from '@nestjs/common';
import { StakingValidatorPerformanceController } from './staking-validator-performance.controller';
import { StakingValidatorPerformanceService } from './staking-validator-performance.service';

@Module({
  controllers: [StakingValidatorPerformanceController],
  providers: [StakingValidatorPerformanceService],
  exports: [StakingValidatorPerformanceService],
})
export class StakingValidatorPerformanceModule {}
