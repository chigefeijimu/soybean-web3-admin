import { Module } from '@nestjs/common';
import { GasOptimizerController } from './controller/gas-optimizer.controller';
import { GasOptimizerService } from './service/gas-optimizer.service';
import { GasOptimizerRepository } from './repository/gas-optimizer.repository';

@Module({
  imports: [],
  controllers: [GasOptimizerController],
  providers: [GasOptimizerService, GasOptimizerRepository],
})
export class AppModule {}
