import { NestFactory } from '@nestjs/core';
import { GovernanceImpactAnalyzerModule } from './governance-impact-analyzer.module';

async function bootstrap() {
  const app = await NestFactory.create(GovernanceImpactAnalyzerModule);
  await app.listen(3000);
  console.log('Governance Impact Analyzer API running on port 3000');
}
bootstrap();
