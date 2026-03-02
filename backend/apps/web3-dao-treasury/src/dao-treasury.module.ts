import { Module } from '@nestjs/common';
import { DaoTreasuryController } from './dao-treasury.controller';
import { DaoTreasuryService } from './dao-treasury.service';

@Module({
  controllers: [DaoTreasuryController],
  providers: [DaoTreasuryService],
})
export class DaoTreasuryModule {}
