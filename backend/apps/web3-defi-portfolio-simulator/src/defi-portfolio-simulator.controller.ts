import { Controller, Get, Post, Query, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { DefiPortfolioSimulatorService } from './defi-portfolio-simulator.service';

@ApiTags('DeFi Portfolio Simulator')
@Controller('defi-portfolio-simulator')
export class DefiPortfolioSimulatorController {
  constructor(private readonly simulatorService: DefiPortfolioSimulatorService) {}

  @Get('portfolio')
  @ApiOperation({ summary: 'Get current portfolio simulation' })
  @ApiQuery({ name: 'address', required: true, description: 'Wallet address' })
  async getPortfolio(@Query('address') address: string) {
    return this.simulatorService.getCurrentPortfolio(address);
  }

  @Post('simulate')
  @ApiOperation({ summary: 'Simulate portfolio changes' })
  async simulate(@Body() simulationDto: any) {
    return this.simulatorService.simulatePortfolio(simulationDto);
  }

  @Post('scenario')
  @ApiOperation({ summary: 'Create and simulate a scenario' })
  async createScenario(@Body() scenarioDto: any) {
    return this.simulatorService.createScenario(scenarioDto);
  }

  @Get('scenarios')
  @ApiOperation({ summary: 'Get saved scenarios' })
  @ApiQuery({ name: 'address', required: true, description: 'Wallet address' })
  async getScenarios(@Query('address') address: string) {
    return this.simulatorService.getScenarios(address);
  }

  @Get('comparison')
  @ApiOperation({ summary: 'Compare multiple scenarios' })
  @ApiQuery({ name: 'scenarioIds', required: true, description: 'Comma-separated scenario IDs' })
  async compareScenarios(@Query('scenarioIds') scenarioIds: string) {
    return this.simulatorService.compareScenarios(scenarioIds);
  }

  @Get('strategies')
  @ApiOperation({ summary: 'Get available simulation strategies' })
  async getStrategies() {
    return this.simulatorService.getStrategies();
  }

  @Get('historical-backtest')
  @ApiOperation({ summary: 'Run historical backtest simulation' })
  @ApiQuery({ name: 'address', required: true, description: 'Wallet address' })
  @ApiQuery({ name: 'strategy', required: true, description: 'Strategy type' })
  @ApiQuery({ name: 'period', required: false, description: 'Period: 30d/90d/180d/1y' })
  async historicalBacktest(
    @Query('address') address: string,
    @Query('strategy') strategy: string,
    @Query('period') period?: string,
  ) {
    return this.simulatorService.historicalBacktest(address, strategy, period);
  }

  @Get('yield-projection')
  @ApiOperation({ summary: 'Project future yield based on strategy' })
  @ApiQuery({ name: 'amount', required: true, description: 'Initial amount in USD' })
  @ApiQuery({ name: 'strategy', required: true, description: 'Strategy type' })
  @ApiQuery({ name: 'duration', required: true, description: 'Duration in days' })
  async yieldProjection(
    @Query('amount') amount: string,
    @Query('strategy') strategy: string,
    @Query('duration') duration: string,
  ) {
    return this.simulatorService.yieldProjection(Number(amount), strategy, Number(duration));
  }

  @Get('risk-analysis')
  @ApiOperation({ summary: 'Analyze risk metrics for simulation' })
  @Body() portfolioData: any,
  async riskAnalysis(@Body() portfolioData: any) {
    return this.simulatorService.analyzeRisk(portfolioData);
  }

  @Get('stress-test')
  @ApiOperation({ summary: 'Run stress test on portfolio' })
  @ApiQuery({ name: 'address', required: true, description: 'Wallet address' })
  @ApiQuery({ name: 'scenario', required: true, description: 'Stress scenario: market_crash/ liquidity_crisis/ stablecoin_depeg' })
  async stressTest(
    @Query('address') address: string,
    @Query('scenario') scenario: string,
  ) {
    return this.simulatorService.stressTest(address, scenario);
  }
}
