import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { DaoTreasuryManagerController } from './dao-treasury-manager.controller';
import { DaoTreasuryManagerService } from './dao-treasury-manager.service';

@Module({
  imports: [HttpModule],
  controllers: [DaoTreasuryManagerController],
  providers: [DaoTreasuryManagerService],
  exports: [DaoTreasuryManagerService],
})
export class DaoTreasuryManagerModule {}
