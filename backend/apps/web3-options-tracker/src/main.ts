import { NestFactory } from '@nestjs/core';
import { OptionsTrackerModule } from './options-tracker.module';

async function bootstrap() {
  const app = await NestFactory.create(OptionsTrackerModule);
  await app.listen(3002);
  console.log('Options Tracker service running on port 3002');
}
bootstrap();
