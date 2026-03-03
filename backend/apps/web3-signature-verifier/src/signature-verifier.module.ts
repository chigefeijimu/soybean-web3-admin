import { Module } from '@nestjs/common';
import { SignatureVerifierController } from './signature-verifier.controller';

@Module({
  controllers: [SignatureVerifierController],
  providers: [],
  exports: [],
})
export class SignatureVerifierModule {}
