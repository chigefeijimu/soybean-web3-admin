import { Module } from '@nestjs/common';
import { NftHealthScoreController } from './nft-health-score.controller';
import { NftHealthScoreService } from './nft-health-score.service';

@Module({
  imports: [],
  controllers: [NftHealthScoreController],
  providers: [NftHealthScoreService],
  exports: [NftHealthScoreService],
})
export class NftHealthScoreModule {}
