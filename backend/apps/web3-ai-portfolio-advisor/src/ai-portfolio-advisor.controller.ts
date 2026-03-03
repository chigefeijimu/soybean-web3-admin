import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AiPortfolioAdvisorService } from './ai-portfolio-advisor.service';

class AnalyzePortfolioDto {
  address: string;
  chain?: string;
}

class GetRecommendationDto {
  address: string;
  riskTolerance?: string;
  goal?: string;
}

class OptimizePortfolioDto {
  address: string;
  targetAllocation?: string;
}

@ApiTags('AI Portfolio Advisor')
@Controller('ai-portfolio-advisor')
export class AiPortfolioAdvisorController {
  constructor(private readonly advisorService: AiPortfolioAdvisorService) {}

  @Get('health')
  @ApiOperation({ description: 'Check advisor health' })
  health() {
    return this.advisorService.healthCheck();
  }

  @Post('analyze')
  @ApiOperation({ description: 'Analyze portfolio and provide comprehensive report' })
  analyzePortfolio(@Body() dto: AnalyzePortfolioDto) {
    return this.advisorService.analyzePortfolio(dto.address, dto.chain || 'ethereum');
  }

  @Post('recommend')
  @ApiOperation({ description: 'Get personalized investment recommendations' })
  getRecommendations(@Body() dto: GetRecommendationDto) {
    return this.advisorService.getRecommendations(
      dto.address,
      dto.riskTolerance || 'moderate',
      dto.goal || 'growth'
    );
  }

  @Post('optimize')
  @ApiOperation({ description: 'Get portfolio optimization suggestions' })
  optimizePortfolio(@Body() dto: OptimizePortfolioDto) {
    return this.advisorService.optimizePortfolio(dto.address, dto.targetAllocation);
  }

  @Get('insights/:address')
  @ApiOperation({ description: 'Get AI-powered insights for a wallet' })
  getInsights(@Param('address') address: string) {
    return this.advisorService.getInsights(address);
  }

  @Get('risk-assessment/:address')
  @ApiOperation({ description: 'Get comprehensive risk assessment' })
  getRiskAssessment(@Param('address') address: string) {
    return this.advisorService.getRiskAssessment(address);
  }

  @Get('opportunities/:address')
  @ApiOperation({ description: 'Discover investment opportunities' })
  getOpportunities(@Param('address') address: string) {
    return this.advisorService.getOpportunities(address);
  }

  @Get('compare/:address1/:address2')
  @ApiOperation({ description: 'Compare two portfolios' })
  comparePortfolios(
    @Param('address1') address1: string,
    @Param('address2') address2: string
  ) {
    return this.advisorService.comparePortfolios(address1, address2);
  }

  @Get('market-context')
  @ApiOperation({ description: 'Get current market context for recommendations' })
  getMarketContext() {
    return this.advisorService.getMarketContext();
  }
}
