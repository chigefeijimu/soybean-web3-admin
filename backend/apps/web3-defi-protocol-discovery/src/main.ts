import { NestFactory } from '@nestjs/core';
import { DefiProtocolDiscoveryModule } from './defi-protocol-discovery.module';

async function bootstrap() {
  const app = await NestFactory.create(DefiProtocolDiscoveryModule);
  
  // Enable CORS
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  const port = process.env.PORT || 3006;
  await app.listen(port);
  console.log(`🌟 DeFi Protocol Discovery API running on port ${port}`);
}

bootstrap();
