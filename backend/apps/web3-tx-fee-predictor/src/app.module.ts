import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { FeePredictorController } from './fee-predictor.controller';
import { FeePredictorService } from './fee-predictor.service';

@Module({
  imports: [HttpModule],
  controllers: [FeePredictorController],
  providers: [FeePredictorService],
})
export class AppModule {}
