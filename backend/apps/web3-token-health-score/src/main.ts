import { NestFactory } from '@nestjs/core';
import { AppModule } from './token-health-score.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/web3/token-health');
  app.enableCors();
  await app.listen(3000);
  console.log('Token Health Score API running on http://localhost:3000/api/web3/token-health');
}
bootstrap();
