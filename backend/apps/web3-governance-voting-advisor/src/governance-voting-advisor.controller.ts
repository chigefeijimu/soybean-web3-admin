import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { GovernanceVotingAdvisorService } from './governance-voting-advisor.service';

class AnalyzeProposalDto {
  @ApiOperation({ description: 'DAO名称' })
  dao: string;
  
  @ApiOperation({ description: '提案ID' })
  proposalId: string;
  
  @ApiOperation({ description: '用户钱包地址（可选）' })
  walletAddress?: string;
}

class GetVotingRecommendationDto {
  @ApiOperation({ description: 'DAO名称' })
  dao: string;
  
  @ApiOperation({ description: '提案ID' })
  proposalId: string;
  
  @ApiOperation({ description: '用户钱包地址' })
  walletAddress: string;
}

class CreateVotingStrategyDto {
  @ApiOperation({ description: '策略名称' })
  name: string;
  
  @ApiOperation({ description: '策略描述' })
  description: string;
  
  @ApiOperation({ description: 'DAO偏好列表' })
  daoPreferences: { dao: string; weight: number }[];
  
  @ApiOperation({ description: '风险偏好: conservative/moderate/aggressive' })
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  
  @ApiOperation({ description: '关注的投票因素' })
  votingFactors: string[];
}

@ApiTags('GovernanceVotingAdvisor')
@Controller('governance/voting-advisor')
export class GovernanceVotingAdvisorController {
  constructor(private readonly service: GovernanceVotingAdvisorService) {}

  @Get('daos')
  @ApiOperation({ description: '获取支持的DAO列表' })
  getSupportedDAOs() {
    return this.service.getSupportedDAOs();
  }

  @Get('proposal/:dao/:proposalId')
  @ApiOperation({ description: '获取提案详情与分析' })
  getProposalAnalysis(
    @Param('dao') dao: string,
    @Param('proposalId') proposalId: string,
  ) {
    return this.service.analyzeProposal(dao, proposalId);
  }

  @Post('recommendation')
  @ApiOperation({ description: '获取投票建议' })
  getVotingRecommendation(@Body() dto: GetVotingRecommendationDto) {
    return this.service.getVotingRecommendation(dto.dao, dto.proposalId, dto.walletAddress);
  }

  @Post('strategy')
  @ApiOperation({ description: '创建投票策略' })
  createVotingStrategy(@Body() dto: CreateVotingStrategyDto) {
    return this.service.createVotingStrategy(dto);
  }

  @Get('strategy/:id')
  @ApiOperation({ description: '获取投票策略详情' })
  getVotingStrategy(@Param('id') id: string) {
    return this.service.getVotingStrategy(id);
  }

  @Get('strategies')
  @ApiOperation({ description: '获取所有投票策略' })
  getAllVotingStrategies() {
    return this.service.getAllVotingStrategies();
  }

  @Get('voting-history/:dao')
  @ApiOperation({ description: '获取DAO投票历史统计' })
  @ApiQuery({ name: 'limit', required: false })
  getVotingHistory(
    @Param('dao') dao: string,
    @Query('limit') limit?: number,
  ) {
    return this.service.getVotingHistory(dao, limit || 20);
  }

  @Get('delegate-insights/:dao/:delegate')
  @ApiOperation({ description: '获取委托人的投票洞察' })
  getDelegateInsights(
    @Param('dao') dao: string,
    @Param('delegate') delegate: string,
  ) {
    return this.service.getDelegateInsights(dao, delegate);
  }

  @Get('proposal-impact/:dao/:proposalId')
  @ApiOperation({ description: '分析提案对投资组合的影响' })
  getProposalImpact(
    @Param('dao') dao: string,
    @Param('proposalId') proposalId: string,
    @Query('walletAddress') walletAddress: string,
  ) {
    return this.service.analyzeProposalImpact(dao, proposalId, walletAddress);
  }

  @Get('dashboard')
  @ApiOperation({ description: '获取治理投票仪表盘概览' })
  getDashboard(@Query('walletAddress') walletAddress?: string) {
    return this.service.getDashboard(walletAddress);
  }
}
