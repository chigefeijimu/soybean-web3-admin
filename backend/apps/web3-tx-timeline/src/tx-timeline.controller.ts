import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { TxTimelineService } from './tx-timeline.service';

@ApiTags('Transaction Timeline')
@Controller('tx-timeline')
export class TxTimelineController {
  constructor(private readonly txTimelineService: TxTimelineService) {}

  @Get('timeline/:address')
  @ApiOperation({ summary: 'Get transaction timeline for an address' })
  @ApiQuery({ name: 'chain', required: false, description: 'Chain name (ethereum, polygon, arbitrum, etc.)' })
  @ApiQuery({ name: 'period', required: false, description: 'Group by: day, week, or month' })
  @ApiQuery({ name: 'days', required: false, description: 'Number of days to look back (default 30)' })
  async getTimeline(
    @Param('address') address: string,
    @Query('chain') chain?: string,
    @Query('period') period?: 'day' | 'week' | 'month',
    @Query('days') days?: string,
  ) {
    return this.txTimelineService.getTransactionTimeline(
      address,
      chain || 'ethereum',
      period || 'day',
      days ? parseInt(days) : 30,
    );
  }

  @Get('patterns/:address')
  @ApiOperation({ summary: 'Get transaction patterns for an address' })
  @ApiQuery({ name: 'chain', required: false, description: 'Chain name' })
  async getPatterns(
    @Param('address') address: string,
    @Query('chain') chain?: string,
  ) {
    return this.txTimelineService.getTransactionPatterns(address, chain || 'ethereum');
  }

  @Get('distribution/:address')
  @ApiOperation({ summary: 'Get hourly and daily distribution of transactions' })
  @ApiQuery({ name: 'chain', required: false, description: 'Chain name' })
  async getDistribution(
    @Param('address') address: string,
    @Query('chain') chain?: string,
  ) {
    return this.txTimelineService.getHourlyDistribution(address, chain || 'ethereum');
  }

  @Get('chains')
  @ApiOperation({ summary: 'Get supported chains' })
  async getChains() {
    return {
      chains: this.txTimelineService.getSupportedChains(),
    };
  }
}
