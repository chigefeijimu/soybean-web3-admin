import { Controller, Get, Post, Delete, Query, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiParam, ApiBody } from '@nestjs/swagger';
import { DaoProposalScannerService } from './dao-proposal-scanner.service';

@ApiTags('DAO Proposal Scanner')
@Controller('dao-proposal-scanner')
export class DaoProposalScannerController {
  constructor(private readonly service: DaoProposalScannerService) {}

  @Get('daos')
  @ApiOperation({ summary: 'Get list of supported DAOs' })
  async getSupportedDaos() {
    return this.service.getSupportedDaos();
  }

  @Get('proposals')
  @ApiOperation({ summary: 'Scan for DAO proposals' })
  @ApiQuery({ name: 'dao', required: false, description: 'Filter by DAO name' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status: active/passed/failed/executing/canceled' })
  @ApiQuery({ name: 'category', required: false, description: 'Filter by category' })
  async scanProposals(
    @Query('dao') dao?: string,
    @Query('status') status?: string,
    @Query('category') category?: string,
  ) {
    return this.service.scanProposals(dao, status, category);
  }

  @Get('proposals/search')
  @ApiOperation({ summary: 'Search proposals by keyword' })
  @ApiQuery({ name: 'keyword', required: true, description: 'Search keyword' })
  async searchProposals(@Query('keyword') keyword: string) {
    return this.service.searchProposals(keyword);
  }

  @Get('proposals/:dao/:id')
  @ApiOperation({ summary: 'Get proposal details by DAO and ID' })
  @ApiParam({ name: 'dao', description: 'DAO name' })
  @ApiParam({ name: 'id', description: 'Proposal ID' })
  async getProposal(@Param('dao') dao: string, @Param('id') id: string) {
    return this.service.getProposal(dao, id);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get proposal statistics' })
  async getProposalStats() {
    return this.service.getProposalStats();
  }

  @Get('trending')
  @ApiOperation({ summary: 'Get trending DAOs by active proposals' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of results', type: Number })
  async getTrendingDaos(@Query('limit') limit?: number) {
    return this.service.getTrendingDaos(limit || 10);
  }

  @Post('alerts')
  @ApiOperation({ summary: 'Create a proposal alert' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        userAddress: { type: 'string' },
        daoFilter: { type: 'string' },
        categoryFilter: { type: 'string' },
        statusFilter: { type: 'string' },
        webhookUrl: { type: 'string' },
        email: { type: 'string' },
      },
      required: ['userAddress'],
    },
  })
  async createAlert(@Body() body: {
    userAddress: string;
    daoFilter?: string;
    categoryFilter?: string;
    statusFilter?: string;
    webhookUrl?: string;
    email?: string;
  }) {
    return this.service.createAlert(
      body.userAddress,
      body.daoFilter,
      body.categoryFilter,
      body.statusFilter,
      body.webhookUrl,
      body.email,
    );
  }

  @Get('alerts/:userAddress')
  @ApiOperation({ summary: 'Get user alerts' })
  @ApiParam({ name: 'userAddress', description: 'User wallet address' })
  async getAlerts(@Param('userAddress') userAddress: string) {
    return this.service.getAlerts(userAddress);
  }

  @Delete('alerts/:userAddress/:alertId')
  @ApiOperation({ summary: 'Delete an alert' })
  @ApiParam({ name: 'userAddress', description: 'User wallet address' })
  @ApiParam({ name: 'alertId', description: 'Alert ID' })
  async deleteAlert(
    @Param('userAddress') userAddress: string,
    @Param('alertId') alertId: string,
  ) {
    return this.service.deleteAlert(userAddress, alertId);
  }

  @Post('alerts/check')
  @ApiOperation({ summary: 'Check alerts against new proposals' })
  async checkAlerts() {
    return this.service.checkAlerts();
  }
}
