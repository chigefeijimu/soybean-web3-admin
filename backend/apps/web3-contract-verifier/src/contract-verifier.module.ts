import { Module } from '@nestjs/common';
import { ContractVerifierController } from './contract-verifier.controller';
import { ContractVerifierService } from './contract-verifier.service';

@Module({
  controllers: [ContractVerifierController],
  providers: [ContractVerifierService],
  exports: [ContractVerifierService],
})
export class ContractVerifierModule {}
