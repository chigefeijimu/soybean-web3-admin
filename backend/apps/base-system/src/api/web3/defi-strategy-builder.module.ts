import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { DefiStrategyBuilderController } from './defi-strategy-builder.controller';
import { DefiStrategyBuilderService } from './defi-strategy-builder.service';

@Module({
  imports: [HttpModule],
  controllers: [DefiStrategyBuilderController],
  providers: [DefiStrategyBuilderService],
  exports: [DefiStrategyBuilderService],
})
export class DefiStrategyBuilderModule {}
