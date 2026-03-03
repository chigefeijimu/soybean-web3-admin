import { Module } from '@nestjs/common';
import { ContractDeployerController } from './contract-deployer.controller';
import { ContractDeployerService } from './contract-deployer.service';

@Module({
  imports: [],
  controllers: [ContractDeployerController],
  providers: [ContractDeployerService],
})
export class ContractDeployerModule {}
