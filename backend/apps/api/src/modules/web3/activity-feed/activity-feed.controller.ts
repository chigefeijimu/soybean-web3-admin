import { Controller, Get, Post, Put, Delete, Body, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ActivityFeedService, ActivityFeedQuery, ActivityFeedResponse, Activity, ActivityStats } from './activity-feed.service';

@Controller('activity-feed')
export class ActivityFeedController {
  constructor(private readonly activityFeedService: ActivityFeedService) {}

  @Get('feed')
  async getFeed(
    @Query('address') address?: string,
    @Query('chains') chains?: string,
    @Query('types') types?: string,
    @Query('startTime') startTime?: string,
    @Query('endTime') endTime?: string,
    @Query('status') status?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ): Promise<ActivityFeedResponse> {
    const query: ActivityFeedQuery = {
      address,
      chains: chains ? chains.split(',') : undefined,
      types: types ? types.split(',') : undefined,
      startTime: startTime ? parseInt(startTime) : undefined,
      endTime: endTime ? parseInt(endTime) : undefined,
      status,
      limit: limit ? parseInt(limit) : 20,
      offset: offset ? parseInt(offset) : 0,
    };

    return this.activityFeedService.getActivityFeed(query);
  }

  @Get('recent')
  async getRecent(@Query('limit') limit?: string): Promise<Activity[]> {
    return this.activityFeedService.getRecentActivities(limit ? parseInt(limit) : 20);
  }

  @Get('address/:address')
  async getAddressActivities(
    @Param('address') address: string,
    @Query('limit') limit?: string,
  ): Promise<Activity[]> {
    return this.activityFeedService.getAddressActivities(address, limit ? parseInt(limit) : 50);
  }

  @Get('chain/:chain')
  async getChainActivities(
    @Param('chain') chain: string,
    @Query('limit') limit?: string,
  ): Promise<Activity[]> {
    return this.activityFeedService.getChainActivities(chain, limit ? parseInt(limit) : 50);
  }

  @Get('hash/:hash')
  async getActivityByHash(
    @Param('hash') hash: string,
    @Query('chain') chain?: string,
  ): Promise<Activity | null> {
    return this.activityFeedService.getActivityByHash(hash, chain);
  }

  @Get('id/:id')
  async getActivityById(@Param('id') id: string): Promise<Activity | null> {
    return this.activityFeedService.getActivityById(id);
  }

  @Get('stats')
  async getStats(): Promise<ActivityStats> {
    return this.activityFeedService.getStats();
  }

  @Get('search')
  async search(
    @Query('keyword') keyword: string,
    @Query('limit') limit?: string,
  ): Promise<Activity[]> {
    return this.activityFeedService.searchActivities(keyword, limit ? parseInt(limit) : 20);
  }

  @Get('timeline/:address')
  async getTimeline(
    @Param('address') address: string,
    @Query('days') days?: string,
  ): Promise<{ date: string; count: number }[]> {
    return this.activityFeedService.getActivityTimeline(address, days ? parseInt(days) : 7);
  }

  @Get('heatmap/:address')
  async getHeatmap(@Param('address') address: string): Promise<number[][]> {
    return this.activityFeedService.getActivityHeatmap(address);
  }

  @Get('chains')
  getSupportedChains(): string[] {
    return this.activityFeedService.getSupportedChains();
  }

  @Get('types')
  getActivityTypes(): string[] {
    return this.activityFeedService.getActivityTypes();
  }
}
