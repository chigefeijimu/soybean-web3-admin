import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AddressInteractionController } from './address-interaction.controller';
import { AddressInteractionService } from './address-interaction.service';

@Module({
  imports: [HttpModule],
  controllers: [AddressInteractionController],
  providers: [AddressInteractionService],
  exports: [AddressInteractionService],
})
export class AddressInteractionModule {}
