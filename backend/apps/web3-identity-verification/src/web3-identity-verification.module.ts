import { Module } from '@nestjs/common';
import { Web3IdentityVerificationController } from './src/web3-identity-verification.controller';

@Module({
  controllers: [Web3IdentityVerificationController],
  providers: [],
  exports: [],
})
export class Web3IdentityVerificationModule {}
