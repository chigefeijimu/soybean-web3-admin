import { Module } from '@nestjs/common';
import { MevProtectController } from './mev-protect.controller';
import { MevProtectService } from './mev-protect.service';

@Module({
  controllers: [MevProtectController],
  providers: [MevProtectService],
  exports: [MevProtectService]
})
export class MevProtectModule {}
