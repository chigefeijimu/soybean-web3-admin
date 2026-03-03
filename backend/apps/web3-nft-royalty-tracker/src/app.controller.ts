import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  health(): { status: string; timestamp: number } {
    return {
      status: 'ok',
      timestamp: Date.now(),
    };
  }

  // Get royalty stats for a collection
  @Get('api/v1/royalties/:collectionAddress')
  async getRoyaltyStats(
    @Param('collectionAddress') collectionAddress: string,
    @Query('chain') chain: string = 'ethereum',
  ) {
    return this.appService.getRoyaltyStats(collectionAddress, chain);
  }

  // Get royalty history
  @Get('api/v1/royalties/:collectionAddress/history')
  async getRoyaltyHistory(
    @Param('collectionAddress') collectionAddress: string,
    @Query('chain') chain: string = 'ethereum',
    @Query('period') period: string = '30d',
  ) {
    return this.appService.getRoyaltyHistory(collectionAddress, chain, period);
  }

  // Get creator's total royalties across collections
  @Get('api/v1/creator/:creatorAddress/total')
  async getCreatorTotalRoyalties(
    @Param('creatorAddress') creatorAddress: string,
    @Query('chains') chains: string = 'ethereum,polygon,arbitrum',
  ) {
    return this.appService.getCreatorTotalRoyalties(creatorAddress, chains);
  }

  // Get tracked collections
  @Get('api/v1/collections')
  async getTrackedCollections(
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 20,
    @Query('sortBy') sortBy: string = 'totalRoyalties',
    @Query('order') order: 'asc' | 'desc' = 'desc',
  ) {
    return this.appService.getTrackedCollections(page, pageSize, sortBy, order);
  }

  // Add collection to tracking
  @Post('api/v1/collections')
  async addCollection(
    @Body() body: { collectionAddress: string; chain: string; name?: string },
  ) {
    return this.appService.addCollection(body.collectionAddress, body.chain, body.name);
  }

  // Remove collection from tracking
  @Delete('api/v1/collections/:collectionAddress')
  async removeCollection(
    @Param('collectionAddress') collectionAddress: string,
    @Query('chain') chain: string = 'ethereum',
  ) {
    return this.appService.removeCollection(collectionAddress, chain);
  }

  // Get royalty breakdown by marketplace
  @Get('api/v1/royalties/:collectionAddress/breakdown')
  async getRoyaltyBreakdown(
    @Param('collectionAddress') collectionAddress: string,
    @Query('chain') chain: string = 'ethereum',
  ) {
    return this.appService.getRoyaltyBreakdown(collectionAddress, chain);
  }

  // Get top royalty earners
  @Get('api/v1/leaderboard')
  async getTopRoyaltyEarners(
    @Query('period') period: string = '30d',
    @Query('limit') limit: number = 50,
  ) {
    return this.appService.getTopRoyaltyEarners(period, limit);
  }

  // Get marketplace royalty rates
  @Get('api/v1/marketplaces')
  async getMarketplaces() {
    return this.appService.getMarketplaces();
  }

  // Set alert for royalty milestone
  @Post('api/v1/alerts')
  async setRoyaltyAlert(
    @Body() body: {
      collectionAddress: string;
      chain: string;
      threshold: number;
      type: 'above' | 'below';
    },
  ) {
    return this.appService.setRoyaltyAlert(body);
  }

  // Get alerts
  @Get('api/v1/alerts')
  async getAlerts(@Query('address') address?: string) {
    return this.appService.getAlerts(address);
  }

  // Delete alert
  @Delete('api/v1/alerts/:id')
  async deleteAlert(@Param('id') id: string) {
    return this.appService.deleteAlert(id);
  }

  // Dashboard stats
  @Get('api/v1/dashboard/stats')
  async getDashboardStats() {
    return this.appService.getDashboardStats();
  }

  // Search collections
  @Get('api/v1/search')
  async searchCollections(@Query('q') query: string) {
    return this.appService.searchCollections(query);
  }

  // Get collection details
  @Get('api/v1/collections/:collectionAddress')
  async getCollectionDetails(
    @Param('collectionAddress') collectionAddress: string,
    @Query('chain') chain: string = 'ethereum',
  ) {
    return this.appService.getCollectionDetails(collectionAddress, chain);
  }

  // Export royalties data
  @Get('api/v1/royalties/:collectionAddress/export')
  async exportRoyalties(
    @Param('collectionAddress') collectionAddress: string,
    @Query('chain') chain: string = 'ethereum',
    @Query('format') format: string = 'csv',
  ) {
    return this.appService.exportRoyalties(collectionAddress, chain, format);
  }
}
