import { Module } from '@nestjs/common';
import { Web3PortfolioRiskAssessmentController } from './web3-portfolio-risk-assessment.controller';
import { Web3PortfolioRiskAssessmentService } from './web3-portfolio-risk-assessment.service';

@Module({
  controllers: [Web3PortfolioRiskAssessmentController],
  providers: [Web3PortfolioRiskAssessmentService],
  exports: [Web3PortfolioRiskAssessmentService],
})
export class Web3PortfolioRiskAssessmentModule {}
