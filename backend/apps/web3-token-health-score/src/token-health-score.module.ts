import { Module } from '@nestjs/common';
import { TokenHealthScoreController } from './token-health-score.controller';
import { TokenHealthScoreService } from './token-health-score.service';

@Module({
  imports: [],
  controllers: [TokenHealthScoreController],
  providers: [TokenHealthScoreService],
})
export class AppModule {}
