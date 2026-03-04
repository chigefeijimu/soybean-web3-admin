import { Module } from '@nestjs/common';
import { Web3IdentityVerificationController } from './src/web3-identity-verification.controller';
import { Web3IdentityVerificationModule } from './src/web3-identity-verification.module';

@Module({
  imports: [Web3IdentityVerificationModule],
  controllers: [],
  providers: [],
})
export class Web3IdentityVerificationAppModule {}
