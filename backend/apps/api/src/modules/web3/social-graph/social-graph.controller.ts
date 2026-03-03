import { Controller, Get, Post, Query, Body } from '@nestjs/common';
import { SocialGraphService } from './social-graph.service';

@Controller('web3/social-graph')
export class SocialGraphController {
  constructor(private readonly socialGraphService: SocialGraphService) {}

  @Get('analyze')
  async analyzeAddress(
    @Query('address') address: string,
    @Query('chain') chain: string = 'ethereum',
    @Query('depth') depth: number = 2,
  ) {
    if (!address) {
      return { error: 'Address is required' };
    }
    return this.socialGraphService.analyzeAddress(address, chain, depth);
  }

  @Get('interactions')
  async getAddressInteractions(
    @Query('address') address: string,
    @Query('chain') chain: string = 'ethereum',
    @Query('limit') limit: number = 50,
  ) {
    if (!address) {
      return { error: 'Address is required' };
    }
    return this.socialGraphService.getAddressInteractions(address, chain, limit);
  }

  @Post('compare')
  async compareAddresses(
    @Body() body: { addresses: string[]; chain?: string },
  ) {
    if (!body.addresses || body.addresses.length < 2) {
      return { error: 'At least 2 addresses required' };
    }
    return this.socialGraphService.compareAddresses(body.addresses, body.chain || 'ethereum');
  }

  @Get('influencers')
  async findInfluencers(
    @Query('chain') chain: string = 'ethereum',
    @Query('minVolume') minVolume: number = 1000000,
  ) {
    return this.socialGraphService.findInfluencers(chain, minVolume);
  }

  @Get('health')
  async healthCheck() {
    return {
      status: 'ok',
      service: 'Social Graph Analyzer',
      timestamp: new Date().toISOString(),
    };
  }
}
