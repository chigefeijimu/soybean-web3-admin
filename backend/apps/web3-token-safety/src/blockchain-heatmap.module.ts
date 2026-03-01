import { Module } from '@nestjs/common';
import { BlockchainHeatmapController } from './blockchain-heatmap.controller';
import { BlockchainHeatmapService } from './blockchain-heatmap.service';

@Module({
  controllers: [BlockchainHeatmapController],
  providers: [BlockchainHeatmapService],
  exports: [BlockchainHeatmapService],
})
export class BlockchainHeatmapModule {}
