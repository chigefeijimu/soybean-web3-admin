import { Module } from '@nestjs/common';
import { SmartAccountController } from './smart-account.controller';
import { SmartAccountService } from './smart-account.service';

@Module({
  imports: [],
  controllers: [SmartAccountController],
  providers: [SmartAccountService],
})
export class AppModule {}
