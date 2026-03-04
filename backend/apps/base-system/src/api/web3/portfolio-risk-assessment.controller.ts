import { Controller, Get, Post, Body, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiParam } from '@nestjs/swagger';
import { Web3PortfolioRiskAssessmentService } from '../../../../web3-portfolio-risk-assessment/src/web3-portfolio-risk-assessment.service';

@ApiTags('Portfolio Risk Assessment')
@Controller('api/web3/portfolio-risk-assessment')
export class Web3PortfolioRiskAssessmentController {
  constructor(private readonly riskService: Web3PortfolioRiskAssessmentService) {}

  @Get('dashboard')
  @ApiOperation({ summary: '获取投资组合风险仪表盘概览' })
  async getDashboard() {
    return this.riskService.getRiskDashboard();
  }

  @Get('analyze/:address')
  @ApiOperation({ summary: '分析钱包地址的投资组合风险' })
  @ApiParam({ name: 'address', description: '钱包地址' })
  @ApiQuery({ name: 'chains', required: false, description: '逗号分隔的链名称' })
  async analyzePortfolio(
    @Param('address') address: string,
    @Query('chains') chains?: string,
  ) {
    const chainList = chains ? chains.split(',') : ['ethereum', 'polygon', 'arbitrum', 'optimism', 'bsc', 'base', 'avalanche'];
    return this.riskService.analyzePortfolioRisk(address, chainList);
  }

  @Post('batch')
  @ApiOperation({ summary: '批量分析多个钱包地址的风险' })
  @HttpCode(HttpStatus.OK)
  async batchAnalyze(@Body() body: { addresses: string[]; chains?: string[] }) {
    return this.riskService.batchAnalyzeRisk(body.addresses, body.chains);
  }

  @Get('concentration/:address')
  @ApiOperation({ summary: '分析投资组合风险集中度' })
  @ApiParam({ name: 'address', description: '钱包地址' })
  async analyzeConcentration(@Param('address') address: string) {
    return this.riskService.analyzeConcentrationRisk(address);
  }

  @Get('protocol-risk/:address')
  @ApiOperation({ summary: '获取投资组合中各协议的风险评估' })
  @ApiParam({ name: 'address', description: '钱包地址' })
  async getProtocolRisks(@Param('address') address: string) {
    return this.riskService.getProtocolRisks(address);
  }

  @Get('stress-test/:address')
  @ApiOperation({ summary: '投资组合压力测试' })
  @ApiParam({ name: 'address', description: '钱包地址' })
  @ApiQuery({ name: 'scenarios', required: false, description: '压力场景列表' })
  async stressTest(
    @Param('address') address: string,
    @Query('scenarios') scenarios?: string,
  ) {
    const scenarioList = scenarios 
      ? scenarios.split(',') 
      : ['market_crash_20', 'market_crash_40', 'stablecoin_depeg', 'liquidity_crisis'];
    return this.riskService.stressTestPortfolio(address, scenarioList);
  }

  @Get('diversification/:address')
  @ApiOperation({ summary: '计算投资组合多样化评分' })
  @ApiParam({ name: 'address', description: '钱包地址' })
  async getDiversificationScore(@Param('address') address: string) {
    return this.riskService.calculateDiversificationScore(address);
  }

  @Get('recommendations/:address')
  @ApiOperation({ summary: '获取个性化风险缓解建议' })
  @ApiParam({ name: 'address', description: '钱包地址' })
  async getRecommendations(@Param('address') address: string) {
    return this.riskService.getRiskRecommendations(address);
  }

  @Get('historical/:address')
  @ApiOperation({ summary: '获取历史风险评分' })
  @ApiParam({ name: 'address', description: '钱包地址' })
  @ApiQuery({ name: 'days', required: false, description: '历史天数' })
  async getHistoricalRisk(
    @Param('address') address: string,
    @Query('days') days: number = 30,
  ) {
    return this.riskService.getHistoricalRiskScore(address, days);
  }

  @Post('alert')
  @ApiOperation({ summary: '创建风险警报' })
  @HttpCode(HttpStatus.OK)
  async createAlert(
    @Body() body: { 
      address: string; 
      threshold: number; 
      condition: 'above' | 'below';
      channels?: string[];
    },
  ) {
    return this.riskService.createRiskAlert(body);
  }

  @Get('alerts/:address')
  @ApiOperation({ summary: '获取地址的风险警报' })
  @ApiParam({ name: 'address', description: '钱包地址' })
  async getAlerts(@Param('address') address: string) {
    return this.riskService.getRiskAlerts(address);
  }

  @Get('compare/:address1/:address2')
  @ApiOperation({ summary: '对比两个钱包的风险' })
  @ApiParam({ name: 'address1', description: '第一个钱包地址' })
  @ApiParam({ name: 'address2', description: '第二个钱包地址' })
  async comparePortfolios(
    @Param('address1') address1: string,
    @Param('address2') address2: string,
  ) {
    return this.riskService.comparePortfolios(address1, address2);
  }

  @Get('health')
  @ApiOperation({ summary: 'API健康检查' })
  async health() {
    return {
      status: 'ok',
      service: 'Portfolio Risk Assessment',
      timestamp: Date.now(),
    };
  }
}
