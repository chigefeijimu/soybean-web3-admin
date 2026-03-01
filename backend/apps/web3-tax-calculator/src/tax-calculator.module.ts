import { Module } from '@nestjs/common';
import { TaxCalculatorController } from './tax-calculator.controller';
import { TaxCalculatorService } from './tax-calculator.service';
import { TaxLossHarvesterController } from './tax-loss-harvester.controller';
import { TaxLossHarvesterService } from './tax-loss-harvester.service';

@Module({
  controllers: [TaxCalculatorController, TaxLossHarvesterController],
  providers: [TaxCalculatorService, TaxLossHarvesterService],
  exports: [TaxCalculatorService, TaxLossHarvesterService],
})
export class TaxCalculatorModule {}
