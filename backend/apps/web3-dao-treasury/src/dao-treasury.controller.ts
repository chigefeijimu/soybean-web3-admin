import { Controller, Get, Query, Param } from '@nestjs/common';
import { DaoTreasuryService } from './dao-treasury.service';

@Controller('dao-treasury')
export class DaoTreasuryController {
  constructor(private readonly service: DaoTreasuryService) {}

  @Get('daos')
  async getDaos(
    @Query('category') category: string,
    @Query('sort') sort: string,
    @Query('limit') limit: string
  ) {
    return this.service.getDaos(category, sort, limit ? parseInt(limit) : 20);
  }

  @Get('dao/:id')
  async getDaoTreasury(@Param('id') id: string) {
    return this.service.getDaoTreasury(id);
  }

  @Get('assets')
  async getTreasuryAssets(
    @Query('dao') dao: string,
    @Query('type') type: string
  ) {
    return this.service.getTreasuryAssets(dao, type);
  }

  @Get('transactions')
  async getTreasuryTransactions(
    @Query('dao') dao: string,
    @Query('type') type: string,
    @Query('limit') limit: string
  ) {
    return this.service.getTreasuryTransactions(dao, type, limit ? parseInt(limit) : 50);
  }

  @Get('flow')
  async getFlowAnalysis(
    @Query('dao') dao: string,
    @Query('period') period: string
  ) {
    return this.service.getFlowAnalysis(dao, period || '30d');
  }

  @Get('holders')
  async getTokenHolders(
    @Query('dao') dao: string,
    @Query('limit') limit: string
  ) {
    return this.service.getTokenHolders(dao, limit ? parseInt(limit) : 50);
  }

  @Get('proposals')
  async getTreasuryProposals(
    @Query('dao') dao: string,
    @Query('status') status: string,
    @Query('limit') limit: string
  ) {
    return this.service.getTreasuryProposals(dao, status, limit ? parseInt(limit) : 20);
  }

  @Get('stats')
  async getTreasuryStats(@Query('dao') dao: string) {
    return this.service.getTreasuryStats(dao);
  }

  @Get('trends')
  async getTreasuryTrends(
    @Query('dao') dao: string,
    @Query('period') period: string
  ) {
    return this.service.getTreasuryTrends(dao, period || '90d');
  }

  @Get('search')
  async searchDaos(@Query('q') query: string) {
    return this.service.searchDaos(query);
  }

  @Get('compare')
  async compareTreasuries(@Query('daos') daos: string) {
    const daoList = daos ? daos.split(',') : [];
    return this.service.compareTreasuries(daoList);
  }

  @Get('alerts')
  async getTreasuryAlerts(@Query('dao') dao: string) {
    return this.service.getTreasuryAlerts(dao);
  }
}
