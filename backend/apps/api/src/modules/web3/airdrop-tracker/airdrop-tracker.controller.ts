import { Controller, Get, Post, Param, Query, Body } from '@nestjs/common';
import { AirdropTrackerService } from './airdrop-tracker.service';

@Controller('airdrop-tracker')
export class AirdropTrackerController {
  constructor(private readonly airdropTrackerService: AirdropTrackerService) {}

  @Get('chains')
  async getSupportedChains() {
    return this.airdropTrackerService.getSupportedChains();
  }

  @Get('projects')
  async getAirdropProjects(
    @Query('chain') chain?: string,
    @Query('status') status?: 'upcoming' | 'active' | 'ended',
  ) {
    return this.airdropTrackerService.getAirdropProjects({ chain, status });
  }

  @Get('projects/:id')
  async getAirdropProject(@Param('id') id: string) {
    return this.airdropTrackerService.getAirdropProject(id);
  }

  @Get('wallet/:wallet')
  async getWalletAirdropSummary(@Param('wallet') wallet: string) {
    return this.airdropTrackerService.getWalletAirdropSummary(wallet);
  }

  @Get('wallet/:wallet/history')
  async getAirdropHistory(@Param('wallet') wallet: string) {
    return this.airdropTrackerService.getAirdropHistory(wallet);
  }

  @Get('wallet/:wallet/alerts')
  async getAirdropAlerts(@Param('wallet') wallet: string) {
    return this.airdropTrackerService.getAirdropAlerts(wallet);
  }

  @Get('eligibility/:projectId')
  async checkEligibility(
    @Param('projectId') projectId: string,
    @Query('wallet') wallet: string,
  ) {
    return this.airdropTrackerService.getEligibilityCheck(wallet, projectId);
  }

  @Get('stats')
  async getAirdropStats() {
    return this.airdropTrackerService.getAirdropStats();
  }
}
