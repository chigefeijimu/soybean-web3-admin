import { NestFactory } from '@nestjs/core';
import { WalletActivityModule } from './wallet-activity.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(WalletActivityModule);
  
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  const logger = new Logger('WalletActivity');
  const port = process.env.WALLET_ACTIVITY_PORT || 3031;
  
  await app.listen(port);
  logger.log(`Wallet Activity Analytics Service running on port ${port}`);
}

bootstrap();
