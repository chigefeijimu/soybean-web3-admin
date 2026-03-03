import { Controller, Get, Post, Body, Param, Query, Put, Delete } from '@nestjs/common';
import { LiquidityHeatmapService } from './liquidity-heatmap.service';

@Controller('web3/liquidity-heatmap')
export class LiquidityHeatmapController {
  constructor(private readonly liquidityHeatmapService: LiquidityHeatmapService) {}

  @Get('overview')
  async getOverview() {
    return this.liquidityHeatmapService.getLiquidityOverview();
  }

  @Get('heatmap')
  async getHeatmap(
    @Query('chain') chain?: string,
    @Query('token') token?: string,
  ) {
    return this.liquidityHeatmapService.getLiquidityHeatmap(chain, token);
  }

  @Get('dex/:dex')
  async getDexLiquidity(
    @Param('dex') dex: string,
    @Query('chain') chain?: string,
  ) {
    return this.liquidityHeatmapService.getDexLiquidity(dex, chain);
  }

  @Get('chain/:chain')
  async getChainLiquidity(@Param('chain') chain: string) {
    return this.liquidityHeatmapService.getChainLiquidity(chain);
  }

  @Get('token-pair/:token0/:token1')
  async getTokenPairLiquidity(
    @Param('token0') token0: string,
    @Param('token1') token1: string,
    @Query('chains') chains?: string,
  ) {
    return this.liquidityHeatmapService.getTokenPairLiquidity(token0, token1, chains);
  }

  @Get('top-pools')
  async getTopPools(
    @Query('chain') chain?: string,
    @Query('limit') limit?: number,
  ) {
    return this.liquidityHeatmapService.getTopPools(chain, limit);
  }

  @Get('comparison')
  async getLiquidityComparison(
    @Query('token0') token0: string,
    @Query('token1') token1: string,
  ) {
    return this.liquidityHeatmapService.compareLiquidity(token0, token1);
  }

  @Get('trends')
  async getLiquidityTrends(
    @Query('days') days?: number,
  ) {
    return this.liquidityHeatmapService.getLiquidityTrends(days);
  }

  @Get('alerts')
  async getAlerts() {
    return this.liquidityHeatmapService.getLiquidityAlerts();
  }

  @Post('alerts')
  async createAlert(@Body() alert: any) {
    return this.liquidityHeatmapService.createAlert(alert);
  }

  @Get('statistics')
  async getStatistics() {
    return this.liquidityHeatmapService.getStatistics();
  }

  @Get('chains')
  async getSupportedChains() {
    return this.liquidityHeatmapService.getSupportedChains();
  }

  @Get('dexes')
  async getSupportedDexes() {
    return this.liquidityHeatmapService.getSupportedDexes();
  }

  @Get('tokens')
  async getTrackedTokens() {
    return this.liquidityHeatmapService.getTrackedTokens();
  }
}
