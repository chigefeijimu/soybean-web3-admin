import { Module } from '@nestjs/common';
import { AddressLabelController } from './address-label.controller';
import { AddressLabelService } from './address-label.service';

@Module({
  controllers: [AddressLabelController],
  providers: [AddressLabelService],
  exports: [AddressLabelService],
})
export class AddressLabelModule {}
