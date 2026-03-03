import { Controller, Get, Param, Query, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import {
  Web3NftBridgeApiService,
  NftBridge,
  BridgeQuote,
  NftBridgeStats,
  BridgeRoute,
} from './web3-nft-bridge-api.service';

@ApiTags('NFT Bridge')
@Controller('web3-nft-bridge-api')
export class Web3NftBridgeApiController {
  constructor(private readonly service: Web3NftBridgeApiService) {}

  @Get('bridges')
  @ApiOperation({ summary: 'Get all supported NFT bridges' })
  getAllBridges(): NftBridge[] {
    return this.service.getAllBridges();
  }

  @Get('bridges/:id')
  @ApiOperation({ summary: 'Get NFT bridge by ID' })
  @ApiParam({ name: 'id', description: 'Bridge identifier (e.g., layerzero, wormhole, stargate)' })
  getBridgeById(@Param('id') id: string): NftBridge {
    const bridge = this.service.getBridgeById(id);
    if (!bridge) {
      throw new HttpException(`Bridge '${id}' not found`, HttpStatus.NOT_FOUND);
    }
    return bridge;
  }

  @Get('bridges/chain/:chain')
  @ApiOperation({ summary: 'Get bridges supporting a specific chain' })
  @ApiParam({ name: 'chain', description: 'Chain identifier (e.g., ethereum, polygon, arbitrum)' })
  getBridgesByChain(@Param('chain') chain: string): NftBridge[] {
    return this.service.getBridgesByChain(chain);
  }

  @Get('route/:fromChain/:toChain')
  @ApiOperation({ summary: 'Get available bridge routes between two chains' })
  @ApiParam({ name: 'fromChain', description: 'Source chain (e.g., ethereum)' })
  @ApiParam({ name: 'toChain', description: 'Destination chain (e.g., polygon)' })
  getRouteOptions(
    @Param('fromChain') fromChain: string,
    @Param('toChain') toChain: string,
  ): BridgeRoute {
    return this.service.getRouteOptions(fromChain, toChain);
  }

  @Get('quote/:bridgeId')
  @ApiOperation({ summary: 'Get bridge quote for specific NFT' })
  @ApiParam({ name: 'bridgeId', description: 'Bridge identifier' })
  @ApiQuery({ name: 'fromChain', required: true, description: 'Source chain' })
  @ApiQuery({ name: 'toChain', required: true, description: 'Destination chain' })
  @ApiQuery({ name: 'nftContract', required: true, description: 'NFT contract address' })
  @ApiQuery({ name: 'tokenId', required: true, description: 'NFT token ID' })
  getQuote(
    @Param('bridgeId') bridgeId: string,
    @Query('fromChain') fromChain: string,
    @Query('toChain') toChain: string,
    @Query('nftContract') nftContract: string,
    @Query('tokenId') tokenId: string,
  ): BridgeQuote {
    try {
      return this.service.getQuote(bridgeId, fromChain, toChain, nftContract, tokenId);
    } catch (error) {
      throw new HttpException(
        `Failed to get quote: ${error.message}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Get('chains')
  @ApiOperation({ summary: 'Get all supported chains for NFT bridging' })
  getSupportedChains() {
    return this.service.getSupportedChains();
  }

  @Get('standards')
  @ApiOperation({ summary: 'Get all supported NFT standards' })
  getSupportedStandards() {
    return this.service.getSupportedNftStandards();
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get NFT bridge statistics' })
  getStats(): NftBridgeStats {
    return this.service.getStats();
  }

  @Get('connectivity')
  @ApiOperation({ summary: 'Get chain connectivity matrix' })
  getChainConnectivityMatrix() {
    return this.service.getChainConnectivityMatrix();
  }

  @Get('compare')
  @ApiOperation({ summary: 'Compare multiple bridges' })
  @ApiQuery({ name: 'bridges', required: true, description: 'Comma-separated bridge IDs' })
  compareBridges(@Query('bridges') bridges: string): NftBridge[] {
    const bridgeIds = bridges.split(',').map(b => b.trim());
    return this.service.getBridgeComparison(bridgeIds);
  }

  @Get('popular-routes')
  @ApiOperation({ summary: 'Get popular bridge routes' })
  getPopularRoutes() {
    return this.service.getPopularRoutes();
  }

  @Get('search')
  @ApiOperation({ summary: 'Search bridges by name or features' })
  @ApiQuery({ name: 'q', required: true, description: 'Search query' })
  searchBridges(@Query('q') query: string): NftBridge[] {
    return this.service.searchBridges(query);
  }
}
