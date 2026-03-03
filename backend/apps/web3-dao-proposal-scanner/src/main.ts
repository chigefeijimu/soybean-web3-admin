import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { DaoProposalScannerModule } from './dao-proposal-scanner.module';

async function bootstrap() {
  const app = await NestFactory.create(DaoProposalScannerModule);
  
  const config = new DocumentBuilder()
    .setTitle('DAO Proposal Scanner API')
    .setDescription('DAO Proposal Scanner & Alert System - Discover and track governance proposals across multiple DAOs')
    .setVersion('1.0')
    .addTag('dao-proposal-scanner')
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs/dao-proposal-scanner', app, document);

  const port = process.env.DAO_PROPOSAL_SCANNER_PORT || 3017;
  await app.listen(port);
  console.log(`DAO Proposal Scanner API is running on port ${port}`);
}

bootstrap();
