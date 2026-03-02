import { Module } from '@nestjs/common';
import { DefiRewardOptimizerController } from './defi-reward-optimizer.controller';
import { DefiRewardOptimizerService } from './defi-reward-optimizer.service';

@Module({
  controllers: [DefiRewardOptimizerController],
  providers: [DefiRewardOptimizerService],
})
export class DefiRewardOptimizerModule {}
