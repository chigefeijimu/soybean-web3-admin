import { Module } from '@nestjs/common';
import { DaoProposalAlertController } from './dao-proposal-alert.controller';
import { DaoProposalAlertService } from './dao-proposal-alert.service';

@Module({
  imports: [],
  controllers: [DaoProposalAlertController],
  providers: [DaoProposalAlertService],
  exports: [DaoProposalAlertService],
})
export class DaoProposalAlertModule {}
