import { Module } from '@nestjs/common';
import { DefiInsuranceController } from './defi-insurance.controller';
import { DefiInsuranceService } from './defi-insurance.service';

@Module({
  controllers: [DefiInsuranceController],
  providers: [DefiInsuranceService],
  exports: [DefiInsuranceService],
})
export class DefiInsuranceModule {}
