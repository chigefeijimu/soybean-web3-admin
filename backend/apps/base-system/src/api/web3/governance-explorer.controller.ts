import { Controller, Get, Query, Param } from '@nestjs/common';
import { GovernanceExplorerService } from './governance-explorer.service';

@Controller('governance-explorer')
export class GovernanceExplorerController {
  constructor(private readonly service: GovernanceExplorerService) {}

  @Get('daos')
  async getDaos() {
    return this.service.getDaos();
  }

  @Get('dao/:id')
  async getDaoDetails(@Param('id') id: string) {
    return this.service.getDaoDetails(id);
  }

  @Get('proposals')
  async getProposals(
    @Query('dao') dao: string,
    @Query('status') status: string,
    @Query('limit') limit: string
  ) {
    return this.service.getProposals(dao, status, limit ? parseInt(limit) : 20);
  }

  @Get('proposal/:id')
  async getProposalDetails(@Param('id') id: string) {
    return this.service.getProposalDetails(id);
  }

  @Get('votes')
  async getVotes(
    @Query('proposal') proposal: string,
    @Query('address') address: string,
    @Query('limit') limit: string
  ) {
    return this.service.getVotes(proposal, address, limit ? parseInt(limit) : 50);
  }

  @Get('delegations')
  async getDelegations(@Query('address') address: string) {
    return this.service.getDelegations(address);
  }

  @Get('token-holders')
  async getTokenHolders(
    @Query('dao') dao: string,
    @Query('limit') limit: string
  ) {
    return this.service.getTokenHolders(dao, limit ? parseInt(limit) : 50);
  }

  @Get('search')
  async searchProposals(@Query('q') query: string) {
    return this.service.searchProposals(query);
  }

  @Get('treasury')
  async getTreasury(@Query('dao') dao: string) {
    return this.service.getTreasury(dao);
  }

  @Get('voter-stats')
  async getVoterStats(@Query('dao') dao: string) {
    return this.service.getVoterStats(dao);
  }
}
