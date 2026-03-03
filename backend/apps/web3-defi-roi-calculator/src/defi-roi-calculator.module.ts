import { Module } from '@nestjs/common';
import { DefiRoiCalculatorController } from './defi-roi-calculator.controller';
import { DefiRoiCalculatorService } from './defi-roi-calculator.service';

@Module({
  controllers: [DefiRoiCalculatorController],
  providers: [DefiRoiCalculatorService],
  exports: [DefiRoiCalculatorService],
})
export class DefiRoiCalculatorModule {}
