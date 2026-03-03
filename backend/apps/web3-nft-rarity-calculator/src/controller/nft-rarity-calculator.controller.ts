import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { NftRarityCalculatorService, NftRarityInput, NftRarityResult, CollectionRarityStats } from './service/nft-rarity-calculator.service';

class CalculateRarityDto {
  collectionAddress: string;
  chain: 'ethereum' | 'polygon' | 'arbitrum' | 'optimism' | 'base' | 'solana';
  tokenId?: string;
}

class BatchRarityDto {
  collectionAddress: string;
  chain: 'ethereum' | 'polygon' | 'arbitrum' | 'optimism' | 'base' | 'solana';
  tokenIds: string[];
}

class CollectionStatsQuery {
  collectionAddress: string;
  chain: string;
  limit?: number;
}

@Controller('nft-rarity')
export class NftRarityCalculatorController {
  constructor(private readonly rarityService: NftRarityCalculatorService) {}

  /**
   * Calculate rarity for a single NFT
   */
  @Post('calculate')
  async calculateRarity(@Body() dto: CalculateRarityDto): Promise<NftRarityResult> {
    return this.rarityService.calculateNftRarity(dto);
  }

  /**
   * Get collection rarity statistics
   */
  @Get('collection/:address')
  async getCollectionStats(
    @Param('address') address: string,
    @Query('chain') chain: string,
    @Query('limit') limit?: string,
  ): Promise<CollectionRarityStats> {
    return this.rarityService.getCollectionRarityStats(
      address,
      chain,
      limit ? parseInt(limit, 10) : 100,
    );
  }

  /**
   * Batch calculate rarity for multiple NFTs
   */
  @Post('batch')
  async batchCalculateRarity(@Body() dto: BatchRarityDto): Promise<NftRarityResult[]> {
    return this.rarityService.batchCalculateRarity(
      dto.collectionAddress,
      dto.chain,
      dto.tokenIds,
    );
  }

  /**
   * Find rare traits in a collection
   */
  @Get('rare-traits/:address')
  async findRareTraits(
    @Param('address') address: string,
    @Query('chain') chain: string,
  ): Promise<{ trait: string; value: string; rarity: number }[]> {
    return this.rarityService.findRareTraits(address, chain);
  }

  /**
   * Health check endpoint
   */
  @Get('health')
  healthCheck(): { status: string; timestamp: string } {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
