import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { IdentityReputationController } from './identity-reputation.controller';
import { IdentityReputationService } from './identity-reputation.service';

@Module({
  imports: [HttpModule],
  controllers: [IdentityReputationController],
  providers: [IdentityReputationService],
  exports: [IdentityReputationService],
})
export class IdentityReputationModule {}
