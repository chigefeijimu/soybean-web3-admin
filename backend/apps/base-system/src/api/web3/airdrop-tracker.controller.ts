import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { AirdropTrackerService, AirdropProject, WalletAirdropStatus } from './airdrop-tracker.service';

@Controller('airdrop-tracker')
export class AirdropTrackerController {
  constructor(private readonly airdropTrackerService: AirdropTrackerService) {}

  /**
   * Get all airdrop projects
   */
  @Get('projects')
  async getProjects(): Promise<AirdropProject[]> {
    return this.airdropTrackerService.getProjects();
  }

  /**
   * Get active airdrop projects
   */
  @Get('projects/active')
  async getActiveProjects(): Promise<AirdropProject[]> {
    return this.airdropTrackerService.getActiveProjects();
  }

  /**
   * Get project details by ID
   */
  @Get('projects/:id')
  async getProjectDetails(@Param('id') id: string): Promise<AirdropProject | null> {
    return this.airdropTrackerService.getProjectDetails(id);
  }

  /**
   * Get airdrops by chain
   */
  @Get('projects/chain/:chain')
  async getAirdropsByChain(@Param('chain') chain: string): Promise<AirdropProject[]> {
    return this.airdropTrackerService.getAirdropsByChain(chain);
  }

  /**
   * Get upcoming airdrops
   */
  @Get('upcoming')
  async getUpcomingAirdrops(): Promise<AirdropProject[]> {
    return this.airdropTrackerService.getUpcomingAirdrops();
  }

  /**
   * Check airdrop status for a wallet address
   */
  @Get('check/:address')
  async checkWalletAirdrops(@Param('address') address: string): Promise<WalletAirdropStatus> {
    return this.airdropTrackerService.checkWalletAirdrops(address);
  }

  /**
   * Get airdrop statistics
   */
  @Get('stats')
  async getStats() {
    return this.airdropTrackerService.getStats();
  }
}
