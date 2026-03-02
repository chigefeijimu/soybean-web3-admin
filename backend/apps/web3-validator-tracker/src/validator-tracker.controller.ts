import { Controller, Get, Post, Query, Body, Param } from '@nestjs/common';
import { ValidatorTrackerService } from './validator-tracker.service';

@Controller('api/validator')
export class ValidatorTrackerController {
  constructor(private readonly validatorTrackerService: ValidatorTrackerService) {}

  /**
   * GET /api/validator/chains
   * Get supported chains
   */
  @Get('chains')
  getSupportedChains() {
    return {
      success: true,
      data: this.validatorTrackerService.getSupportedChains(),
    };
  }

  /**
   * GET /api/validator/:chain
   * Get validators for a specific chain
   */
  @Get(':chain')
  async getValidators(
    @Param('chain') chain: string,
    @Query('status') status?: string,
  ) {
    try {
      const validators = await this.validatorTrackerService.getValidators(chain, status);
      return { success: true, data: validators };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * GET /api/validator/:chain/top
   * Get top validators for a chain
   */
  @Get(':chain/top')
  async getTopValidators(
    @Param('chain') chain: string,
    @Query('limit') limit: string = '10',
  ) {
    try {
      const validators = await this.validatorTrackerService.getTopValidators(
        chain,
        parseInt(limit),
      );
      return { success: true, data: validators };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * GET /api/validator/:chain/stats
   * Get chain statistics
   */
  @Get(':chain/stats')
  async getChainStats(@Param('chain') chain: string) {
    try {
      const stats = await this.validatorTrackerService.getChainStats(chain);
      return { success: true, data: stats };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * GET /api/validator/:chain/address/:address
   * Get validator by address
   */
  @Get(':chain/address/:address')
  async getValidatorByAddress(
    @Param('chain') chain: string,
    @Param('address') address: string,
  ) {
    try {
      const validator = await this.validatorTrackerService.getValidatorByAddress(
        chain,
        address,
      );
      
      if (!validator) {
        return { success: false, error: 'Validator not found' };
      }
      
      return { success: true, data: validator };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * GET /api/validator/:chain/performance/:address
   * Get validator performance metrics
   */
  @Get(':chain/performance/:address')
  async getValidatorPerformance(
    @Param('chain') chain: string,
    @Param('address') address: string,
    @Query('days') days: string = '30',
  ) {
    try {
      const performance = await this.validatorTrackerService.getValidatorPerformance(
        chain,
        address,
        parseInt(days),
      );
      
      if (!performance) {
        return { success: false, error: 'Validator not found' };
      }
      
      return { success: true, data: performance };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * POST /api/validator/:chain/compare
   * Compare multiple validators
   */
  @Post(':chain/compare')
  async compareValidators(
    @Param('chain') chain: string,
    @Body() body: { addresses: string[] },
  ) {
    try {
      const { addresses } = body;
      
      if (!addresses || !Array.isArray(addresses)) {
        return { success: false, error: 'addresses must be an array' };
      }
      
      const comparison = await this.validatorTrackerService.compareValidators(
        chain,
        addresses,
      );
      
      return { success: true, data: comparison };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * GET /api/validator/:chain/pools
   * Get staking pools for a chain
   */
  @Get(':chain/pools')
  async getStakingPools(@Param('chain') chain: string) {
    try {
      const pools = await this.validatorTrackerService.getStakingPools(chain);
      return { success: true, data: pools };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * GET /api/validator/health
   * Health check endpoint
   */
  @Get('health')
  health() {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'Validator Performance Tracker API',
    };
  }

  /**
   * GET /api/validator
   * API info endpoint
   */
  @Get()
  getApiInfo() {
    return {
      name: 'Validator Performance Tracker API',
      version: '1.0.0',
      description: 'Track validator performance across multiple chains',
      endpoints: {
        'GET /api/validator/chains': 'Get supported chains',
        'GET /api/validator/:chain': 'Get validators for a chain',
        'GET /api/validator/:chain/top': 'Get top validators',
        'GET /api/validator/:chain/stats': 'Get chain statistics',
        'GET /api/validator/:chain/address/:address': 'Get validator by address',
        'GET /api/validator/:chain/performance/:address': 'Get validator performance',
        'POST /api/validator/:chain/compare': 'Compare validators',
        'GET /api/validator/:chain/pools': 'Get staking pools',
      },
    };
  }
}
