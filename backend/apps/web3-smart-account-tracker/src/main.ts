import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/web3/smart-account');
  app.enableCors();
  await app.listen(3000);
  console.log('Smart Account Tracker running on http://localhost:3000/api/web3/smart-account');
}
bootstrap();
