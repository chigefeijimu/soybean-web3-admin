import { Module } from '@nestjs/common';
import { TokenSafetyController } from './token-safety.controller';
import { TokenSafetyService } from './token-safety.service';

@Module({
  imports: [],
  controllers: [TokenSafetyController],
  providers: [TokenSafetyService],
})
export class AppModule {}
