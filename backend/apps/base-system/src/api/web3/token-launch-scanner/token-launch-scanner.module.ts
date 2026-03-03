import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TokenLaunchScannerController } from './token-launch-scanner.controller';
import { TokenLaunchScannerService } from './token-launch-scanner.service';

@Module({
  imports: [HttpModule],
  controllers: [TokenLaunchScannerController],
  providers: [TokenLaunchScannerService],
  exports: [TokenLaunchScannerService],
})
export class TokenLaunchScannerModule {}
