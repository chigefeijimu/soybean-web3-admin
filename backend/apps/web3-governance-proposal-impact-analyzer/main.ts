import { NestFactory } from '@nestjs/core';
import { GovernanceProposalImpactModule } from './governance-proposal-impact.module';

async function bootstrap() {
  const app = await NestFactory.create(GovernanceProposalImpactModule);
  const port = process.env.PORT || 3008;
  await app.listen(port);
  console.log(`Governance Proposal Impact Analyzer running on port ${port}`);
}
bootstrap();
