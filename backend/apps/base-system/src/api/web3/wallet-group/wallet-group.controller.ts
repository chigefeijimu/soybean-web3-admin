import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { WalletGroupService } from './wallet-group.service';

class AnalyzeGroupDto {
  addresses: string[];
  chains?: string[];
}

class CompareGroupsDto {
  group1: string[];
  group2: string[];
}

class ActivityTimelineDto {
  addresses: string[];
  days?: number;
}

@Controller('web3/wallet-group')
export class WalletGroupController {
  constructor(private readonly walletGroupService: WalletGroupService) {}

  /**
   * Analyze a group of wallets
   */
  @Post('analyze')
  async analyzeGroup(@Body() dto: AnalyzeGroupDto) {
    const { addresses, chains = ['eth', 'polygon', 'arbitrum'] } = dto;
    return this.walletGroupService.analyzeGroup(addresses, chains);
  }

  /**
   * Compare two wallet groups
   */
  @Post('compare')
  async compareGroups(@Body() dto: CompareGroupsDto) {
    const { group1, group2 } = dto;
    return this.walletGroupService.compareGroups(group1, group2);
  }

  /**
   * Get group activity timeline
   */
  @Get('timeline')
  async getActivityTimeline(
    @Query('addresses') addresses: string,
    @Query('days') days: string = '30',
  ) {
    const addressList = addresses.split(',').filter(Boolean);
    const daysNum = parseInt(days, 10) || 30;
    return this.walletGroupService.getGroupActivityTimeline(addressList, daysNum);
  }

  /**
   * Get top holders across wallets
   */
  @Get('top-holders')
  async getTopHolders(@Query('addresses') addresses: string) {
    const addressList = addresses.split(',').filter(Boolean);
    const result = await this.walletGroupService.analyzeGroup(addressList);
    return {
      topHolders: result.wallets.sort((a, b) => b.totalBalanceUSD - a.totalBalanceUSD),
      totalValue: result.summary.totalBalanceUSD,
    };
  }
}
