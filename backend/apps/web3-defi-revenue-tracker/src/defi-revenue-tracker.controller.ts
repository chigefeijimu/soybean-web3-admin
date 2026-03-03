import { Controller, Get, Post, Delete, Param, Query, Body } from '@nestjs/common';
import { DefiRevenueTrackerService, ProtocolRevenue, RevenueMetrics, RevenueComparison, ProtocolFee, RevenueAlert } from './defi-revenue-tracker.service';

@Controller('defi-revenue-tracker')
export class DefiRevenueTrackerController {
  constructor(private readonly revenueTrackerService: DefiRevenueTrackerService) {}

  /**
   * Get all protocol revenues
   */
  @Get('protocols')
  getProtocolRevenues(): ProtocolRevenue[] {
    return this.revenueTrackerService.getProtocolRevenues();
  }

  /**
   * Get revenue for a specific protocol
   */
  @Get('protocols/:protocol')
  getProtocolRevenue(@Param('protocol') protocol: string): ProtocolRevenue | undefined {
    return this.revenueTrackerService.getProtocolRevenue(protocol);
  }

  /**
   * Get revenues by chain
   */
  @Get('by-chain')
  getRevenuesByChain(@Query('chain') chain?: string): ProtocolRevenue[] {
    return this.revenueTrackerService.getRevenuesByChain(chain);
  }

  /**
   * Get revenues by category
   */
  @Get('by-category')
  getRevenuesByCategory(@Query('category') category: string): ProtocolRevenue[] {
    return this.revenueTrackerService.getRevenuesByCategory(category);
  }

  /**
   * Get overall revenue metrics
   */
  @Get('metrics')
  getRevenueMetrics(): RevenueMetrics {
    return this.revenueTrackerService.getRevenueMetrics();
  }

  /**
   * Compare multiple protocols
   */
  @Post('compare')
  compareProtocols(@Body('protocols') protocols: string[]): RevenueComparison {
    return this.revenueTrackerService.compareProtocols(protocols);
  }

  /**
   * Get protocol fees breakdown
   */
  @Get('fees')
  getProtocolFees(): ProtocolFee[] {
    return this.revenueTrackerService.getProtocolFees();
  }

  /**
   * Get revenue history
   */
  @Get('history')
  getRevenueHistory(
    @Query('protocol') protocol?: string,
    @Query('days') days?: string
  ): { date: string; revenue: number }[] {
    return this.revenueTrackerService.getRevenueHistory(
      protocol,
      days ? parseInt(days) : 30
    );
  }

  /**
   * Get revenue sources for a protocol
   */
  @Get('sources/:protocol')
  getRevenueSources(@Param('protocol') protocol: string) {
    return this.revenueTrackerService.getRevenueSources(protocol);
  }

  /**
   * Get token holder distribution
   */
  @Get('distribution/:protocol')
  getTokenHolderDistribution(@Param('protocol') protocol: string) {
    return this.revenueTrackerService.getTokenHolderDistribution(protocol);
  }

  /**
   * Get revenue alerts
   */
  @Get('alerts')
  getAlerts(): RevenueAlert[] {
    return this.revenueTrackerService.getAlerts();
  }

  /**
   * Create revenue alert
   */
  @Post('alerts')
  createAlert(
    @Body() body: { protocol: string; threshold: number; condition: 'above' | 'below' }
  ): RevenueAlert {
    return this.revenueTrackerService.createAlert(
      body.protocol,
      body.threshold,
      body.condition
    );
  }

  /**
   * Delete revenue alert
   */
  @Delete('alerts/:id')
  deleteAlert(@Param('id') id: string): { success: boolean } {
    return { success: this.revenueTrackerService.deleteAlert(id) };
  }
}
