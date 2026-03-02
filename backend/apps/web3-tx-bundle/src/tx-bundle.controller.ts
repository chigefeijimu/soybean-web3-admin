import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';

class TransactionItem {
  to: string;
  value: string;
  data: string;
  chainId: number;
  gasLimit?: string;
}

class CreateBundleDto {
  transactions: TransactionItem[];
  name?: string;
  executeImmediately?: boolean;
}

class ExecuteBundleDto {
  bundleId: string;
  gasMultiplier?: number;
}

class BundleResponse {
  id: string;
  transactions: TransactionItem[];
  status: 'pending' | 'executing' | 'completed' | 'failed' | 'cancelled';
  createdAt: string;
  executedAt?: string;
  totalGasUsed?: string;
  results?: any[];
}

@ApiTags('Transaction Bundle')
@Controller('tx-bundle')
export class TxBundleController {
  private bundles = new Map<string, any>();
  private bundleCounter = 0;

  @Post()
  @ApiOperation({ summary: 'Create a new transaction bundle' })
  createBundle(@Body() dto: CreateBundleDto): BundleResponse {
    const id = `bundle_${++this.bundleCounter}_${Date.now()}`;
    const bundle: BundleResponse = {
      id,
      transactions: dto.transactions,
      status: dto.executeImmediately ? 'executing' : 'pending',
      createdAt: new Date().toISOString(),
    };
    
    this.bundles.set(id, bundle);
    
    // Simulate execution for demo
    if (dto.executeImmediately) {
      setTimeout(() => {
        bundle.status = 'completed';
        bundle.executedAt = new Date().toISOString();
        bundle.totalGasUsed = (dto.transactions.length * 21000).toString();
        bundle.results = dto.transactions.map((tx, i) => ({
          index: i,
          success: true,
          txHash: `0x${Math.random().toString(16).substr(2, 64)}`,
          gasUsed: '21000'
        }));
      }, 2000);
    }
    
    return bundle;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get bundle status' })
  getBundle(@Param('id') id: string): BundleResponse | { error: string } {
    const bundle = this.bundles.get(id);
    if (!bundle) {
      return { error: 'Bundle not found' };
    }
    return bundle;
  }

  @Post(':id/execute')
  @ApiOperation({ summary: 'Execute a pending bundle' })
  executeBundle(
    @Param('id') id: string,
    @Body() dto: ExecuteBundleDto
  ): BundleResponse | { error: string } {
    const bundle = this.bundles.get(id);
    if (!bundle) {
      return { error: 'Bundle not found' };
    }
    if (bundle.status !== 'pending') {
      return { error: 'Bundle is not in pending status' };
    }
    
    bundle.status = 'executing';
    
    // Simulate execution
    setTimeout(() => {
      bundle.status = 'completed';
      bundle.executedAt = new Date().toISOString();
      const gasMultiplier = dto.gasMultiplier || 1;
      bundle.totalGasUsed = (bundle.transactions.length * 21000 * gasMultiplier).toString();
      bundle.results = bundle.transactions.map((tx, i) => ({
        index: i,
        success: true,
        txHash: `0x${Math.random().toString(16).substr(2, 64)}`,
        gasUsed: (21000 * gasMultiplier).toString()
      }));
    }, 3000);
    
    return bundle;
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel a pending bundle' })
  cancelBundle(@Param('id') id: string): BundleResponse | { error: string } {
    const bundle = this.bundles.get(id);
    if (!bundle) {
      return { error: 'Bundle not found' };
    }
    if (bundle.status !== 'pending') {
      return { error: 'Can only cancel pending bundles' };
    }
    
    bundle.status = 'cancelled';
    return bundle;
  }

  @Get()
  @ApiOperation({ summary: 'List all bundles' })
  listBundles(): BundleResponse[] {
    return Array.from(this.bundles.values());
  }

  @Get('estimate/gas')
  @ApiOperation({ summary: 'Estimate gas for a bundle' })
  @ApiQuery({ name: 'chainId', required: true })
  estimateBundleGas(@Query('chainId') chainId: string): {
    chainId: number;
    estimatedGas: string;
    estimatedCostUSD: string;
    transactions: { index: number; estimatedGas: string }[];
  } {
    const chainIdNum = parseInt(chainId, 10);
    const baseGasPerTx = 21000;
    const ethPriceUSD = 2500; // Would fetch from API
    
    // Mock gas prices by chain
    const gasPrices: Record<number, string> = {
      1: '30',      // ETH mainnet
      137: '50',    // Polygon
      42161: '10',  // Arbitrum
      10: '5',      // Optimism
      56: '5',      // BSC
      8453: '1',    // Base
    };
    
    const gasPrice = gasPrices[chainIdNum] || '30';
    const numTransactions = 3; // Default estimate
    
    return {
      chainId: chainIdNum,
      estimatedGas: (numTransactions * baseGasPerTx).toString(),
      estimatedCostUSD: ((numTransactions * baseGasPerTx * parseInt(gasPrice) * ethPriceUSD) / 1e9).toFixed(2),
      transactions: Array.from({ length: numTransactions }, (_, i) => ({
        index: i,
        estimatedGas: baseGasPerTx.toString()
      }))
    };
  }
}
