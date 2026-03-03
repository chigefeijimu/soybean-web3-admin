import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { OnchainDataQueryService } from './services/onchain-data-query.service';
import { QueryDto } from './dto/query.dto';
import { ChainStatsDto } from './dto/chain-stats.dto';
import { BlockDataDto } from './dto/block-data.dto';
import { TransactionListDto } from './dto/transaction-list.dto';

@Controller('onchain-data-query')
export class OnchainDataQueryController {
  constructor(private readonly onchainDataQueryService: OnchainDataQueryService) {}

  @Post('query')
  async executeQuery(@Body() queryDto: QueryDto) {
    return this.onchainDataQueryService.executeQuery(queryDto);
  }

  @Get('chain-stats')
  async getChainStats(@Query() query: ChainStatsDto) {
    return this.onchainDataQueryService.getChainStats(query.chain);
  }

  @Get('block')
  async getBlockData(@Query() query: BlockDataDto) {
    return this.onchainDataQueryService.getBlockData(query.chain, query.blockNumber);
  }

  @Get('transactions')
  async getTransactions(@Query() query: TransactionListDto) {
    return this.onchainDataQueryService.getTransactions(
      query.chain,
      query.address,
      query.fromBlock,
      query.toBlock,
      query.limit,
    );
  }

  @Get('tokens')
  async getTokenTransfers(
    @Query('chain') chain: string,
    @Query('address') address: string,
    @Query('tokenAddress') tokenAddress: string,
    @Query('fromBlock') fromBlock: string,
    @Query('toBlock') toBlock: string,
    @Query('limit') limit: string,
  ) {
    return this.onchainDataQueryService.getTokenTransfers(
      chain,
      address,
      tokenAddress,
      parseInt(fromBlock || '0'),
      parseInt(toBlock || '99999999'),
      parseInt(limit || '50'),
    );
  }

  @Get('native-balance-history')
  async getNativeBalanceHistory(
    @Query('chain') chain: string,
    @Query('address') address: string,
    @Query('fromBlock') fromBlock: string,
    @Query('toBlock') toBlock: string,
  ) {
    return this.onchainDataQueryService.getNativeBalanceHistory(
      chain,
      address,
      parseInt(fromBlock || '0'),
      parseInt(toBlock || '99999999'),
    );
  }

  @Get('supported-chains')
  async getSupportedChains() {
    return this.onchainDataQueryService.getSupportedChains();
  }

  @Get('query-templates')
  async getQueryTemplates() {
    return this.onchainDataQueryService.getQueryTemplates();
  }
}
