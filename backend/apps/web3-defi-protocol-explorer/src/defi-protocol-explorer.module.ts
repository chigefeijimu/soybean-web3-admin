import { Module } from '@nestjs/common';
import { DefiProtocolExplorerController } from './defi-protocol-explorer.controller';
import { DefiProtocolExplorerService } from './defi-protocol-explorer.service';

@Module({
  controllers: [DefiProtocolExplorerController],
  providers: [DefiProtocolExplorerService],
  exports: [DefiProtocolExplorerService],
})
export class DefiProtocolExplorerModule {}
