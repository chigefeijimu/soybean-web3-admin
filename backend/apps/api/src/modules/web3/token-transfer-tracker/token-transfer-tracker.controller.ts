import { Controller, Get, Post, Put, Delete, Body, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { TokenTransferTrackerService } from './token-transfer-tracker.service';

@Controller('api/web3/token-transfer-tracker')
export class TokenTransferTrackerController {
  constructor(private readonly tokenTransferTrackerService: TokenTransferTrackerService) {}

  @Get('transfers')
  @HttpCode(HttpStatus.OK)
  async getTransfers(
    @Query('address') address?: string,
    @Query('chain') chain?: string,
    @Query('token') token?: string,
    @Query('startBlock') startBlock?: number,
    @Query('endBlock') endBlock?: number,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.tokenTransferTrackerService.getTransfers({
      address,
      chain,
      token,
      startBlock: startBlock ? Number(startBlock) : undefined,
      endBlock: endBlock ? Number(endBlock) : undefined,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 50,
    });
  }

  @Get('stats')
  @HttpCode(HttpStatus.OK)
  async getTransferStats(
    @Query('address') address?: string,
    @Query('chain') chain?: string,
    @Query('token') token?: string,
    @Query('period') period?: string,
  ) {
    return this.tokenTransferTrackerService.getTransferStats({
      address,
      chain,
      token,
      period,
    });
  }

  @Get('history')
  @HttpCode(HttpStatus.OK)
  async getTransferHistory(
    @Query('address') address?: string,
    @Query('chain') chain?: string,
    @Query('token') token?: string,
    @Query('period') period?: string,
  ) {
    return this.tokenTransferTrackerService.getTransferHistory({
      address,
      chain,
      token,
      period,
    });
  }

  @Get('top-tokens')
  @HttpCode(HttpStatus.OK)
  async getTopTokens(
    @Query('chain') chain?: string,
    @Query('period') period?: string,
    @Query('limit') limit?: number,
  ) {
    return this.tokenTransferTrackerService.getTopTokens({
      chain,
      period,
      limit: limit ? Number(limit) : 20,
    });
  }

  @Get('address/:address')
  @HttpCode(HttpStatus.OK)
  async getAddressActivity(
    @Param('address') address: string,
    @Query('chain') chain?: string,
  ) {
    return this.tokenTransferTrackerService.getAddressActivity({
      address,
      chain,
    });
  }

  @Get('chains')
  @HttpCode(HttpStatus.OK)
  async getSupportedChains() {
    return {
      chains: this.tokenTransferTrackerService.getSupportedChains(),
    };
  }
}
