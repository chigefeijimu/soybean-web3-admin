import { Module } from '@nestjs/common';
import { ContractAbiManagerController } from './contract-abi-manager.controller';
import { ContractAbiManagerService } from './contract-abi-manager.service';

@Module({
  controllers: [ContractAbiManagerController],
  providers: [ContractAbiManagerService],
  exports: [ContractAbiManagerService],
})
export class ContractAbiManagerModule {}
