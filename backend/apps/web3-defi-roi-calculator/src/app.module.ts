import { Module } from '@nestjs/common';
import { DefiRoiCalculatorModule } from './defi-roi-calculator.module';
import { DefiRoiCalculatorController } from './defi-roi-calculator.controller';
import { DefiRoiCalculatorService } from './defi-roi-calculator.service';

@Module({
  imports: [DefiRoiCalculatorModule],
  controllers: [DefiRoiCalculatorController],
  providers: [DefiRoiCalculatorService],
})
export class AppModule {}
