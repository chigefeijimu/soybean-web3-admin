import { NestFactory } from '@nestjs/core';
import { DaoProposalAlertModule } from './dao-proposal-alert.module';

async function bootstrap() {
  const app = await NestFactory.create(DaoProposalAlertModule);
  app.setGlobalPrefix('api');
  await app.listen(3000);
  console.log('DAO Proposal Alert API running on http://localhost:3000/api');
}
bootstrap();
