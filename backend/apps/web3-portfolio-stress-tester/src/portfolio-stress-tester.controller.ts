import { Controller, Get, Post, Body, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { PortfolioStressTesterService } from './portfolio-stress-tester.service';
import { 
  StressTestRequestDto, 
  StressTestResultDto,
  PortfolioSnapshotDto,
  ScenarioConfigDto,
  HistoricalCrashDto,
  StressTestSummaryDto
} from './dto/stress-test.dto';

@ApiTags('Portfolio Stress Tester')
@Controller('web3/portfolio-stress-tester')
export class PortfolioStressTesterController {
  constructor(private readonly stressTesterService: PortfolioStressTesterService) {}

  @Post('analyze')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Run portfolio stress test',
    description: 'Analyze portfolio resilience under various stress scenarios'
  })
  @ApiResponse({ status: 200, description: 'Stress test completed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request parameters' })
  async runStressTest(@Body() dto: StressTestRequestDto): Promise<StressTestResultDto> {
    return this.stressTesterService.runStressTest(dto);
  }

  @Get('summary/:address')
  @ApiOperation({ 
    summary: 'Get portfolio stress test summary',
    description: 'Get quick stress test summary for a portfolio'
  })
  @ApiParam({ name: 'address', description: 'Wallet address to analyze' })
  @ApiQuery({ name: 'chains', required: false, description: 'Comma-separated chain IDs' })
  async getStressSummary(
    @Param('address') address: string,
    @Query('chains') chains?: string
  ): Promise<StressTestSummaryDto> {
    const chainList = chains ? chains.split(',') : undefined;
    return this.stressTesterService.getStressSummary(address, chainList);
  }

  @Post('scenarios')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Get custom scenario results',
    description: 'Run analysis with custom stress scenario parameters'
  })
  async runCustomScenario(@Body() dto: ScenarioConfigDto): Promise<any> {
    return this.stressTesterService.runCustomScenario(dto);
  }

  @Get('historical-crashes')
  @ApiOperation({ 
    summary: 'Get historical crash data',
    description: 'Retrieve historical market crash scenarios for reference'
  })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of crashes to return' })
  async getHistoricalCrashes(@Query('limit') limit?: number): Promise<HistoricalCrashDto[]> {
    return this.stressTesterService.getHistoricalCrashes(limit || 10);
  }

  @Get('portfolio-snapshot/:address')
  @ApiOperation({ 
    summary: 'Get portfolio snapshot for stress testing',
    description: 'Retrieve current portfolio composition'
  })
  @ApiParam({ name: 'address', description: 'Wallet address' })
  async getPortfolioSnapshot(
    @Param('address') address: string,
    @Query('chains') chains?: string
  ): Promise<PortfolioSnapshotDto> {
    const chainList = chains ? chains.split(',') : undefined;
    return this.stressTesterService.getPortfolioSnapshot(address, chainList);
  }

  @Post('compare')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Compare multiple portfolios stress resistance',
    description: 'Compare stress test results across multiple addresses'
  })
  async comparePortfolios(@Body() dto: { addresses: string[] }): Promise<any> {
    return this.stressTesterService.comparePortfolios(dto.addresses);
  }
}
