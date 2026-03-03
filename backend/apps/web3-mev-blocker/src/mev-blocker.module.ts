import { Module } from '@nestjs/common';
import { MevBlockerController } from './mev-blocker.controller';
import { MevBlockerService } from './mev-blocker.service';

@Module({
  controllers: [MevBlockerController],
  providers: [MevBlockerService],
  exports: [MevBlockerService],
})
export class MevBlockerModule {}
