import { Module } from '@nestjs/common';
import { ContractStorageController } from './contract-storage.controller';
import { ContractStorageService } from './contract-storage.service';

@Module({
  controllers: [ContractStorageController],
  providers: [ContractStorageService],
  exports: [ContractStorageService],
})
export class ContractStorageModule {}
