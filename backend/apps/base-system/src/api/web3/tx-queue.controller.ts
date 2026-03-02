import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

interface TransactionQueueItem {
  id: string;
  from: string;
  to: string;
  value: string;
  data: string;
  gasPrice: string;
  gasLimit: number;
  nonce: number;
  status: 'pending' | 'submitted' | 'confirmed' | 'failed' | 'cancelled';
  chainId: number;
  hash?: string;
  createdAt: Date;
  updatedAt: Date;
}

@Controller('web3/tx-queue')
export class TxQueueController {
  private txQueue: Map<string, TransactionQueueItem[]> = new Map();

  constructor(private readonly httpService: HttpService) {}

  @Get('list/:address')
  async getQueue(
    @Param('address') address: string,
    @Query('chainId') chainId: string,
  ) {
    const key = `${address.toLowerCase()}-${chainId || '1'}`;
    const queue = this.txQueue.get(key) || [];
    
    return {
      success: true,
      data: queue,
      pendingCount: queue.filter(t => t.status === 'pending').length,
      totalCount: queue.length,
    };
  }

  @Post('add')
  async addTransaction(@Body() body: {
    address: string;
    chainId: number;
    to: string;
    value?: string;
    data?: string;
    gasPrice?: string;
    gasLimit?: number;
  }) {
    const { address, chainId, to, value = '0', data = '0x', gasPrice, gasLimit = 21000 } = body;
    const key = `${address.toLowerCase()}-${chainId}`;
    
    if (!this.txQueue.has(key)) {
      this.txQueue.set(key, []);
    }
    
    const queue = this.txQueue.get(key)!;
    const nonce = queue.filter(t => t.status === 'pending').length;
    
    const txItem: TransactionQueueItem = {
      id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      from: address.toLowerCase(),
      to,
      value,
      data,
      gasPrice: gasPrice || await this.getRecommendedGas(chainId),
      gasLimit,
      nonce,
      status: 'pending',
      chainId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    queue.push(txItem);
    
    return {
      success: true,
      data: txItem,
    };
  }

  @Post('update/:id')
  async updateTransaction(
    @Param('id') id: string,
    @Body() body: Partial<TransactionQueueItem>,
  ) {
    for (const [key, queue] of this.txQueue) {
      const index = queue.findIndex(t => t.id === id);
      if (index !== -1) {
        queue[index] = { ...queue[index], ...body, updatedAt: new Date() };
        return { success: true, data: queue[index] };
      }
    }
    
    return { success: false, error: 'Transaction not found' };
  }

  @Delete('remove/:id')
  async removeTransaction(@Param('id') id: string) {
    for (const [key, queue] of this.txQueue) {
      const index = queue.findIndex(t => t.id === id);
      if (index !== -1) {
        const removed = queue.splice(index, 1)[0];
        return { success: true, data: removed };
      }
    }
    
    return { success: false, error: 'Transaction not found' };
  }

  @Post('clear/:address')
  async clearQueue(
    @Param('address') address: string,
    @Query('chainId') chainId: string,
  ) {
    const key = `${address.toLowerCase()}-${chainId || '1'}`;
    const cleared = this.txQueue.get(key) || [];
    this.txQueue.set(key, []);
    
    return {
      success: true,
      clearedCount: cleared.length,
    };
  }

  @Post('reorder')
  async reorderQueue(@Body() body: { address: string; chainId: number; order: string[] }) {
    const { address, chainId, order } = body;
    const key = `${address.toLowerCase()}-${chainId}`;
    const queue = this.txQueue.get(key) || [];
    
    const reordered = order.map((id, index) => {
      const tx = queue.find(t => t.id === id);
      if (tx) {
        tx.nonce = index;
        return tx;
      }
      return null;
    }).filter(Boolean) as TransactionQueueItem[];
    
    this.txQueue.set(key, reordered);
    
    return { success: true, data: reordered };
  }

  @Get('estimate-gas')
  async estimateGas(
    @Query('chainId') chainId: string,
    @Query('to') to: string,
    @Query('data') data: string,
  ) {
    try {
      const chainIdNum = parseInt(chainId, 10);
      const rpcUrl = this.getRpcUrl(chainIdNum);
      
      const result = await firstValueFrom(
        this.httpService.post(rpcUrl, {
          jsonrpc: '2.0',
          method: 'eth_estimateGas',
          params: [{ to, data }],
          id: 1,
        })
      );
      
      return {
        success: true,
        data: {
          gasEstimate: parseInt(result.data.result, 16),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to estimate gas',
      };
    }
  }

  private async getRecommendedGas(chainId: number): Promise<string> {
    try {
      const rpcUrl = this.getRpcUrl(chainId);
      const result = await firstValueFrom(
        this.httpService.post(rpcUrl, {
          jsonrpc: '2.0',
          method: 'eth_gasPrice',
          params: [],
          id: 1,
        })
      );
      return result.data.result;
    } catch {
      return '0x4A817C800'; // 20 Gwei default
    }
  }

  private getRpcUrl(chainId: number): string {
    const rpcUrls: Record<number, string> = {
      1: process.env.ETH_RPC_URL || 'https://eth.llamarpc.com',
      5: 'https://goerli.infura.io/v3/84842078b09946638c03157f83405213',
      137: process.env.POLYGON_RPC_URL || 'https://polygon.llamarpc.com',
      42161: process.env.ARBITRUM_RPC_URL || 'https://arb1.arbitrum.io/rpc',
      10: process.env.OPTIMISM_RPC_URL || 'https://mainnet.optimism.io',
      56: process.env.BSC_RPC_URL || 'https://bsc-dataseed.binance.org',
      8453: process.env.BASE_RPC_URL || 'https://mainnet.base.org',
    };
    return rpcUrls[chainId] || rpcUrls[1];
  }
}
