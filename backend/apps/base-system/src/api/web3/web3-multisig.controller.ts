import { Controller, Get, Post, Delete, Query, Body, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

interface MultisigWallet {
  id: string;
  name: string;
  address: string;
  owners: string[];
  requiredSignatures: number;
  threshold: number;
  chainId: number;
  createdAt: string;
  balance: string;
  pendingTransactions: PendingTransaction[];
}

interface PendingTransaction {
  id: string;
  to: string;
  value: string;
  data: string;
  signatures: string[];
  executed: boolean;
  createdAt: string;
}

// In-memory storage (replace with database in production)
const wallets: Map<string, MultisigWallet> = new Map();
let walletCounter = 1;

@ApiTags('Web3 Multisig Wallet')
@Controller('web3/multisig')
export class Web3MultisigController {
  @Post('wallets')
  @ApiOperation({ summary: '创建多签钱包' })
  async createWallet(
    @Body() createDto: {
      name: string;
      owners: string[];
      threshold: number;
      chainId?: number;
    },
  ) {
    const walletAddress = this.generateWalletAddress();
    const wallet: MultisigWallet = {
      id: `wallet_${walletCounter++}`,
      name: createDto.name,
      address: walletAddress,
      owners: createDto.owners,
      requiredSignatures: createDto.threshold,
      threshold: createDto.threshold,
      chainId: createDto.chainId || 1,
      createdAt: new Date().toISOString(),
      balance: '0',
      pendingTransactions: [],
    };

    wallets.set(wallet.id, wallet);
    return wallet;
  }

  @Get('wallets')
  @ApiOperation({ summary: '获取多签钱包列表' })
  async getWallets(@Query('owner') owner?: string) {
    const allWallets = Array.from(wallets.values());
    
    if (owner) {
      return allWallets.filter(w => w.owners.includes(owner));
    }
    
    return allWallets;
  }

  @Get('wallets/:id')
  @ApiOperation({ summary: '获取多签钱包详情' })
  async getWallet(@Param('id') id: string) {
    const wallet = wallets.get(id);
    if (!wallet) {
      throw new Error('Wallet not found');
    }
    return wallet;
  }

  @Post('wallets/:id/transactions')
  @ApiOperation({ summary: '创建多签交易' })
  async createTransaction(
    @Param('id') walletId: string,
    @Body() txDto: {
      to: string;
      value: string;
      data?: string;
      signer: string;
    },
  ) {
    const wallet = wallets.get(walletId);
    if (!wallet) {
      throw new Error('Wallet not found');
    }

    if (!wallet.owners.includes(txDto.signer)) {
      throw new Error('Signer is not an owner');
    }

    const transaction: PendingTransaction = {
      id: `tx_${Date.now()}`,
      to: txDto.to,
      value: txDto.value,
      data: txDto.data || '0x',
      signatures: [txDto.signer],
      executed: false,
      createdAt: new Date().toISOString(),
    };

    wallet.pendingTransactions.push(transaction);
    return transaction;
  }

  @Post('wallets/:id/transactions/:txId/sign')
  @ApiOperation({ summary: '签名交易' })
  async signTransaction(
    @Param('id') walletId: string,
    @Param('txId') txId: string,
    @Body() signDto: { signer: string },
  ) {
    const wallet = wallets.get(walletId);
    if (!wallet) {
      throw new Error('Wallet not found');
    }

    const tx = wallet.pendingTransactions.find(t => t.id === txId);
    if (!tx) {
      throw new Error('Transaction not found');
    }

    if (!wallet.owners.includes(signDto.signer)) {
      throw new Error('Signer is not an owner');
    }

    if (!tx.signatures.includes(signDto.signer)) {
      tx.signatures.push(signDto.signer);
    }

    // Check if threshold is met
    const canExecute = tx.signatures.length >= wallet.threshold;
    
    return {
      transaction: tx,
      canExecute,
      signaturesRequired: wallet.threshold,
      signaturesReceived: tx.signatures.length,
    };
  }

  @Post('wallets/:id/transactions/:txId/execute')
  @ApiOperation({ summary: '执行交易' })
  async executeTransaction(
    @Param('id') walletId: string,
    @Param('txId') txId: string,
  ) {
    const wallet = wallets.get(walletId);
    if (!wallet) {
      throw new Error('Wallet not found');
    }

    const tx = wallet.pendingTransactions.find(t => t.id === txId);
    if (!tx) {
      throw new Error('Transaction not found');
    }

    if (tx.signatures.length < wallet.threshold) {
      throw new Error('Not enough signatures');
    }

    if (tx.executed) {
      throw new Error('Transaction already executed');
    }

    // In production, this would broadcast to the blockchain
    tx.executed = true;
    
    return {
      success: true,
      transaction: tx,
      hash: `0x${Buffer.from(`${tx.id}-${Date.now()}`).toString('hex').slice(0, 64)}`,
    };
  }

  @Delete('wallets/:id')
  @ApiOperation({ summary: '删除多签钱包' })
  async deleteWallet(@Param('id') id: string) {
    if (!wallets.has(id)) {
      throw new Error('Wallet not found');
    }
    wallets.delete(id);
    return { success: true };
  }

  private generateWalletAddress(): string {
    // Generate a pseudo-random address (in production, use proper key derivation)
    const randomHex = Array.from({ length: 40 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
    return `0x${randomHex}`;
  }
}
