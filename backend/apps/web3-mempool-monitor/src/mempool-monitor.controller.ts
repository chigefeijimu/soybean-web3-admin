import { Controller, Get, Param, Query } from '@nestjs/common';
import { MempoolMonitorService } from './mempool-monitor.service';

@Controller('web3/mempool')
export class MempoolMonitorController {
  constructor(private readonly mempoolService: MempoolMonitorService) {}

  /**
   * Get current mempool transactions for a chain
   */
  @Get(':chainId')
  async getMempool(
    @Param('chainId') chainId: string,
    @Query('limit') limit?: string,
    @Query('minGas') minGas?: string,
    @Query('address') address?: string
  ) {
    const chainIdNum = parseInt(chainId);
    return this.mempoolService.getMempoolTransactions(
      chainIdNum,
      limit ? parseInt(limit) : 50,
      minGas ? parseFloat(minGas) : 0,
      address
    );
  }

  /**
   * Get pending transactions for a specific address
   */
  @Get('address/:address')
  async getAddressPendingTx(
    @Param('address') address: string,
    @Query('chainId') chainId?: string
  ) {
    return this.mempoolService.getPendingTransactionsByAddress(
      address,
      chainId ? parseInt(chainId) : 1
    );
  }

  /**
   * Get mempool statistics for a chain
   */
  @Get('stats/:chainId')
  async getMempoolStats(@Param('chainId') chainId: string) {
    return this.mempoolService.getMempoolStats(parseInt(chainId));
  }

  /**
   * Get gas price trends in mempool
   */
  @Get('gas-trend/:chainId')
  async getGasTrend(
    @Param('chainId') chainId: string,
    @Query('hours') hours?: string
  ) {
    return this.mempoolService.getGasPriceTrend(
      parseInt(chainId),
      hours ? parseInt(hours) : 24
    );
  }

  /**
   * Get top pending transactions by gas price
   */
  @Get('top/:chainId')
  async getTopTransactions(
    @Param('chainId') chainId: string,
    @Query('limit') limit?: string
  ) {
    return this.mempoolService.getTopPendingTransactions(
      parseInt(chainId),
      limit ? parseInt(limit) : 10
    );
  }
}
