import { Module } from '@nestjs/common';
import { AddressLabelController } from '../../../../web3-address-label/src/address-label.controller';
import { AddressLabelService } from '../../../../web3-address-label/src/address-label.service';

@Module({
  controllers: [AddressLabelController],
  providers: [AddressLabelService],
  exports: [AddressLabelService],
})
export class AddressLabelModule {}
