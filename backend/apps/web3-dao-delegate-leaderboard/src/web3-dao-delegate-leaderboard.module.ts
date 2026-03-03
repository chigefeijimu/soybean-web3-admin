import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { DaoDelegateLeaderboardController } from './controllers/dao-delegate-leaderboard.controller';
import { DaoDelegateLeaderboardService } from './services/dao-delegate-leaderboard.service';

@Module({
  imports: [HttpModule],
  controllers: [DaoDelegateLeaderboardController],
  providers: [DaoDelegateLeaderboardService],
  exports: [DaoDelegateLeaderboardService],
})
export class Web3DaoDelegateLeaderboardModule {}
