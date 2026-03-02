import { Module } from '@nestjs/common';
import { DefiPositionManagerController } from './defi-position-manager.controller';
import { DefiPositionManagerService } from './defi-position-manager.service';

@Module({
  controllers: [DefiPositionManagerController],
  providers: [DefiPositionManagerService],
  exports: [DefiPositionManagerService],
})
export class DefiPositionManagerModule {}
