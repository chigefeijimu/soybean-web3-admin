import { Controller, Post, Get, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { DefiRiskAdjustedReturnsService } from '../service/defi-risk-adjusted-returns.service';
import {
  CalculateRiskAdjustedReturnsDto,
  RiskAdjustedReturnsResponseDto,
  ProtocolDto,
  ChainDto,
} from '../dto/defi-risk-adjusted-returns.dto';

@ApiTags('DeFi Risk-Adjusted Returns')
@Controller('defi-risk-adjusted-returns')
export class DefiRiskAdjustedReturnsController {
  constructor(private readonly defiRiskAdjustedReturnsService: DefiRiskAdjustedReturnsService) {}

  @Post('calculate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Calculate risk-adjusted returns for a DeFi pool',
    description:
      'Analyzes a liquidity pool investment considering APY, impermanent loss, gas costs, and volatility to provide a comprehensive risk-adjusted return score.',
  })
  @ApiBody({ type: CalculateRiskAdjustedReturnsDto })
  @ApiResponse({
    status: 200,
    description: 'Risk-adjusted returns calculation result',
    type: RiskAdjustedReturnsResponseDto,
  })
  async calculate(@Body() dto: CalculateRiskAdjustedReturnsDto): Promise<RiskAdjustedReturnsResponseDto> {
    return this.defiRiskAdjustedReturnsService.calculateRiskAdjustedReturns(dto);
  }

  @Post('compare')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Compare multiple DeFi pools',
    description: 'Compare risk-adjusted returns across multiple pools and rank them by score.',
  })
  @ApiBody({ type: [CalculateRiskAdjustedReturnsDto] })
  @ApiResponse({
    status: 200,
    description: 'Comparison results sorted by risk-adjusted score',
    type: [RiskAdjustedReturnsResponseDto],
  })
  async compare(@Body() pools: CalculateRiskAdjustedReturnsDto[]): Promise<RiskAdjustedReturnsResponseDto[]> {
    return this.defiRiskAdjustedReturnsService.comparePools(pools);
  }

  @Get('protocols')
  @ApiOperation({
    summary: 'Get supported DeFi protocols',
    description: 'Returns a list of supported DeFi protocols and their supported chains.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of supported protocols',
    type: [ProtocolDto],
  })
  async getProtocols(): Promise<ProtocolDto[]> {
    return this.defiRiskAdjustedReturnsService.getProtocols();
  }

  @Get('chains')
  @ApiOperation({
    summary: 'Get supported chains',
    description: 'Returns a list of supported blockchain networks.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of supported chains',
    type: [ChainDto],
  })
  async getChains(): Promise<ChainDto[]> {
    return this.defiRiskAdjustedReturnsService.getChains();
  }
}
