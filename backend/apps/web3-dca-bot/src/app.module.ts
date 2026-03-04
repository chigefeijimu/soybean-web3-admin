import { Module } from '@nestjs/common';
import { DcaBotController } from './dca-bot.controller';
import { DcaBotService } from './dca-bot.service';

@Module({
  imports: [],
  controllers: [DcaBotController],
  providers: [DcaBotService],
  exports: [DcaBotService],
})
export class DcaBotModule {}
