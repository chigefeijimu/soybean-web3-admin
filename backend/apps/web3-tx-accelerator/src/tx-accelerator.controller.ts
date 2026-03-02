import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { TxAcceleratorService } from './tx-accelerator.service';

interface GetPendingTxDto {
  address: string;
  chainId?: number;
}

interface SpeedUpTxDto {
  address: string;
  nonce: number;
  chainId?: number;
  gasMultiplier?: number;
  privateKey: string;
}

interface CancelTxDto {
  address: string;
  nonce: number;
  chainId?: number;
  privateKey: string;
}

@Controller('tx-accelerator')
export class TxAcceleratorController {
  constructor(private readonly txAcceleratorService: TxAcceleratorService) {}

  @Get('pending/:address')
  async getPendingTransactions(@Param('address') address: string, @Query('chainId') chainId?: string) {
    const chainIdNum = chainId ? parseInt(chainId, 10) : 1;
    return this.txAcceleratorService.getPendingTransactions(address, chainIdNum);
  }

  @Post('speed-up')
  async speedUpTransaction(@Body() dto: SpeedUpTxDto) {
    return this.txAcceleratorService.speedUpTransaction(
      dto.address,
      dto.nonce,
      dto.privateKey,
      dto.chainId || 1,
      dto.gasMultiplier || 1.5,
    );
  }

  @Post('cancel')
  async cancelTransaction(@Body() dto: CancelTxDto) {
    return this.txAcceleratorService.cancelTransaction(
      dto.address,
      dto.nonce,
      dto.privateKey,
      dto.chainId || 1,
    );
  }

  @Get('gas-recommendation')
  async getGasRecommendation(@Query('chainId') chainId?: string) {
    const chainIdNum = chainId ? parseInt(chainId, 10) : 1;
    return this.txAcceleratorService.getGasRecommendation(chainIdNum);
  }

  @Get('nonce/:address')
  async getNonce(@Param('address') address: string, @Query('chainId') chainId?: string) {
    const chainIdNum = chainId ? parseInt(chainId, 10) : 1;
    return this.txAcceleratorService.getNextNonce(address, chainIdNum);
  }
}
