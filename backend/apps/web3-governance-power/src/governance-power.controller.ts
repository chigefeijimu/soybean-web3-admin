import { Controller, Get, Post, Query, Body, Param } from '@nestjs/common';
import { GovernancePowerService } from './governance-power.service';

@Controller('governance-power')
export class GovernancePowerController {
  constructor(private readonly governancePowerService: GovernancePowerService) {}

  /**
   * GET /api/governance-power/voting-power/:address
   * Get voting power for a specific address across all supported DAOs
   */
  @Get('voting-power/:address')
  async getVotingPower(
    @Param('address') address: string,
    @Query('dao') dao?: string,
  ) {
    const result = await this.governancePowerService.getVotingPower(address, dao);
    return { success: true, data: result };
  }

  /**
   * GET /api/governance-power/delegates/:daoId
   * Get delegate list for a specific DAO
   */
  @Get('delegates/:daoId')
  async getDelegates(
    @Param('daoId') daoId: string,
  ) {
    const result = await this.governancePowerService.getDelegates(daoId);
    return { success: true, data: result };
  }

  /**
   * GET /api/governance-power/proposals/:daoId
   * Get governance proposals for a DAO
   */
  @Get('proposals/:daoId')
  async getProposals(
    @Param('daoId') daoId: string,
    @Query('status') status?: string,
  ) {
    const result = await this.governancePowerService.getProposals(daoId, status);
    return { success: true, data: result };
  }

  /**
   * GET /api/governance-power/delegate/:address
   * Get delegate information for a specific address
   */
  @Get('delegate/:address')
  async getUserDelegate(
    @Param('address') address: string,
    @Query('dao') dao?: string,
  ) {
    const result = await this.governancePowerService.getUserDelegate(address, dao);
    return { success: true, data: result };
  }

  /**
   * GET /api/governance-power/analytics/:address
   * Get comprehensive governance power analytics
   */
  @Get('analytics/:address')
  async getPowerAnalytics(
    @Param('address') address: string,
  ) {
    const result = await this.governancePowerService.getPowerAnalytics(address);
    return { success: true, data: result };
  }

  /**
   * GET /api/governance-power/history/:address
   * Get historical voting power data
   */
  @Get('history/:address')
  async getPowerHistory(
    @Param('address') address: string,
    @Query('dao') dao: string = 'uniswap',
    @Query('days') days: string = '90',
  ) {
    const result = await this.governancePowerService.getPowerHistory(
      address, 
      dao, 
      parseInt(days)
    );
    return { success: true, data: result };
  }

  /**
   * POST /api/governance-power/compare
   * Compare voting power between two addresses
   */
  @Post('compare')
  async comparePower(
    @Body() body: { address1: string; address2: string },
  ) {
    const { address1, address2 } = body;
    
    if (!address1 || !address2) {
      return { success: false, error: 'Both address1 and address2 are required' };
    }

    const result = await this.governancePowerService.comparePower(address1, address2);
    return { success: true, data: result };
  }

  /**
   * GET /api/governance-power/daos
   * Get list of supported DAOs
   */
  @Get('daos')
  getSupportedDaos() {
    const result = this.governancePowerService.getSupportedDaos();
    return { success: true, data: result };
  }

  /**
   * GET /api/governance-power/health
   * Health check endpoint
   */
  @Get('health')
  healthCheck() {
    return { 
      success: true, 
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'Governance Power Tracker',
      version: '1.0.0',
    };
  }
}
