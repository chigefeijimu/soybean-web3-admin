import { Module } from '@nestjs/common';
import { PrivacyAnalyzerController } from './privacy-analyzer.controller';
import { PrivacyAnalyzerService } from './privacy-analyzer.service';

@Module({
  controllers: [PrivacyAnalyzerController],
  providers: [PrivacyAnalyzerService],
  exports: [PrivacyAnalyzerService],
})
export class PrivacyAnalyzerModule {}
