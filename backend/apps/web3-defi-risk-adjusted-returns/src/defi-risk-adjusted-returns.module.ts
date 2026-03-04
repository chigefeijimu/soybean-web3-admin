import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { DefiRiskAdjustedReturnsController } from './controller/defi-risk-adjusted-returns.controller';
import { DefiRiskAdjustedReturnsService } from './service/defi-risk-adjusted-returns.service';

@Module({
  imports: [HttpModule],
  controllers: [DefiRiskAdjustedReturnsController],
  providers: [DefiRiskAdjustedReturnsService],
  exports: [DefiRiskAdjustedReturnsService],
})
export class DefiRiskAdjustedReturnsModule {}
