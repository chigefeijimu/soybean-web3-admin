import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { DaoDelegationController } from './controllers/dao-delegation.controller';
import { DaoDelegationService } from './services/dao-delegation.service';

@Module({
  imports: [HttpModule],
  controllers: [DaoDelegationController],
  providers: [DaoDelegationService],
  exports: [DaoDelegationService],
})
export class Web3DaoDelegationModule {}
