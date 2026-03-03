import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { DaoDelegateLeaderboardService } from '../services/dao-delegate-leaderboard.service';
import { QueryLeaderboardDto, QueryDelegateDto, CreateAlertDto } from '../dto/dao-delegate-leaderboard.dto';

@Controller('dao-delegate-leaderboard')
export class DaoDelegateLeaderboardController {
  constructor(private readonly service: DaoDelegateLeaderboardService) {}

  @Get()
  async getLeaderboard(@Query() query: QueryLeaderboardDto) {
    return this.service.getLeaderboard(query);
  }

  @Get('delegate/:walletAddress')
  async getDelegateDetails(
    @Param('walletAddress') walletAddress: string,
    @Query('daoName') daoName?: string,
  ) {
    return this.service.getDelegateDetails(walletAddress, daoName);
  }

  @Get('daos/list')
  async getDaos() {
    return this.service.getDaos();
  }

  @Get('stats/:daoName')
  async getDaoLeaderboardStats(@Param('daoName') daoName: string) {
    return this.service.getDaoLeaderboardStats(daoName);
  }

  @Post('compare/:daoName')
  async compareDelegates(
    @Param('daoName') daoName: string,
    @Body() body: { addresses: string[] },
  ) {
    return this.service.getDelegateComparison(daoName, body.addresses);
  }

  @Get('search')
  async searchDelegates(@Query('q') query: string) {
    return this.service.getDelegateSearch(query);
  }

  @Get('trending')
  async getTrendingDelegates(
    @Query('daoName') daoName?: string,
    @Query('limit') limit?: number,
  ) {
    return this.service.getTrendingDelegates(daoName, limit ? parseInt(limit.toString()) : 10);
  }

  @Post('refresh')
  async refreshLeaderboard(@Body() body: { daoName?: string }) {
    return this.service.refreshLeaderboard(body.daoName);
  }

  // Alerts
  @Post('alerts')
  async createAlert(@Body() dto: CreateAlertDto) {
    return this.service.createAlert(dto);
  }

  @Get('alerts')
  async getAlerts(@Query('walletAddress') walletAddress?: string) {
    return this.service.getAlerts(walletAddress);
  }

  @Put('alerts/:id')
  async updateAlert(
    @Param('id') id: string,
    @Body() body: { enabled?: boolean; threshold?: number },
  ) {
    return this.service.updateAlert(parseInt(id), body);
  }

  @Delete('alerts/:id')
  async deleteAlert(@Param('id') id: string) {
    return this.service.deleteAlert(parseInt(id));
  }
}
