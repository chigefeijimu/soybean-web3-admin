import { Controller, Get, Post, Body, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { FeePredictorService } from './fee-predictor.service';
import {
  PredictFeeDto,
  GetHistoricalFeesDto,
  GetFeeComparisonDto,
  GetOptimalTimeDto,
  GetFeeAlertDto,
} from './dto/fee-predictor.dto';

@ApiTags('Fee Predictor')
@Controller('api/fee-predictor')
export class FeePredictorController {
  constructor(private readonly feePredictorService: FeePredictorService) {}

  @Post('predict')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Predict optimal fee for a transaction' })
  @ApiResponse({ status: 200, description: 'Fee prediction returned successfully' })
  async predictFee(@Body() dto: PredictFeeDto) {
    return this.feePredictorService.predictFee(
      dto.chain,
      dto.transactionType,
      dto.gasLimit,
    );
  }

  @Get('historical')
  @ApiOperation({ summary: 'Get historical gas fees' })
  @ApiQuery({ name: 'chain', enum: ['ethereum', 'polygon', 'arbitrum', 'optimism', 'bsc', 'base', 'avalanche'] })
  @ApiQuery({ name: 'timeRange', required: false, enum: ['1h', '4h', '12h', '24h', '7d', '30d'] })
  async getHistoricalFees(
    @Query('chain') chain: string,
    @Query('timeRange') timeRange?: string,
  ) {
    return this.feePredictorService.getHistoricalFees(chain, timeRange || '7d');
  }

  @Post('compare')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Compare fees across multiple chains' })
  async getFeeComparison(@Body() dto: GetFeeComparisonDto) {
    return this.feePredictorService.getFeeComparison(
      dto.chains,
      dto.transactionType,
      dto.gasLimit,
    );
  }

  @Post('optimal-time')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get optimal time to submit transaction' })
  async getOptimalTime(@Body() dto: GetOptimalTimeDto) {
    return this.feePredictorService.getOptimalTime(
      dto.chain,
      dto.transactionType,
      dto.days,
    );
  }

  @Post('alert')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check if gas price is below threshold' })
  async checkFeeAlert(@Body() dto: GetFeeAlertDto) {
    return this.feePredictorService.getFeeAlerts(dto.chain, dto.thresholdGwei);
  }

  @Get('recommendations')
  @ApiOperation({ summary: 'Get gas price recommendations (slow/normal/fast)' })
  @ApiQuery({ name: 'chain', enum: ['ethereum', 'polygon', 'arbitrum', 'optimism', 'bsc', 'base', 'avalanche'] })
  async getRecommendations(@Query('chain') chain: string) {
    return this.feePredictorService.getGasPriceRecommendations(chain);
  }

  @Get('chains')
  @ApiOperation({ summary: 'Get supported chains' })
  async getSupportedChains() {
    return {
      chains: [
        { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', color: '#627EEA' },
        { id: 'polygon', name: 'Polygon', symbol: 'MATIC', color: '#8247E5' },
        { id: 'arbitrum', name: 'Arbitrum', symbol: 'ETH', color: '#28A0F0' },
        { id: 'optimism', name: 'Optimism', symbol: 'ETH', color: '#FF0420' },
        { id: 'bsc', name: 'BNB Chain', symbol: 'BNB', color: '#F3BA2F' },
        { id: 'base', name: 'Base', symbol: 'ETH', color: '#0052FF' },
        { id: 'avalanche', name: 'Avalanche', symbol: 'AVAX', color: '#E84142' },
      ],
    };
  }

  @Get('transaction-types')
  @ApiOperation({ summary: 'Get supported transaction types' })
  async getTransactionTypes() {
    return {
      types: [
        { id: 'eth_transfer', name: 'ETH Transfer', baseGasLimit: 21000 },
        { id: 'erc20_transfer', name: 'ERC20 Transfer', baseGasLimit: 65000 },
        { id: 'swap', name: 'DEX Swap', baseGasLimit: 150000 },
        { id: 'nft_transfer', name: 'NFT Transfer', baseGasLimit: 85000 },
        { id: 'contract_deploy', name: 'Contract Deployment', baseGasLimit: 2000000 },
        { id: 'staking', name: 'Staking', baseGasLimit: 100000 },
        { id: 'bridge', name: 'Cross-chain Bridge', baseGasLimit: 200000 },
      ],
    };
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check' })
  async healthCheck() {
    return {
      status: 'healthy',
      service: 'Web3 Transaction Fee Predictor',
      timestamp: new Date().toISOString(),
    };
  }
}
