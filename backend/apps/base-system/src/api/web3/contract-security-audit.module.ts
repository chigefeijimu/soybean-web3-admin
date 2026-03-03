import { Module } from '@nestjs/common';
import { ContractSecurityAuditController } from './contract-security-audit.controller';
import { ContractSecurityAuditService } from './contract-security-audit.service';

@Module({
  controllers: [ContractSecurityAuditController],
  providers: [ContractSecurityAuditService],
  exports: [ContractSecurityAuditService]
})
export class ContractSecurityAuditModule {}
