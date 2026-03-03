import { Controller, Get, Post, Body, Param, Query, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { AddressClusteringService } from './address-clustering.service';

@Controller('api/address-clustering')
export class AddressClusteringController {
  constructor(private readonly clusteringService: AddressClusteringService) {}

  @Get('analyze')
  async analyzeCluster(
    @Query('address') address: string,
    @Query('chain') chain: string = 'ethereum',
    @Query('depth') depth: number = 1,
  ) {
    if (!address) {
      return { error: 'Address is required' };
    }
    return this.clusteringService.analyzeAddressCluster(address, chain, Math.min(Math.max(depth, 1), 3));
  }

  @Get('cluster/:address')
  async getCluster(
    @Param('address') address: string,
    @Query('chain') chain: string = 'ethereum',
    @Query('depth') depth: number = 1,
  ) {
    return this.clusteringService.analyzeAddressCluster(address, chain, Math.min(Math.max(depth, 1), 3));
  }

  @Post('cluster')
  async findCluster(
    @Body() body: { 
      addresses: string[]; 
      chain?: string;
      method?: 'transaction' | 'time' | 'amount' | 'combined';
    },
  ) {
    const { addresses, chain = 'ethereum', method = 'combined' } = body;
    
    if (!addresses || !Array.isArray(addresses) || addresses.length < 2) {
      return { error: 'At least 2 addresses are required' };
    }
    
    if (addresses.length > 50) {
      return { error: 'Maximum 50 addresses allowed per request' };
    }
    
    return this.clusteringService.findAddressClusters(addresses, chain, method);
  }

  @Get('relationship/:address1/:address2')
  async getRelationship(
    @Param('address1') address1: string,
    @Param('address2') address2: string,
    @Query('chain') chain: string = 'ethereum',
  ) {
    return this.clusteringService.analyzeRelationship(address1, address2, chain);
  }

  @Get('graph/:address')
  async getClusterGraph(
    @Param('address') address: string,
    @Query('chain') chain: string = 'ethereum',
    @Query('depth') depth: number = 1,
  ) {
    return this.clusteringService.generateClusterGraph(address, chain, Math.min(Math.max(depth, 1), 3));
  }

  @Post('batch')
  async batchCluster(
    @Body() body: { 
      seedAddresses: string[]; 
      chain?: string;
      maxResults?: number;
    },
  ) {
    const { seedAddresses, chain = 'ethereum', maxResults = 100 } = body;
    
    if (!seedAddresses || !Array.isArray(seedAddresses) || seedAddresses.length === 0) {
      return { error: 'At least 1 seed address is required' };
    }
    
    if (seedAddresses.length > 10) {
      return { error: 'Maximum 10 seed addresses allowed' };
    }
    
    return this.clusteringService.batchClusterDiscovery(seedAddresses, chain, Math.min(maxResults, 500));
  }

  @Get('top-hubs')
  async getTopHubs(
    @Query('chain') chain: string = 'ethereum',
    @Query('limit') limit: number = 10,
  ) {
    return this.clusteringService.getTopHubAddresses(chain, Math.min(Math.max(limit, 1), 50));
  }

  @Get('health')
  health() {
    return { 
      status: 'ok', 
      service: 'address-clustering',
      timestamp: new Date().toISOString(),
    };
  }

  @Get()
  root() {
    return {
      name: 'Address Clustering Analyzer API',
      version: '1.0.0',
      description: 'Analyze and identify address clusters that may be controlled by the same entity',
      endpoints: {
        analyze: 'GET /api/address-clustering/analyze?address=0x...&chain=ethereum&depth=1',
        cluster: 'GET /api/address-clustering/cluster/:address?chain=ethereum&depth=1',
        findCluster: 'POST /api/address-clustering/cluster',
        relationship: 'GET /api/address-clustering/relationship/:address1/:address2?chain=ethereum',
        graph: 'GET /api/address-clustering/graph/:address?chain=ethereum&depth=1',
        batch: 'POST /api/address-clustering/batch',
        topHubs: 'GET /api/address-clustering/top-hubs?chain=ethereum&limit=10',
        health: 'GET /api/address-clustering/health',
      },
      supportedChains: ['ethereum', 'polygon', 'arbitrum', 'optimism', 'bsc', 'base', 'avalanche'],
      clusteringMethods: {
        transaction: 'Cluster based on shared transaction counterparties',
        time: 'Cluster based on similar transaction timing patterns',
        amount: 'Cluster based on similar transaction amount patterns',
        combined: 'Use all signals for clustering (recommended)',
      },
      useCases: [
        'Identify wallet clusters controlled by the same entity',
        'Detect potential whale wallets and their associated addresses',
        'Analyze fund flow between related addresses',
        'Identify exchange hot/cold wallets',
        'Discover smart contract deployment addresses',
      ],
    };
  }
}
