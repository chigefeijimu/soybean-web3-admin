import { Controller, Get, Post, Param, Query, Body } from '@nestjs/common';
import { TokenTransferService, TransferAnalysis, TokenTransfer, TransferStats, AddressTokenHoldings } from './token-transfer.service';

@Controller('token-transfer')
export class TokenTransferController {
  constructor(private readonly tokenTransferService: TokenTransferService) {}

  @Get('analyze/:address')
  analyzeAddress(
    @Param('address') address: string,
    @Query('chainId') chainId?: string,
    @Query('tokenAddress') tokenAddress?: string,
  ): Promise<TransferAnalysis> {
    return this.tokenTransferService.analyzeAddress(
      address,
      chainId ? parseInt(chainId) : 1,
      tokenAddress,
    );
  }

  @Get('transfers/:address')
  getTransfers(
    @Param('address') address: string,
    @Query('chainId') chainId?: string,
    @Query('tokenAddress') tokenAddress?: string,
    @Query('limit') limit?: string,
    @Query('direction') direction?: string,
  ): Promise<TokenTransfer[]> {
    return this.tokenTransferService.getTransfers(
      address,
      chainId ? parseInt(chainId) : 1,
      tokenAddress,
      limit ? parseInt(limit) : 50,
      direction,
    );
  }

  @Get('stats/:address')
  getStats(
    @Param('address') address: string,
    @Query('chainId') chainId?: string,
    @Query('tokenAddress') tokenAddress?: string,
  ): Promise<TransferStats> {
    return this.tokenTransferService.getTransferStats(
      address,
      chainId ? parseInt(chainId) : 1,
      tokenAddress,
    );
  }

  @Get('holdings/:address')
  getHoldings(
    @Param('address') address: string,
    @Query('chainId') chainId?: string,
  ): Promise<AddressTokenHoldings> {
    return this.tokenTransferService.getTokenHoldings(
      address,
      chainId ? parseInt(chainId) : 1,
    );
  }

  @Get('large-transfers')
  getLargeTransfers(
    @Query('chainId') chainId?: string,
    @Query('minValue') minValue?: string,
    @Query('limit') limit?: string,
  ): Promise<TokenTransfer[]> {
    return this.tokenTransferService.getLargeTransfers(
      chainId ? parseInt(chainId) : 1,
      minValue ? parseFloat(minValue) : 10000,
      limit ? parseInt(limit) : 20,
    );
  }

  @Get('token/:tokenAddress/holders')
  getTokenHolders(
    @Param('tokenAddress') tokenAddress: string,
    @Query('chainId') chainId?: string,
    @Query('limit') limit?: string,
  ): Promise<any> {
    return this.tokenTransferService.getTokenHolders(
      tokenAddress,
      chainId ? parseInt(chainId) : 1,
      limit ? parseInt(limit) : 50,
    );
  }

  @Get('tokens/popular')
  getPopularTokens(
    @Query('chainId') chainId?: string,
  ): Promise<any[]> {
    return this.tokenTransferService.getPopularTokens(chainId ? parseInt(chainId) : 1);
  }

  @Post('watch')
  watchAddress(@Body() body: { address: string; label?: string }): any {
    return this.tokenTransferService.watchAddress(body.address, body.label);
  }

  @Get('watch')
  getWatchedAddresses(): any {
    return this.tokenTransferService.getWatchedAddresses();
  }

  @Get('top-transferrers')
  getTopTransferrers(
    @Query('chainId') chainId?: string,
    @Query('timeRange') timeRange?: string,
    @Query('limit') limit?: string,
  ): Promise<any[]> {
    return this.tokenTransferService.getTopTransferrers(
      chainId ? parseInt(chainId) : 1,
      timeRange || '24h',
      limit ? parseInt(limit) : 10,
    );
  }
}
