import { Module } from '@nestjs/common';
import { DefiTaxOptimizerController } from './defi-tax-optimizer.controller';
import { DefiTaxOptimizerService } from './defi-tax-optimizer.service';

@Module({
  controllers: [DefiTaxOptimizerController],
  providers: [DefiTaxOptimizerService],
  exports: [DefiTaxOptimizerService],
})
export class DefiTaxOptimizerModule {}
