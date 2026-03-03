import { Controller, Get, Post, Put, Delete, Body, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { WalletGroupPortfolioService } from './wallet-group-portfolio.service';

@Controller('web3/wallet-group')
export class WalletGroupPortfolioController {
  constructor(private readonly service: WalletGroupPortfolioService) {}

  /**
   * Create a new wallet group
   */
  @Post()
  async createGroup(
    @Body() body: { name: string; description?: string; wallets?: string[] }
  ): Promise<any> {
    return this.service.createGroup(body.name, body.description, body.wallets);
  }

  /**
   * Get all wallet groups
   */
  @Get()
  async getAllGroups(): Promise<any[]> {
    return this.service.getAllGroups();
  }

  /**
   * Get group by ID
   */
  @Get(':id')
  async getGroup(@Param('id') id: string): Promise<any | null> {
    return this.service.getGroup(id);
  }

  /**
   * Update wallet group
   */
  @Put(':id')
  async updateGroup(
    @Param('id') id: string,
    @Body() body: { name?: string; description?: string }
  ): Promise<any | null> {
    return this.service.updateGroup(id, body);
  }

  /**
   * Delete wallet group
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteGroup(@Param('id') id: string): Promise<void> {
    await this.service.deleteGroup(id);
  }

  /**
   * Add wallet to group
   */
  @Post(':id/wallets')
  async addWallet(
    @Param('id') id: string,
    @Body() body: { wallet: string }
  ): Promise<any | null> {
    return this.service.addWalletToGroup(id, body.wallet);
  }

  /**
   * Remove wallet from group
   */
  @Delete(':id/wallets/:wallet')
  async removeWallet(
    @Param('id') id: string,
    @Param('wallet') wallet: string
  ): Promise<any | null> {
    return this.service.removeWalletFromGroup(id, wallet);
  }

  /**
   * Get aggregated portfolio for a group
   */
  @Get(':id/portfolio')
  async getGroupPortfolio(@Param('id') id: string): Promise<any | null> {
    return this.service.getGroupPortfolio(id);
  }

  /**
   * Get wallet analysis for group
   */
  @Get(':id/analysis')
  async getGroupAnalysis(@Param('id') id: string): Promise<any | null> {
    return this.service.getGroupWalletAnalysis(id);
  }

  /**
   * Compare two groups
   */
  @Get('compare/:id1/:id2')
  async compareGroups(
    @Param('id1') id1: string,
    @Param('id2') id2: string
  ): Promise<any | null> {
    return this.service.compareGroups(id1, id2);
  }

  /**
   * Get group activity timeline
   */
  @Get(':id/timeline')
  async getGroupTimeline(
    @Param('id') id: string,
    @Query('days') days?: number
  ): Promise<any | null> {
    return this.service.getGroupActivityTimeline(id, days || 30);
  }

  /**
   * Generate group performance report
   */
  @Get(':id/report')
  async generateReport(@Param('id') id: string): Promise<any | null> {
    return this.service.generateGroupReport(id);
  }
}
