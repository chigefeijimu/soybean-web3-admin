import { NestFactory } from '@nestjs/core';
import { TokenLockTrackerModule } from './token-lock-tracker.module';

async function bootstrap() {
  const app = await NestFactory.create(TokenLockTrackerModule);
  await app.listen(3000);
  console.log('Token Lock Tracker running on port 3000');
}
bootstrap();
