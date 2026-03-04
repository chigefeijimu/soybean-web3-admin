import { Controller, Get, Post, Body, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { GovernanceImpactAnalyzerService } from './governance-impact-analyzer.service';

class AnalyzeProposalDto {
  dao: string;
  proposalId: string;
  proposalTitle?: string;
  proposalDescription?: string;
}

class GetProposalImpactDto {
  dao: string;
  proposalId: string;
}

class GetDaoImpactSummaryDto {
  chainId?: string;
  dao?: string;
}

@ApiTags('Governance Impact Analyzer')
@Controller('governance-impact-analyzer')
export class GovernanceImpactAnalyzerController {
  constructor(private readonly service: GovernanceImpactAnalyzerService) {}

  @Post('analyze')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Analyze DAO proposal impact' })
  async analyzeProposal(@Body() dto: AnalyzeProposalDto) {
    return this.service.analyzeProposal(dto.dao, dto.proposalId, dto.proposalTitle, dto.proposalDescription);
  }

  @Get('proposal/:dao/:proposalId')
  @ApiOperation({ summary: 'Get proposal impact by DAO and ID' })
  @ApiParam({ name: 'dao', description: 'DAO name (e.g., uniswap)' })
  @ApiParam({ name: 'proposalId', description: 'Proposal ID' })
  async getProposalImpact(
    @Param('dao') dao: string,
    @Param('proposalId') proposalId: string,
  ) {
    return this.service.getProposalImpact(dao, proposalId);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get DAO impact summary dashboard' })
  @ApiQuery({ name: 'chainId', required: false })
  @ApiQuery({ name: 'dao', required: false })
  async getDaoImpactSummary(
    @Query('chainId') chainId?: string,
    @Query('dao') dao?: string,
  ) {
    return this.service.getDaoImpactSummary(chainId, dao);
  }

  @Get('trending')
  @ApiOperation({ summary: 'Get trending high-impact proposals' })
  @ApiQuery({ name: 'limit', required: false })
  async getTrendingProposals(@Query('limit') limit?: number) {
    return this.service.getTrendingProposals(limit || 10);
  }

  @Get('risk-assessment')
  @ApiOperation({ summary: 'Get risk assessment for a proposal' })
  @ApiQuery({ name: 'dao', required: true })
  @ApiQuery({ name: 'proposalId', required: true })
  async getRiskAssessment(
    @Query('dao') dao: string,
    @Query('proposalId') proposalId: string,
  ) {
    return this.service.getRiskAssessment(dao, proposalId);
  }

  @Get('market-prediction')
  @ApiOperation({ summary: 'Get market prediction for proposal outcomes' })
  @ApiQuery({ name: 'dao', required: true })
  @ApiQuery({ name: 'proposalId', required: true })
  async getMarketPrediction(
    @Query('dao') dao: string,
    @Query('proposalId') proposalId: string,
  ) {
    return this.service.getMarketPrediction(dao, proposalId);
  }

  @Get('supported-daos')
  @ApiOperation({ summary: 'List supported DAOs for impact analysis' })
  async getSupportedDaos() {
    return this.service.getSupportedDaos();
  }
}
