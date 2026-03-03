import { NestFactory } from '@nestjs/core';
import { CrossChainTimelineModule } from './cross-chain-timeline.module';

async function bootstrap() {
  const app = await NestFactory.create(CrossChainTimelineModule);
  await app.listen(3000);
  console.log('Cross-Chain Timeline API is running on port 3000');
}
bootstrap();
