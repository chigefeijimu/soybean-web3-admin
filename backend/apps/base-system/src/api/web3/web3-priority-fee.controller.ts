import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';

interface HistoryEntry {
  timestamp: string;
  slow: number;
  normal: number;
  fast: number;
  instant: number;
}

@ApiTags('Web3 - Priority Fee Estimator')
@Controller('web3/priority-fee')
export class Web3PriorityFeeController {
  @Get('estimate')
  @ApiOperation({ summary: 'Estimate priority fees for different transaction speeds' })
  @ApiQuery({ name: 'chain', required: false, description: 'Chain name: ethereum, polygon, arbitrum, optimism, bsc, base, avalanche' })
  async estimatePriorityFee(@Query('chain') chain: string = 'ethereum') {
    const chainLower = (chain || 'ethereum').toLowerCase();
    
    // Base priority fee estimates (in Gwei) - these would ideally come from historical data
    const baseEstimates: Record<string, { slow: number; normal: number; fast: number; instant: number }> = {
      ethereum: { slow: 0.01, normal: 0.05, fast: 0.15, instant: 0.5 },
      polygon: { slow: 0.001, normal: 0.01, fast: 0.05, instant: 0.2 },
      arbitrum: { slow: 0.0001, normal: 0.001, fast: 0.005, instant: 0.02 },
      optimism: { slow: 0.0001, normal: 0.001, fast: 0.005, instant: 0.02 },
      bsc: { slow: 0.001, normal: 0.005, fast: 0.02, instant: 0.1 },
      base: { slow: 0.0001, normal: 0.001, fast: 0.005, instant: 0.02 },
      avalanche: { slow: 0.001, normal: 0.01, fast: 0.05, instant: 0.2 },
    };

    const estimates = baseEstimates[chainLower] || baseEstimates.ethereum;
    
    // Get current base fee estimate (simulated)
    const baseFeeEstimate = this.getBaseFeeEstimate(chainLower);
    
    // Calculate total fees for different speeds
    const result = {
      chain: chainLower,
      baseFee: baseFeeEstimate,
      priorityFee: estimates,
      totalFee: {
        slow: baseFeeEstimate + estimates.slow,
        normal: baseFeeEstimate + estimates.normal,
        fast: baseFeeEstimate + estimates.fast,
        instant: baseFeeEstimate + estimates.instant,
      },
      estimatedConfirmationTime: {
        slow: '5-15 minutes',
        normal: '1-3 minutes',
        fast: '15-60 seconds',
        instant: 'within 15 seconds',
      },
      lastUpdated: new Date().toISOString(),
    };

    return result;
  }

  @Get('history')
  @ApiOperation({ summary: 'Get historical priority fee data' })
  @ApiQuery({ name: 'chain', required: false })
  @ApiQuery({ name: 'days', required: false, description: 'Number of days (1-30)' })
  async getPriorityFeeHistory(
    @Query('chain') chain: string = 'ethereum',
    @Query('days') days: string = '7',
  ) {
    const chainLower = (chain || 'ethereum').toLowerCase();
    const daysNum = Math.min(Math.max(parseInt(days) || 7, 1), 30);
    
    // Generate simulated historical data
    const history: HistoryEntry[] = [];
    const now = Date.now();
    const baseEstimates: Record<string, number> = {
      ethereum: 0.05,
      polygon: 0.01,
      arbitrum: 0.001,
      optimism: 0.001,
      bsc: 0.005,
      base: 0.001,
      avalanche: 0.01,
    };
    const basePriority = baseEstimates[chainLower] || 0.05;

    for (let i = daysNum * 24; i >= 0; i -= 1) {
      const timestamp = now - i * 60 * 60 * 1000;
      // Add some variance
      const variance = (Math.random() - 0.5) * basePriority * 0.5;
      history.push({
        timestamp: new Date(timestamp).toISOString(),
        slow: Math.max(0.001, basePriority * 0.2 + variance),
        normal: Math.max(0.005, basePriority + variance),
        fast: Math.max(0.01, basePriority * 3 + variance),
        instant: Math.max(0.02, basePriority * 10 + variance),
      });
    }

    return {
      chain: chainLower,
      days: daysNum,
      data: history,
    };
  }

  @Get('recommended')
  @ApiOperation({ summary: 'Get recommended priority fee based on current network conditions' })
  @ApiQuery({ name: 'chain', required: false })
  @ApiQuery({ name: 'speed', required: false, description: 'slow, normal, fast, instant' })
  async getRecommendedFee(
    @Query('chain') chain: string = 'ethereum',
    @Query('speed') speed: string = 'normal',
  ) {
    const chainLower = (chain || 'ethereum').toLowerCase();
    const speedLevel = (speed || 'normal').toLowerCase();
    
    const estimates = await this.estimatePriorityFee(chainLower);
    
    return {
      chain: chainLower,
      speed: speedLevel,
      priorityFee: estimates.priorityFee[speedLevel as keyof typeof estimates.priorityFee],
      totalFee: estimates.totalFee[speedLevel as keyof typeof estimates.totalFee],
      estimatedConfirmationTime: estimates.estimatedConfirmationTime[speedLevel as keyof typeof estimates.estimatedConfirmationTime],
      gasPrice: estimates.baseFee + estimates.priorityFee[speedLevel as keyof typeof estimates.priorityFee],
      lastUpdated: estimates.lastUpdated,
    };
  }

  private getBaseFeeEstimate(chain: string): number {
    const baseFees: Record<string, number> = {
      ethereum: 0.05,
      polygon: 0.001,
      arbitrum: 0.0001,
      optimism: 0.001,
      bsc: 0.005,
      base: 0.001,
      avalanche: 0.001,
    };
    return baseFees[chain] || 0.05;
  }
}
