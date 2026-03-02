import { Module } from '@nestjs/common';
import { GovernancePowerController } from './governance-power.controller';
import { GovernancePowerService } from './governance-power.service';

@Module({
  imports: [],
  controllers: [GovernancePowerController],
  providers: [GovernancePowerService],
  exports: [GovernancePowerService],
})
export class GovernancePowerModule {}
