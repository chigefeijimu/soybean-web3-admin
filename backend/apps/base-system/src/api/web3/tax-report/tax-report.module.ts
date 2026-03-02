import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TaxReportController } from './tax-report.controller';
import { TaxReportService } from './tax-report.service';

@Module({
  imports: [HttpModule],
  controllers: [TaxReportController],
  providers: [TaxReportService],
  exports: [TaxReportService],
})
export class TaxReportModule {}
