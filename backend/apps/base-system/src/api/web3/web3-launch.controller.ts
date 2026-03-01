import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Web3LaunchService } from './web3-launch.service';

@ApiTags('Web3 Token Launch')
@Controller('web3/launch')
export class Web3LaunchController {
  constructor(private readonly web3LaunchService: Web3LaunchService) {}

  @Get('upcoming')
  @ApiOperation({ summary: '获取即将到来的代币发售列表' })
  async getUpcomingLaunches(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('platform') platform?: string,
  ) {
    return this.web3LaunchService.getUpcomingLaunches(page, limit, platform);
  }

  @Get('airdrops')
  @ApiOperation({ summary: '获取即将到来的空投列表' })
  async getAirdrops(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.web3LaunchService.getAirdrops(page, limit);
  }

  @Get('detail')
  @ApiOperation({ summary: '获取代币发售详情' })
  async getLaunchDetail(
    @Query('id') id: string,
  ) {
    return this.web3LaunchService.getLaunchDetail(id);
  }

  @Get('platforms')
  @ApiOperation({ summary: '获取支持的发射平台' })
  async getPlatforms() {
    return this.web3LaunchService.getPlatforms();
  }

  @Get('calendar')
  @ApiOperation({ summary: '获取代币发售日历' })
  async getCalendar(
    @Query('month') month: number,
    @Query('year') year: number,
  ) {
    return this.web3LaunchService.getCalendar(month, year);
  }

  @Get('trending')
  @ApiOperation({ summary: '获取热门即将发售代币' })
  async getTrendingLaunches() {
    return this.web3LaunchService.getTrendingLaunches();
  }

  @Get('my-tracked')
  @ApiOperation({ summary: '获取用户追踪的发售' })
  async getTrackedLaunches(
    @Query('address') address: string,
  ) {
    return this.web3LaunchService.getTrackedLaunches(address);
  }

  @Get('track')
  @ApiOperation({ summary: '追踪代币发售' })
  async trackLaunch(
    @Query('address') address: string,
    @Query('launchId') launchId: string,
  ) {
    return this.web3LaunchService.trackLaunch(address, launchId);
  }

  @Get('untrack')
  @ApiOperation({ summary: '取消追踪代币发售' })
  async untrackLaunch(
    @Query('address') address: string,
    @Query('launchId') launchId: string,
  ) {
    return this.web3LaunchService.untrackLaunch(address, launchId);
  }
}
