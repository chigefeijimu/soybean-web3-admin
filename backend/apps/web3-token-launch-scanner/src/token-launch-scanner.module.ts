import { Module } from '@nestjs/common';
import { TokenLaunchScannerController } from './token-launch-scanner.controller';
import { TokenLaunchScannerService } from './token-launch-scanner.service';

@Module({
  controllers: [TokenLaunchScannerController],
  providers: [TokenLaunchScannerService],
  exports: [TokenLaunchScannerService],
})
export class TokenLaunchScannerModule {}
