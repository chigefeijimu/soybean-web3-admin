import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiProperty } from '@nestjs/swagger';
import { Web3GasService } from './web3-gas.service';

class SimulateTransactionDto {
  @ApiProperty({ description: 'From address' })
  from: string;

  @ApiProperty({ description: 'To address' })
  to: string;

  @ApiProperty({ description: 'Value in wei' })
  value: string;

  @ApiProperty({ description: 'Gas price in wei' })
  gasPrice?: string;

  @ApiProperty({ description: 'Chain ID' })
  chainId: number;

  @ApiProperty({ description: 'Transaction data (hex)' })
  data?: string;
}

class EstimateGasDto {
  @ApiProperty({ description: 'From address' })
  from: string;

  @ApiProperty({ description: 'To address' })
  to: string;

  @ApiProperty({ description: 'Value in wei' })
  value?: string;

  @ApiProperty({ description: 'Chain ID' })
  chainId: number;

  @ApiProperty({ description: 'Transaction data (hex)' })
  data?: string;
}

@ApiTags('Web3 Transaction Simulator')
@Controller('api/web3/simulator')
export class Web3SimulatorController {
  constructor(private readonly gasService: Web3GasService) {}

  @Post('simulate')
  @ApiOperation({ summary: 'Simulate transaction execution' })
  @ApiBody({ type: SimulateTransactionDto })
  async simulateTransaction(@Body() dto: SimulateTransactionDto) {
    const result = await this.gasService.estimateGas(dto);
    return {
      success: true,
      simulation: {
        ...result,
        status: 'success',
        executed: false,
        timestamp: new Date().toISOString(),
        warnings: this.generateWarnings(result),
        mevExposure: this.assessMevExposure(dto),
      },
    };
  }

  @Post('estimate-gas')
  @ApiOperation({ summary: 'Estimate gas for transaction' })
  @ApiBody({ type: EstimateGasDto })
  async estimateGas(@Body() dto: EstimateGasDto) {
    return this.gasService.estimateGas(dto);
  }

  @Get('mev-protection')
  @ApiOperation({ summary: 'Get MEV protection suggestions' })
  async getMevProtection(@Query('chainId') chainId: number) {
    const gasInfo = await this.gasService.getGasPrice(chainId);
    
    // Calculate variance
    const variance = gasInfo.fast > 0 ? ((gasInfo.fast - gasInfo.slow) / gasInfo.slow) * 100 : 0;
    const average = gasInfo.normal;
    
    return {
      chainId,
      recommendations: {
        usePrivateTx: average > 50 ? 'recommended' : 'not_needed',
        setMaxPriorityFee: average > 30 ? 'recommended' : 'optional',
        setMaxFeePerGas: 'recommended',
        useProtectedRpc: 'optional',
      },
      optimalStrategy: this.calculateOptimalStrategy({ average, fast: gasInfo.fast, slow: gasInfo.slow }),
      sandwichRisk: variance > 20 ? 'high' : variance > 10 ? 'medium' : 'low',
    };
  }

  @Post('simulate-batch')
  @ApiOperation({ summary: 'Simulate multiple transactions' })
  async simulateBatch(@Body() transactions: SimulateTransactionDto[]) {
    const results = await Promise.all(
      transactions.map(async (tx) => {
        const estimate = await this.gasService.estimateGas(tx);
        return {
          ...tx,
          estimate,
        };
      })
    );

    return {
      success: true,
      count: results.length,
      results,
    };
  }

  private generateWarnings(gasEstimate: any): string[] {
    const warnings: string[] = [];
    
    if (gasEstimate.gasLimit > 500000) {
      warnings.push('High gas limit detected - verify contract execution');
    }
    
    if (gasEstimate.gasUsed && gasEstimate.gasLimit) {
      const utilization = (gasEstimate.gasUsed / gasEstimate.gasLimit) * 100;
      if (utilization > 90) {
        warnings.push('Gas utilization is very high - consider increasing limit');
      }
    }
    
    return warnings;
  }

  private assessMevExposure(tx: SimulateTransactionDto): any {
    // Simple MEV exposure assessment
    const isSwap = tx.to.toLowerCase().includes('uniswap') || 
                   tx.data?.includes('0x7ff36ab5'); // swap exact ETH for tokens
    
    return {
      risk: isSwap ? 'high' : 'low',
      reason: isSwap 
        ? 'Swap transactions are vulnerable to front-running and sandwich attacks'
        : 'Standard transfer has minimal MEV exposure',
      suggestions: isSwap 
        ? ['Use private transactions', 'Set slippage tolerance', 'Consider time-weighted average']
        : [],
    };
  }

  private calculateOptimalStrategy(gasInfo: { average: number; fast: number; slow: number }): any {
    const baseFee = gasInfo.average;
    const priorityFee = Math.max(1, baseFee * 0.1);
    
    return {
      maxFeePerGas: Math.round(baseFee * 1.2),
      maxPriorityFeePerGas: Math.round(priorityFee),
      estimatedConfirmTime: baseFee < 20 ? '< 15s' : baseFee < 50 ? '< 1m' : '< 5m',
      costSaving: gasInfo.slow > 0 && gasInfo.fast > gasInfo.slow ? 
        Math.round((1 - gasInfo.slow / gasInfo.fast) * 100) : 0,
    };
  }
}
