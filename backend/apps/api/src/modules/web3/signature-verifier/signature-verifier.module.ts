import { Module } from '@nestjs/common';
import { SignatureVerifierController } from './signature-verifier.controller';
import { SignatureVerifierService } from './signature-verifier.service';

@Module({
  controllers: [SignatureVerifierController],
  providers: [SignatureVerifierService],
  exports: [SignatureVerifierService],
})
export class SignatureVerifierModule {}
