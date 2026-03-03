import { Module } from '@nestjs/common';
import { DefiRiskCalculatorController } from './defi-risk-calculator.controller';
import { DefiRiskCalculatorService } from './defi-risk-calculator.service';

@Module({
  controllers: [DefiRiskCalculatorController],
  providers: [DefiRiskCalculatorService],
  exports: [DefiRiskCalculatorService],
})
export class DefiRiskCalculatorModule {}
