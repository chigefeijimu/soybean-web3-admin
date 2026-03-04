import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { GasOptimizerService } from '../service/gas-optimizer.service';
import {
  OptimizeGasDto,
  GetGasHistoryDto,
  GetOptimalTimeDto,
  GasStrategyDto,
  ChainId,
  DefiActionType,
} from '../dto/gas-optimizer.dto';

@ApiTags('DeFi Gas Optimizer')
@Controller('defi-gas-optimizer')
export class GasOptimizerController {
  constructor(private readonly gasOptimizerService: GasOptimizerService) {}

  @Post('optimize')
  @ApiOperation({ 
    summary: 'Get optimal gas recommendation',
    description: 'Calculate optimal gas price based on chain, action type, and user preferences'
  })
  @ApiResponse({ status: 200, description: 'Optimal gas recommendation returned' })
  async optimizeGas(@Body() dto: OptimizeGasDto) {
    return this.gasOptimizerService.getOptimalGas({
      chainId: dto.chainId,
      actionType: dto.actionType,
      strategyType: dto.strategyType,
      timePreference: dto.timePreference,
      estimatedValue: dto.estimatedValue,
      walletAddress: dto.walletAddress,
    });
  }

  @Get('history')
  @ApiOperation({ 
    summary: 'Get gas price history',
    description: 'Retrieve historical gas prices for analysis'
  })
  @ApiQuery({ name: 'chainId', enum: ChainId })
  @ApiQuery({ name: 'days', required: false, type: Number })
  @ApiQuery({ name: 'actionType', required: false, enum: DefiActionType })
  async getGasHistory(
    @Query('chainId') chainId: ChainId,
    @Query('days') days?: number,
    @Query('actionType') actionType?: DefiActionType,
  ) {
    return this.gasOptimizerService.getGasHistory(
      chainId,
      days || 7,
      actionType,
    );
  }

  @Get('optimal-time')
  @ApiOperation({ 
    summary: 'Get optimal time slots for transactions',
    description: 'Find the best hours to execute transactions for gas savings'
  })
  @ApiQuery({ name: 'chainId', enum: ChainId })
  @ApiQuery({ name: 'hoursAhead', required: false, type: Number })
  async getOptimalTime(
    @Query('chainId') chainId: ChainId,
    @Query('hoursAhead') hoursAhead?: number,
  ) {
    return this.gasOptimizerService.getOptimalTimeSlots(
      chainId,
      hoursAhead || 24,
    );
  }

  @Post('strategy')
  @ApiOperation({ 
    summary: 'Get personalized gas strategy',
    description: 'Analyze wallet activity and recommend optimal gas strategy'
  })
  async getGasStrategy(@Body() dto: GasStrategyDto) {
    return this.gasOptimizerService.getGasStrategy(
      dto.walletAddress,
      dto.chainId,
    );
  }

  @Get('compare')
  @ApiOperation({ 
    summary: 'Compare gas costs across chains',
    description: 'Get gas cost comparison for different chains'
  })
  async getGasComparison() {
    return this.gasOptimizerService.getGasComparison();
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check' })
  health() {
    return { status: 'ok', service: 'DeFi Gas Optimizer' };
  }
}
