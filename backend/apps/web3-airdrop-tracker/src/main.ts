import { NestFactory } from '@nestjs/core';
import { AirdropTrackerModule } from './airdrop-tracker.module';

async function bootstrap() {
  const app = await NestFactory.create(AirdropTrackerModule);
  await app.listen(3000);
  console.log('Airdrop Tracker service is running on port 3000');
}
bootstrap();
