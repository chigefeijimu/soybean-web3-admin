import { NestFactory } from '@nestjs/core';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { AppModule } from './social-identity-graph.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));
  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  app.setGlobalPrefix('api/web3/social-identity-graph');
  app.enableCors();
  const port = process.env.PORT || 3024;
  await app.listen(port);
  console.log(`Cross-chain Social Identity Graph API running on port ${port}`);
}
bootstrap();
