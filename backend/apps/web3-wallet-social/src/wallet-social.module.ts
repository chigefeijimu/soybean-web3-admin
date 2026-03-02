import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { WalletSocialController } from './wallet-social.controller';
import { WalletSocialService } from './wallet-social.service';

@Module({
  imports: [HttpModule],
  controllers: [WalletSocialController],
  providers: [WalletSocialService],
  exports: [WalletSocialService],
})
export class AppModule {}
