import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { DaoProposalScannerController } from './dao-proposal-scanner.controller';
import { DaoProposalScannerService } from './dao-proposal-scanner.service';

@Module({
  imports: [HttpModule],
  controllers: [DaoProposalScannerController],
  providers: [DaoProposalScannerService],
  exports: [DaoProposalScannerService],
})
export class DaoProposalScannerModule {}
