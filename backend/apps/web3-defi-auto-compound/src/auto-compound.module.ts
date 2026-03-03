import { Module } from '@nestjs/common';
import { AutoCompoundController } from './auto-compound.controller';
import { AutoCompoundService } from './auto-compound.service';

@Module({
  imports: [],
  controllers: [AutoCompoundController],
  providers: [AutoCompoundService],
  exports: [AutoCompoundService],
})
export class AutoCompoundModule {}
