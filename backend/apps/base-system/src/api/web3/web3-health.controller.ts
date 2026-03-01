import { Controller, Get, Query, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { Web3HealthService } from './web3-health.service';

@ApiTags('Web3 Wallet Health')
@Controller('api/web3/health')
export class Web3HealthController {
  private readonly logger = new Logger(Web3HealthController.name);

  constructor(private readonly web3HealthService: Web3HealthService) {}

  @Get('analyze')
  @ApiOperation({ summary: 'Analyze wallet health and risk score' })
  @ApiQuery({ name: 'address', description: 'Wallet address to analyze', required: true })
  @ApiQuery({ name: 'chainId', description: 'Chain ID (default: 1)', required: false })
  async analyzeWallet(
    @Query('address') address: string,
    @Query('chainId') chainId?: string,
  ) {
    this.logger.log(`Analyzing wallet health: ${address} on chain ${chainId || 1}`);
    return this.web3HealthService.analyzeWalletHealth(address, chainId ? parseInt(chainId) : 1);
  }

  @Get('approvals-risk')
  @ApiOperation({ summary: 'Get token approval risks' })
  @ApiQuery({ name: 'address', description: 'Wallet address', required: true })
  @ApiQuery({ name: 'chainId', description: 'Chain ID (default: 1)', required: false })
  async getApprovalRisks(
    @Query('address') address: string,
    @Query('chainId') chainId?: string,
  ) {
    return this.web3HealthService.getApprovalRisks(address, chainId ? parseInt(chainId) : 1);
  }

  @Get('defi-exposure')
  @ApiOperation({ summary: 'Get DeFi protocol exposure' })
  @ApiQuery({ name: 'address', description: 'Wallet address', required: true })
  @ApiQuery({ name: 'chainId', description: 'Chain ID (default: 1)', required: false })
  async getDefiExposure(
    @Query('address') address: string,
    @Query('chainId') chainId?: string,
  ) {
    return this.web3HealthService.getDefiExposure(address, chainId ? parseInt(chainId) : 1);
  }

  @Get('score-history')
  @ApiOperation({ summary: 'Get wallet health score history' })
  @ApiQuery({ name: 'address', description: 'Wallet address', required: true })
  async getScoreHistory(@Query('address') address: string) {
    return this.web3HealthService.getScoreHistory(address);
  }
}
