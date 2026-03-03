import { Controller, Get, Post, Body, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { MultisigTxBuilderService } from '../service/multisig-tx-builder.service';
import { CreateMultisigWalletDto, CreateTransactionDto, SignTransactionDto, ExecuteTransactionDto, GetTransactionsDto } from '../dto/multisig-tx.dto';

@Controller('web3/multisig-tx-builder')
export class MultisigTxBuilderController {
  constructor(private readonly multisigService: MultisigTxBuilderService) {}

  @Post('wallets')
  @HttpCode(HttpStatus.CREATED)
  async createWallet(@Body() dto: CreateMultisigWalletDto) {
    return this.multisigService.createWallet(dto);
  }

  @Get('wallets')
  async listWallets() {
    return this.multisigService.listWallets();
  }

  @Get('wallets/:address')
  async getWallet(@Param('address') address: string) {
    const wallet = await this.multisigService.getWallet(address.toLowerCase());
    if (!wallet) {
      return { error: 'Wallet not found' };
    }
    return wallet;
  }

  @Post('transactions')
  @HttpCode(HttpStatus.CREATED)
  async createTransaction(@Body() dto: CreateTransactionDto) {
    return this.multisigService.createTransaction(dto);
  }

  @Get('transactions')
  async getTransactions(@Query() query: GetTransactionsDto) {
    return this.multisigService.getTransactions(query);
  }

  @Get('transactions/:txHash')
  async getTransaction(@Param('txHash') txHash: string) {
    const tx = await this.multisigService.getTransaction(txHash);
    if (!tx) {
      return { error: 'Transaction not found' };
    }
    return tx;
  }

  @Post('transactions/sign')
  async signTransaction(@Body() dto: SignTransactionDto) {
    return this.multisigService.signTransaction(dto);
  }

  @Post('transactions/execute')
  async executeTransaction(@Body() dto: ExecuteTransactionDto) {
    return this.multisigService.executeTransaction(dto);
  }

  @Post('transactions/:txHash/simulate')
  async simulateExecution(@Param('txHash') txHash: string) {
    return this.multisigService.simulateExecution(txHash);
  }

  @Get('onchain/:address')
  async getOnChainInfo(@Param('address') address: string, @Query('chain') chain?: string) {
    return this.multisigService.getOnChainMultisigInfo(address, chain || 'ethereum');
  }
}
