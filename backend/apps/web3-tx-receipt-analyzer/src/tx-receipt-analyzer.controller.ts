import { Controller, Get, Post, Query, HttpException, HttpStatus } from '@nestjs/common';
import { TxReceiptAnalyzerService } from './tx-receipt-analyzer.service';

@Controller('web3/tx-receipt-analyzer')
export class TxReceiptAnalyzerController {
  constructor(private readonly txReceiptAnalyzerService: TxReceiptAnalyzerService) {}

  @Get('analyze')
  async analyzeTransaction(
    @Query('txHash') txHash: string,
    @Query('chain') chain: string = 'ethereum',
  ) {
    if (!txHash) {
      throw new HttpException('txHash is required', HttpStatus.BAD_REQUEST);
    }
    if (!txHash.startsWith('0x') || txHash.length !== 66) {
      throw new HttpException('Invalid transaction hash format', HttpStatus.BAD_REQUEST);
    }
    return this.txReceiptAnalyzerService.analyzeTransaction(txHash, chain);
  }

  @Get('chains')
  async getSupportedChains() {
    return this.txReceiptAnalyzerService.getSupportedChains();
  }
}
