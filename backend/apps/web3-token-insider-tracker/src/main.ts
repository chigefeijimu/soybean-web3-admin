import { NestFactory } from '@nestjs/core';
import { TokenInsiderTrackerModule } from './token-insider-tracker.module';

async function bootstrap() {
  const app = await NestFactory.create(TokenInsiderTrackerModule);
  await app.listen(3002);
  console.log('Token Insider Tracker service is running on http://localhost:3002');
}
bootstrap();
