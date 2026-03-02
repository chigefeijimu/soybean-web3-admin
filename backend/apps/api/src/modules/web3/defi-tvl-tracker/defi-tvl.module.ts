import { Module } from '@nestjs/common';
import { DefiTvlController } from './defi-tvl.controller';
import { DefiTvlService } from './defi-tvl.service';

@Module({
  controllers: [DefiTvlController],
  providers: [DefiTvlService],
  exports: [DefiTvlService],
})
export class DefiTvlModule {}
