import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { MultisigTxBuilderController } from './controller/multisig-tx-builder.controller';
import { MultisigTxBuilderService } from './service/multisig-tx-builder.service';

@Module({
  imports: [HttpModule],
  controllers: [MultisigTxBuilderController],
  providers: [MultisigTxBuilderService],
  exports: [MultisigTxBuilderService],
})
export class MultisigTxBuilderModule {}
