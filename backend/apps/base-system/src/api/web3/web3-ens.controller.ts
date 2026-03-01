import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Web3EnsService } from './web3-ens.service';

@ApiTags('Web3 ENS')
@Controller('web3')
export class Web3EnsController {
  constructor(private readonly ensService: Web3EnsService) {}

  @Get('ens/resolve')
  @ApiOperation({ summary: 'ENS正向解析 - 域名解析为地址' })
  async resolveEns(
    @Query('name') name: string,
    @Query('chainId') chainId: number = 1,
  ) {
    if (!name) {
      throw new Error('ENS domain name is required');
    }
    return this.ensService.resolveName(name, chainId);
  }

  @Get('ens/reverse')
  @ApiOperation({ summary: 'ENS反向解析 - 地址解析为域名' })
  async reverseResolve(
    @Query('address') address: string,
  ) {
    if (!address || !address.startsWith('0x') || address.length !== 42) {
      throw new Error('Valid Ethereum address is required');
    }
    return this.ensService.reverseResolve(address);
  }

  @Get('ens/details')
  @ApiOperation({ summary: '获取ENS域名详细信息' })
  async getEnsDetails(
    @Query('name') name: string,
  ) {
    if (!name) {
      throw new Error('ENS domain name is required');
    }
    return this.ensService.getEnsDetails(name);
  }

  @Get('ens/batch')
  @ApiOperation({ summary: '批量查询ENS域名' })
  async batchResolve(
    @Query('names') names: string,
  ) {
    if (!names) {
      throw new Error('Comma-separated ENS names are required');
    }
    const nameList = names.split(',').map(n => n.trim()).filter(n => n);
    return this.ensService.batchResolve(nameList);
  }

  @Get('ens/avatar')
  @ApiOperation({ summary: '获取ENS域名头像URL' })
  async getEnsAvatar(
    @Query('name') name: string,
  ) {
    if (!name) {
      throw new Error('ENS domain name is required');
    }
    return this.ensService.getEnsAvatar(name);
  }

  @Get('ens/records')
  @ApiOperation({ summary: '获取ENS域名所有记录' })
  async getEnsRecords(
    @Query('name') name: string,
  ) {
    if (!name) {
      throw new Error('ENS domain name is required');
    }
    return this.ensService.getEnsRecords(name);
  }

  @Get('ens/history')
  @ApiOperation({ summary: '获取ENS域名交易历史' })
  async getEnsHistory(
    @Query('name') name: string,
  ) {
    if (!name) {
      throw new Error('ENS domain name is required');
    }
    return this.ensService.getEnsHistory(name);
  }

  @Get('ens/search')
  @ApiOperation({ summary: '搜索ENS域名' })
  async searchEns(
    @Query('query') query: string,
    @Query('limit') limit: number = 10,
  ) {
    if (!query || query.length < 2) {
      throw new Error('Search query must be at least 2 characters');
    }
    return this.ensService.searchEns(query, limit);
  }

  @Get('ens/popular')
  @ApiOperation({ summary: '获取热门/高价值ENS域名' })
  async getPopularEns(
    @Query('limit') limit: number = 20,
  ) {
    return this.ensService.getPopularEns(limit);
  }
}
