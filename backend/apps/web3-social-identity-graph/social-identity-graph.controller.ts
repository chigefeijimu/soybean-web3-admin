import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { SocialIdentityGraphService } from './social-identity-graph.service';

class AnalyzeAddressDto {
  address: string;
  chains?: string[];
}

class GetConnectionsDto {
  address: string;
  chain?: string;
  depth?: number;
}

class SearchIdentityDto {
  query: string;
  chain?: string;
}

class GetNetworkDto {
  address: string;
  chain?: string;
}

@Controller()
export class SocialIdentityGraphController {
  constructor(private readonly service: SocialIdentityGraphService) {}

  @Get('health')
  health() {
    return { status: 'ok', service: 'Social Identity Graph API' };
  }

  @Post('analyze')
  async analyzeAddress(@Body() dto: AnalyzeAddressDto) {
    return this.service.analyzeAddress(dto.address, dto.chains);
  }

  @Get('address/:address')
  async getAddressProfile(@Param('address') address: string) {
    return this.service.getAddressProfile(address);
  }

  @Get('connections')
  async getConnections(@Query() dto: GetConnectionsDto) {
    return this.service.getConnections(dto.address, dto.chain, dto.depth || 2);
  }

  @Post('search')
  async searchIdentity(@Body() dto: SearchIdentityDto) {
    return this.service.searchIdentity(dto.query, dto.chain);
  }

  @Get('network/:address')
  async getNetwork(@Param('address') address: string, @Query('chain') chain?: string) {
    return this.service.getSocialNetwork(address, chain);
  }

  @Get('reputation/:address')
  async getReputation(@Param('address') address: string) {
    return this.service.calculateReputation(address);
  }

  @Get('similar/:address')
  async findSimilar(@Param('address') address: string) {
    return this.service.findSimilarAddresses(address);
  }

  @Get('stats')
  async getStats() {
    return this.service.getStats();
  }

  @Post('track')
  async trackAddress(@Body() dto: { address: string; label?: string }) {
    return this.service.trackAddress(dto.address, dto.label);
  }

  @Get('discover')
  async discoverInfluencers(@Query('chain') chain?: string) {
    return this.service.discoverInfluencers(chain);
  }
}
