import { NestFactory } from '@nestjs/core';
import { AppModule } from './net-worth-tracker.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT || 3004;
  await app.listen(port);
  console.log(`🚀 Net Worth Tracker API running on port ${port}`);
}
bootstrap();
