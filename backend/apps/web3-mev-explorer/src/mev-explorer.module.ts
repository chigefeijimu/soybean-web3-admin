import { Module } from '@nestjs/common';
import { MevExplorerController } from './mev-explorer.controller';
import { MevExplorerService } from './mev-explorer.service';

@Module({
  controllers: [MevExplorerController],
  providers: [MevExplorerService],
  exports: [MevExplorerService],
})
export class MevExplorerModule {}
