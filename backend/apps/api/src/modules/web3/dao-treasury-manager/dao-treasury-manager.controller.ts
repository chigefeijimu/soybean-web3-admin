import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { DaoTreasuryManagerService } from './dao-treasury-manager.service';

@ApiTags('DAO Treasury Manager')
@Controller('api/v1/dao-treasury')
export class DaoTreasuryManagerController {
  constructor(
    private readonly daoTreasuryManagerService: DaoTreasuryManagerService,
  ) {}

  @Get('overview/:dao')
  @ApiOperation({ summary: 'Get DAO treasury overview' })
  async getTreasuryOverview(@Param('dao') dao: string) {
    return this.daoTreasuryManagerService.getTreasuryOverview(dao);
  }

  @Get('address/:address')
  @ApiOperation({ summary: 'Get treasury by address' })
  async getTreasuryByAddress(@Param('address') address: string) {
    return this.daoTreasuryManagerService.getTreasuryByAddress(address);
  }

  @Get('report/:dao')
  @ApiOperation({ summary: 'Get detailed treasury report' })
  async getTreasuryReport(@Param('dao') dao: string) {
    return this.daoTreasuryManagerService.getTreasuryReport(dao);
  }

  @Post('compare')
  @ApiOperation({ summary: 'Compare multiple DAO treasuries' })
  async compareTreasuries(@Body() body: { daos: string[] }) {
    return this.daoTreasuryManagerService.compareTreasuries(body.daos);
  }

  @Get('top')
  @ApiOperation({ summary: 'Get top DAO treasuries by value' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getTopTreasuries(@Query('limit') limit?: number) {
    return this.daoTreasuryManagerService.getTopTreasuries(limit || 10);
  }

  @Get('history/:dao')
  @ApiOperation({ summary: 'Get treasury value history' })
  @ApiQuery({ name: 'days', required: false, type: Number })
  async getTreasuryHistory(
    @Param('dao') dao: string,
    @Query('days') days?: number,
  ) {
    return this.daoTreasuryManagerService.getTreasuryHistory(dao, days || 30);
  }

  @Get('supported')
  @ApiOperation({ summary: 'Get list of supported DAOs' })
  async getSupportedDaos() {
    return this.daoTreasuryManagerService.getSupportedDaos();
  }

  @Get('risks/:dao')
  @ApiOperation({ summary: 'Analyze treasury risks' })
  async analyzeTreasuryRisks(@Param('dao') dao: string) {
    return this.daoTreasuryManagerService.analyzeTreasuryRisks(dao);
  }

  @Get('yield-opportunities/:dao')
  @ApiOperation({ summary: 'Get yield opportunities for treasury' })
  async getYieldOpportunities(@Param('dao') dao: string) {
    return this.daoTreasuryManagerService.getYieldOpportunities(dao);
  }
}
