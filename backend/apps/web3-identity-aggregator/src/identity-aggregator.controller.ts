import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { IdentityAggregatorService } from './identity-aggregator.service';

@Controller('identity-aggregator')
export class IdentityAggregatorController {
  constructor(private readonly identityService: IdentityAggregatorService) {}

  @Get('resolve/:address')
  resolveAddress(@Param('address') address: string) {
    return this.identityService.resolveIdentity(address);
  }

  @Get('reverse/:domain')
  reverseResolve(@Param('domain') domain: string) {
    return this.identityService.reverseResolve(domain);
  }

  @Get('profile/:address')
  getIdentityProfile(@Param('address') address: string) {
    return this.identityService.getIdentityProfile(address);
  }

  @Get('reputation/:address')
  getReputationScore(@Param('address') address: string) {
    return this.identityService.getReputationScore(address);
  }

  @Get('social-graph/:address')
  getSocialGraph(@Param('address') address: string) {
    return this.identityService.getSocialGraph(address);
  }

  @Get('cross-chain-identities/:address')
  getCrossChainIdentities(@Param('address') address: string) {
    return this.identityService.getCrossChainIdentities(address);
  }

  @Get('popular-domains')
  getPopularDomains(@Query('chain') chain?: string) {
    return this.identityService.getPopularDomains(chain);
  }

  @Post('verify')
  verifyIdentity(@Body() body: { address: string; identity: string }) {
    return this.identityService.verifyIdentity(body.address, body.identity);
  }

  @Get('stats')
  getStats() {
    return this.identityService.getStats();
  }
}
