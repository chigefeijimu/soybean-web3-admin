import { Module } from '@nestjs/common';
import { Web3PortfolioRiskAssessmentService } from '../../../../web3-portfolio-risk-assessment/src/web3-portfolio-risk-assessment.service';
import { Web3PortfolioRiskAssessmentController } from './portfolio-risk-assessment.controller';

@Module({
  providers: [Web3PortfolioRiskAssessmentService],
  controllers: [Web3PortfolioRiskAssessmentController],
  exports: [Web3PortfolioRiskAssessmentService],
})
export class Web3PortfolioRiskAssessmentModule {}
