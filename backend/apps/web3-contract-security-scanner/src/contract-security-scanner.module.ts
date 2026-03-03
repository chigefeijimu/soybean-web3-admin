import { Module } from '@nestjs/common';
import { ContractSecurityScannerController } from './contract-security-scanner.controller';
import { ContractSecurityScannerService } from './contract-security-scanner.service';

@Module({
  controllers: [ContractSecurityScannerController],
  providers: [ContractSecurityScannerService],
  exports: [ContractSecurityScannerService],
})
export class ContractSecurityScannerModule {}
