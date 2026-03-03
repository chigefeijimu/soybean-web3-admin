import { NestFactory } from '@nestjs/core';
import { IdentityReputationModule } from './identity-reputation.module';

async function bootstrap() {
  const app = await NestFactory.create(IdentityReputationModule);
  
  // Enable CORS
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });
  
  const port = process.env.PORT || 3006;
  await app.listen(port);
  console.log(`🌐 Web3 Identity & Reputation API running on port ${port}`);
}

bootstrap();
