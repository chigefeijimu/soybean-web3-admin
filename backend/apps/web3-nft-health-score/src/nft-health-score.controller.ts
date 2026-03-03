import { Controller, Get, Post, Query, Body, HttpStatus, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBody } from '@nestjs/swagger';
import { NftHealthScoreService } from './nft-health-score.service';
import { 
  NftHealthScoreQueryDto, 
  NftHealthScoreBatchQueryDto,
  NftHealthScoreResponseDto,
  NftHealthScoreSummaryDto
} from './dto/nft-health-score.dto';

@ApiTags('NFT Collection Health Score')
@Controller('api/nft-health-score')
export class NftHealthScoreController {
  constructor(private readonly nftHealthScoreService: NftHealthScoreService) {}

  @Get('health')
  @ApiOperation({ 
    summary: 'Get NFT collection health score',
    description: 'Analyze and calculate health score for an NFT collection based on holder distribution, trading metrics, market data, and risk factors'
  })
  @ApiQuery({ name: 'contractAddress', description: 'NFT contract address', required: true })
  @ApiQuery({ name: 'chain', description: 'Blockchain chain', required: false, enum: ['ethereum', 'polygon', 'arbitrum', 'optimism', 'base', 'solana'] })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'NFT collection health score',
    type: NftHealthScoreResponseDto
  })
  async getHealthScore(
    @Query() query: NftHealthScoreQueryDto
  ): Promise<NftHealthScoreResponseDto> {
    return this.nftHealthScoreService.getHealthScore(query);
  }

  @Post('batch')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Batch get NFT collection health scores',
    description: 'Analyze multiple NFT collections at once'
  })
  @ApiBody({ 
    type: NftHealthScoreBatchQueryDto,
    examples: {
      example1: {
        value: {
          contractAddresses: [
            '0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d',
            '0x23581767a106ae21c074b2276d25e5c3e136a68b',
            '0xb47e3cd837dDF8e4c57F05d70Ab865de6e193BBB'
          ],
          chain: 'ethereum'
        }
      }
    }
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Batch NFT collection health scores',
    type: NftHealthScoreSummaryDto
  })
  async getBatchHealthScores(
    @Body() query: NftHealthScoreBatchQueryDto
  ): Promise<NftHealthScoreSummaryDto> {
    return this.nftHealthScoreService.getBatchHealthScores(query);
  }

  @Get('stats')
  @ApiOperation({ 
    summary: 'Get API statistics',
    description: 'Get statistics about the NFT health score API'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'API statistics',
    schema: {
      type: 'object',
      properties: {
        totalCollections: { type: 'number' },
        supportedChains: { type: 'array', items: { type: 'string' } },
        endpoints: { type: 'array', items: { type: 'string' } }
      }
    }
  })
  getStats() {
    return {
      totalCollections: 5,
      supportedChains: ['ethereum', 'polygon', 'arbitrum', 'optimism', 'base', 'solana'],
      endpoints: [
        'GET /api/nft-health-score/health?contractAddress=...&chain=...',
        'POST /api/nft-health-score/batch',
        'GET /api/nft-health-score/stats'
      ]
    };
  }
}
