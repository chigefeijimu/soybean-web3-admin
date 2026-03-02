import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';

@ApiTags('NFT Collection Tracker')
@Controller('nft-collection-tracker')
export class NftCollectionTrackerController {
  @Get('collections')
  @ApiOperation({ summary: 'Get NFT collections' })
  async getCollections(@Query('chain') chain?: string) {
    return { message: 'NFT Collection Tracker API', collections: [] };
  }

  @Get('collection/:address')
  @ApiOperation({ summary: 'Get NFT collection details' })
  async getCollection(@Param('address') address: string) {
    return { message: 'NFT Collection Tracker API', address };
  }
}
