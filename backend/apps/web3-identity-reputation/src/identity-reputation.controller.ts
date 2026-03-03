import { Controller, Get, Post, Body, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { IdentityReputationService } from './identity-reputation.service';

@Controller('web3/identity')
export class IdentityReputationController {
  constructor(private readonly identityService: IdentityReputationService) {}

  /**
   * Generate verification message for signature
   */
  @Get('verify-message')
  getVerificationMessage(
    @Query('type') type: 'sign' | 'login' | 'attest' = 'sign',
    @Query('domain') domain?: string
  ): { message: string } {
    return {
      message: this.identityService.generateVerificationMessage(type, domain),
    };
  }

  /**
   * Verify identity with signature
   */
  @Post('verify')
  @HttpCode(HttpStatus.OK)
  async verifyIdentity(
    @Body() body: { address: string; signature: string; message: string; chainId?: number }
  ): Promise<{
    success: boolean;
    profile?: any;
    verification?: any;
  }> {
    return this.identityService.verifyIdentity(
      body.address,
      body.signature,
      body.message,
      body.chainId || 1
    );
  }

  /**
   * Create or update profile
   */
  @Post('profile')
  async createProfile(
    @Body() body: {
      address: string;
      displayName: string;
      bio?: string;
      socialLinks?: { twitter?: string; github?: string; website?: string };
    }
  ): Promise<any> {
    return this.identityService.createProfile(
      body.address,
      body.displayName,
      body.bio,
      body.socialLinks
    );
  }

  /**
   * Get profile by address
   */
  @Get('profile/:address')
  async getProfile(@Param('address') address: string): Promise<any | null> {
    return this.identityService.getProfile(address);
  }

  /**
   * Get reputation history
   */
  @Get('reputation/:address')
  async getReputationHistory(
    @Param('address') address: string,
    @Query('limit') limit?: number
  ): Promise<any[]> {
    return this.identityService.getReputationHistory(address, limit || 50);
  }

  /**
   * Get credentials
   */
  @Get('credentials/:address')
  async getCredentials(@Param('address') address: string): Promise<any[]> {
    return this.identityService.getCredentials(address);
  }

  /**
   * Add cross-chain identity
   */
  @Post('cross-chain')
  async addCrossChainIdentity(
    @Body() body: { address: string; chain: string; transactionCount: number }
  ): Promise<any> {
    return this.identityService.addCrossChainIdentity(
      body.address,
      body.chain,
      body.transactionCount
    );
  }

  /**
   * Get cross-chain identities
   */
  @Get('cross-chain/:address')
  async getCrossChainIdentities(@Param('address') address: string): Promise<any[]> {
    return this.identityService.getCrossChainIdentities(address);
  }

  /**
   * Get top identities
   */
  @Get('top')
  async getTopIdentities(@Query('limit') limit?: number): Promise<any[]> {
    return this.identityService.getTopIdentities(limit || 20);
  }

  /**
   * Search identities
   */
  @Get('search')
  async searchIdentities(
    @Query('q') query: string,
    @Query('limit') limit?: number
  ): Promise<any[]> {
    return this.identityService.searchIdentities(query, limit || 20);
  }

  /**
   * Award badge
   */
  @Post('badge')
  async awardBadge(
    @Body() body: { address: string; badge: string }
  ): Promise<any> {
    return this.identityService.awardBadge(body.address, body.badge);
  }

  /**
   * Get platform statistics
   */
  @Get('stats')
  async getPlatformStats(): Promise<any> {
    return this.identityService.getPlatformStats();
  }

  /**
   * Compare two identities
   */
  @Get('compare/:address1/:address2')
  async compareIdentities(
    @Param('address1') address1: string,
    @Param('address2') address2: string
  ): Promise<any> {
    return this.identityService.compareIdentities(address1, address2);
  }

  /**
   * Update reputation (internal use)
   */
  @Post('reputation')
  async updateReputation(
    @Body() body: { address: string; points: number; reason: string }
  ): Promise<any> {
    return this.identityService.updateReputation(body.address, body.points, body.reason);
  }
}
