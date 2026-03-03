import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { TokenLaunchScannerModule } from './token-launch-scanner.module';

async function bootstrap() {
  const app = await NestFactory.create(TokenLaunchScannerModule);
  app.setGlobalPrefix('api');
  await app.listen(3000);
  console.log('Token Launch Scanner running on port 3000');
}
bootstrap();
