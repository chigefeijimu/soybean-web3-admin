import { NestFactory } from '@nestjs/core';
import { GovernanceExplorerModule } from './governance-explorer.module';

async function bootstrap() {
  const app = await NestFactory.create(GovernanceExplorerModule);
  await app.listen(3019);
  console.log('Governance Explorer service running on port 3019');
}
bootstrap();
