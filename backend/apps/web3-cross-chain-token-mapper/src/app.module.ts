import { Module } from '@nestjs/common';
import { CrossChainTokenMapperController } from './app.controller';
import { CrossChainTokenMapperService } from './app.service';

@Module({
  imports: [],
  controllers: [CrossChainTokenMapperController],
  providers: [CrossChainTokenMapperService],
  exports: [CrossChainTokenMapperService],
})
export class CrossChainTokenMapperModule {}
