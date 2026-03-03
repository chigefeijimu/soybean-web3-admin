import { NestFactory } from '@nestjs/core';
import { ContractSecurityScannerModule } from './contract-security-scanner.module';

async function bootstrap() {
  const app = await NestFactory.create(ContractSecurityScannerModule);
  
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  const port = process.env.PORT || 3007;
  await app.listen(port);
  console.log(`Contract Security Scanner API running on port ${port}`);
}

bootstrap();
