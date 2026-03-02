import { Module } from '@nestjs/common';
import { DefiGasEstimatorController } from './defi-gas-estimator.controller';
import { DefiGasEstimatorService } from './defi-gas-estimator.service';

@Module({
  imports: [],
  controllers: [DefiGasEstimatorController],
  providers: [DefiGasEstimatorService]
})
export class DefiGasEstimatorModule {}
