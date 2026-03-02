import { Controller, Get, Post, Delete, Param, Query, Body } from '@nestjs/common';
import { CrossChainTxTrackerService, CrossChainTx, BridgeQuote, TxHistoryEntry } from './cross-chain-tx-tracker.service';

class TrackTransactionDto {
  hash: string;
  bridge: string;
  srcChain: string;
  destChain: string;
  sender: string;
  receiver: string;
  amount: string;
  token: string;
}

class GetQuotesDto {
  srcChain: string;
  destChain: string;
  amount: string;
  token: string;
}

@Controller('api/cross-chain')
export class CrossChainTxTrackerController {
  constructor(private readonly trackerService: CrossChainTxTrackerService) {}

  // ============ Transaction Status ============

  @Get('tx/:hash')
  async getTransactionStatus(
    @Param('hash') hash: string,
    @Query('bridge') bridge: string = 'layerzero',
    @Query('srcChain') srcChain: string = 'eth',
  ): Promise<CrossChainTx | { error: string }> {
    const tx = await this.trackerService.getTransactionStatus(hash, bridge, srcChain);
    if (!tx) {
      return { error: 'Transaction not found' };
    }
    return tx;
  }

  @Post('tx/track')
  async trackTransaction(@Body() body: TrackTransactionDto): Promise<CrossChainTx> {
    return this.trackerService.trackTransaction(
      body.hash,
      body.bridge,
      body.srcChain,
      body.destChain,
      body.sender,
      body.receiver,
      body.amount,
      body.token,
    );
  }

  @Get('tx/tracked')
  async getTrackedTransactions(@Query('address') address?: string): Promise<CrossChainTx[]> {
    return this.trackerService.getTrackedTransactions(address);
  }

  @Delete('tx/:id')
  async cancelTrackedTransaction(@Param('id') txId: string): Promise<{ success: boolean }> {
    const success = await this.trackerService.cancelTrackedTransaction(txId);
    return { success };
  }

  // ============ Bridge Quotes ============

  @Post('quotes')
  async getBridgeQuotes(@Body() body: GetQuotesDto): Promise<BridgeQuote[]> {
    return this.trackerService.getBridgeQuotes(
      body.srcChain,
      body.destChain,
      body.amount,
      body.token,
    );
  }

  @Get('quotes/:srcChain/:destChain/:amount')
  async getQuotes(
    @Param('srcChain') srcChain: string,
    @Param('destChain') destChain: string,
    @Param('amount') amount: string,
    @Query('token') token: string = 'USDC',
  ): Promise<BridgeQuote[]> {
    return this.trackerService.getBridgeQuotes(srcChain, destChain, amount, token);
  }

  // ============ Transaction History ============

  @Get('history/:address')
  async getTransactionHistory(
    @Param('address') address: string,
    @Query('chains') chains: string = '',
    @Query('limit') limit: string = '50',
  ): Promise<TxHistoryEntry[]> {
    const chainList = chains ? chains.split(',') : [];
    return this.trackerService.getTransactionHistory(address, chainList, parseInt(limit) || 50);
  }

  // ============ Supported Bridges & Chains ============

  @Get('bridges')
  async getSupportedBridges() {
    return this.trackerService.getSupportedBridges();
  }

  @Get('chains')
  async getSupportedChains() {
    return this.trackerService.getSupportedChains();
  }

  // ============ System ============

  @Get('health')
  async healthCheck() {
    return this.trackerService.healthCheck();
  }

  @Get('info')
  async getApiInfo() {
    return this.trackerService.getApiInfo();
  }
}
