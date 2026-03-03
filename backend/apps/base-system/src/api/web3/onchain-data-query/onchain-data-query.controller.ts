import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { OnchainDataQueryService } from './onchain-data-query.service';

@Controller('web3/onchain-data-query')
export class OnchainDataQueryController {
  constructor(private readonly onchainDataQueryService: OnchainDataQueryService) {}

  @Post('query')
  async executeQuery(@Body() body: { query: string; chain?: string }) {
    return this.onchainDataQueryService.executeQuery(body.query, body.chain);
  }

  @Get('chain-stats')
  async getChainStats(@Query('chain') chain: string) {
    return this.onchainDataQueryService.getChainStats(chain);
  }

  @Get('block')
  async getBlockData(@Query('chain') chain: string, @Query('blockNumber') blockNumber: number) {
    return this.onchainDataQueryService.getBlockData(chain, blockNumber);
  }

  @Get('transactions')
  async getTransactions(
    @Query('chain') chain: string,
    @Query('address') address: string,
    @Query('fromBlock') fromBlock: number,
    @Query('toBlock') toBlock: number,
    @Query('limit') limit: number,
  ) {
    return this.onchainDataQueryService.getTransactions(chain, address, fromBlock, toBlock, limit);
  }

  @Get('tokens')
  async getTokenTransfers(
    @Query('chain') chain: string,
    @Query('address') address: string,
    @Query('tokenAddress') tokenAddress: string,
    @Query('fromBlock') fromBlock: number,
    @Query('toBlock') toBlock: number,
    @Query('limit') limit: number,
  ) {
    return this.onchainDataQueryService.getTokenTransfers(
      chain,
      address,
      tokenAddress,
      fromBlock,
      toBlock,
      limit,
    );
  }

  @Get('native-balance-history')
  async getNativeBalanceHistory(
    @Query('chain') chain: string,
    @Query('address') address: string,
    @Query('fromBlock') fromBlock: number,
    @Query('toBlock') toBlock: number,
  ) {
    return this.onchainDataQueryService.getNativeBalanceHistory(chain, address, fromBlock, toBlock);
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
