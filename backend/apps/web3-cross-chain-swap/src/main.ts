import { NestFactory } from '@nestjs/core';
import { CrossChainSwapModule } from './cross-chain-swap.module';

async function bootstrap() {
  const app = await NestFactory.create(CrossChainSwapModule);
  await app.listen(3000);
  console.log('Cross-chain Swap service is running on http://localhost:3000');
}
bootstrap();
