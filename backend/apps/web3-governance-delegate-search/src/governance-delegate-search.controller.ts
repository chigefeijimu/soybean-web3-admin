import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { GovernanceDelegateSearchService, DelegateSearchParams, DelegateComparisonParams } from './governance-delegate-search.service';

@Controller('governance-delegate-search')
export class GovernanceDelegateSearchController {
  constructor(private readonly service: GovernanceDelegateSearchService) {}

  @Get('delegates')
  async searchDelegates(
    @Query('query') query?: string,
    @Query('dao') dao?: string,
    @Query('chain') chain?: string,
    @Query('minVotingPower') minVotingPower?: string,
    @Query('minDelegators') minDelegators?: string,
    @Query('reputation') reputation?: string,
    @Query('expertise') expertise?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const params: DelegateSearchParams = {
      query,
      dao,
      chain,
      minVotingPower: minVotingPower ? parseInt(minVotingPower) : undefined,
      minDelegators: minDelegators ? parseInt(minDelegators) : undefined,
      reputation,
      expertise,
      sortBy: sortBy as any,
      sortOrder: sortOrder as any,
      page: page ? parseInt(page) : 1,
      pageSize: pageSize ? parseInt(pageSize) : 20,
    };
    return this.service.searchDelegates(params);
  }

  @Get('delegates/:address')
  async getDelegateByAddress(@Param('address') address: string) {
    return this.service.getDelegateByAddress(address);
  }

  @Get('delegates/:address/similar')
  async findSimilarDelegates(
    @Param('address') address: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.findSimilarDelegates(address, limit ? parseInt(limit) : 5);
  }

  @Post('delegates/compare')
  async compareDelegates(@Body() body: DelegateComparisonParams) {
    return this.service.compareDelegates(body.addresses);
  }

  @Get('top')
  async getTopDelegates(
    @Query('dao') dao?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.getTopDelegates(dao, limit ? parseInt(limit) : 10);
  }

  @Get('daos')
  async getDAOs() {
    return this.service.getDAOs();
  }

  @Get('daos/:id')
  async getDAOById(@Param('id') id: string) {
    return this.service.getDAOById(id);
  }

  @Get('stats')
  async getStats() {
    return this.service.getDelegateStats();
  }

  @Get('expertise/:expertise')
  async searchByExpertise(@Param('expertise') expertise: string) {
    return this.service.searchByExpertise(expertise);
  }
}
