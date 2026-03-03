import { Controller, Get, Query } from '@nestjs/common';
import { CrossChainTimelineService } from './cross-chain-timeline.service';

@Controller('cross-chain-timeline')
export class CrossChainTimelineController {
  constructor(private readonly crossChainTimelineService: CrossChainTimelineService) {}

  /**
   * Get unified timeline across multiple chains
   * GET /cross-chain-timeline?address=0x...&chains=1,137,42161&limit=50&offset=0
   */
  @Get()
  async getTimeline(
    @Query('address') address: string,
    @Query('chains') chains?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const chainIds = chains?.split(',');
    const options = {
      limit: limit ? parseInt(limit) : 50,
      offset: offset ? parseInt(offset) : 0,
    };
    return this.crossChainTimelineService.getCrossChainTimeline(address, chainIds, options);
  }

  /**
   * Get timeline for a specific chain
   * GET /cross-chain-timeline chain?address=0x...&chainId=1&limit=50&offset=0
   */
  @Get('chain')
  async getChainTimeline(
    @Query('address') address: string,
    @Query('chainId') chainId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const options = {
      limit: limit ? parseInt(limit) : 50,
      offset: offset ? parseInt(offset) : 0,
    };
    return this.crossChainTimelineService.getChainTimeline(address, chainId, options);
  }

  /**
   * Get activity summary across chains
   * GET /cross-chain-timeline/summary?address=0x...&chains=1,137
   */
  @Get('summary')
  async getSummary(
    @Query('address') address: string,
    @Query('chains') chains?: string,
  ) {
    const chainIds = chains?.split(',');
    return this.crossChainTimelineService.getActivitySummary(address, chainIds);
  }

  /**
   * Get transaction details by hash
   * GET /cross-chain-timeline/transaction?hash=0x...&chainId=1
   */
  @Get('transaction')
  async getTransaction(
    @Query('hash') hash: string,
    @Query('chainId') chainId: string,
  ) {
    return this.crossChainTimelineService.getTransactionDetails(hash, chainId);
  }

  /**
   * Get supported chains
   * GET /cross-chain-timeline/chains
   */
  @Get('chains')
  async getChains() {
    return this.crossChainTimelineService.getSupportedChains();
  }
}
