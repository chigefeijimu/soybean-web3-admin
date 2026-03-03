import { NestFactory } from '@nestjs/core';
import { ContractDeployerModule } from './contract-deployer.module';

async function bootstrap() {
  const app = await NestFactory.create(ContractDeployerModule);
  
  // Enable CORS
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Set global prefix
  app.setGlobalPrefix('api/contract-deployer');

  const port = process.env.PORT || 3020;
  await app.listen(port);
  
  console.log(`🚀 Smart Contract Deployer API running on http://localhost:${port}`);
  console.log(`📋 API Documentation: http://localhost:${port}/api/contract-deployer`);
}

bootstrap();
