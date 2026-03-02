import { Module } from '@nestjs/common';
import { TokenTransferController } from './token-transfer.controller';
import { TokenTransferService } from './token-transfer.service';

@Module({
  controllers: [TokenTransferController],
  providers: [TokenTransferService],
  exports: [TokenTransferService],
})
export class TokenTransferModule {}
