import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { DaoDelegationService } from '../services/dao-delegation.service';
import { CreateDelegationDto, UpdateDelegationDto, QueryDelegationDto, CreateAlertDto } from '../dto/dao-delegation.dto';

@Controller('dao-delegation')
export class DaoDelegationController {
  constructor(private readonly service: DaoDelegationService) {}

  @Post()
  async createDelegation(@Body() dto: CreateDelegationDto) {
    return this.service.createDelegation(dto);
  }

  @Put()
  async updateDelegation(@Body() dto: UpdateDelegationDto) {
    return this.service.updateDelegation(dto);
  }

  @Get()
  async getDelegations(@Query() query: QueryDelegationDto) {
    return this.service.getDelegations(query);
  }

  @Get(':id')
  async getDelegationById(@Param('id') id: string) {
    return this.service.getDelegationById(parseInt(id));
  }

  @Delete(':id')
  async deleteDelegation(@Param('id') id: string) {
    return this.service.deleteDelegation(parseInt(id));
  }

  @Get('history/:walletAddress')
  async getHistory(@Param('walletAddress') walletAddress: string, @Query('daoName') daoName?: string) {
    return this.service.getDelegationHistory(walletAddress, daoName);
  }

  @Get('daos/list')
  async getSupportedDaos() {
    return this.service.getSupportedDaos();
  }

  @Get('stats/:daoName')
  async getDaoStats(@Param('daoName') daoName: string) {
    return this.service.getDaoStats(daoName);
  }

  @Get('chain/:walletAddress/:daoName')
  async fetchChainDelegation(
    @Param('walletAddress') walletAddress: string,
    @Param('daoName') daoName: string,
  ) {
    return this.service.fetchChainDelegation(walletAddress, daoName);
  }

  @Post('compare/:daoName')
  async compareDelegates(@Param('daoName') daoName: string, @Body() body: { addresses: string[] }) {
    return this.service.compareDelegates(daoName, body.addresses);
  }

  @Get('recommendations/:walletAddress/:daoName')
  async getRecommendations(
    @Param('walletAddress') walletAddress: string,
    @Param('daoName') daoName: string,
  ) {
    return this.service.getDelegationRecommendations(walletAddress, daoName);
  }

  // Alerts
  @Post('alerts')
  async createAlert(@Body() dto: CreateAlertDto) {
    return this.service.createAlert(dto);
  }

  @Get('alerts')
  async getAlerts(@Query('walletAddress') walletAddress?: string) {
    return this.service.getAlerts(walletAddress);
  }

  @Put('alerts/:id')
  async updateAlert(@Param('id') id: string, @Body() body: { enabled: boolean }) {
    return this.service.updateAlert(parseInt(id), body.enabled);
  }

  @Delete('alerts/:id')
  async deleteAlert(@Param('id') id: string) {
    return this.service.deleteAlert(parseInt(id));
  }
}
