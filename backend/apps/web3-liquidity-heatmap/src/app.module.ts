import { Module } from '@nestjs/common';
import { LiquidityHeatmapController } from './liquidity-heatmap.controller';
import { LiquidityHeatmapService } from './liquidity-heatmap.service';

@Module({
  controllers: [LiquidityHeatmapController],
  providers: [LiquidityHeatmapService],
  exports: [LiquidityHeatmapService],
})
export class LiquidityHeatmapModule {}
