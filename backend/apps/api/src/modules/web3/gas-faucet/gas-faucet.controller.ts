import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { GasFaucetService } from './gas-faucet.service';

class FaucetRequestDto {
  address: string;
  network: string;
  amount?: string;
  email?: string;
}

@Controller('web3/gas-faucet')
export class GasFaucetController {
  constructor(private readonly gasFaucetService: GasFaucetService) {}

  /**
   * Get supported networks
   */
  @Get('networks')
  getSupportedNetworks() {
    return this.gasFaucetService.getSupportedNetworks();
  }

  /**
   * Get faucet address for a network
   */
  @Get('address/:network')
  getFaucetAddress(@Param('network') network: string) {
    return this.gasFaucetService.getFaucetAddress(network);
  }

  /**
   * Request tokens from faucet
   */
  @Post('request')
  requestTokens(@Body() dto: FaucetRequestDto) {
    return this.gasFaucetService.requestTokens({
      address: dto.address,
      network: dto.network,
      amount: dto.amount || '0.5',
      email: dto.email,
    });
  }

  /**
   * Get transaction history
   */
  @Get('history/:address')
  getTransactionHistory(@Param('address') address: string) {
    return this.gasFaucetService.getTransactionHistory(address);
  }

  /**
   * Get transaction status
   */
  @Get('status/:txHash')
  getTransactionStatus(@Param('txHash') txHash: string) {
    return this.gasFaucetService.getTransactionStatus(txHash);
  }

  /**
   * Get gas recommendations
   */
  @Get('gas-recommendations')
  getGasRecommendations() {
    return this.gasFaucetService.getGasRecommendations();
  }

  /**
   * Get bridge quote
   */
  @Get('bridge-quote')
  getBridgeQuote(
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('amount') amount: string,
  ) {
    return this.gasFaucetService.getBridgeQuote(from, to, amount);
  }
}
