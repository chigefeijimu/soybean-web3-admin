import { IsString, IsOptional, IsEnum, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export enum ChainEnum {
  ethereum = 'ethereum',
  polygon = 'polygon',
  arbitrum = 'arbitrum',
  optimism = 'optimism',
  base = 'base',
  solana = 'solana',
}

export class NftHealthScoreQueryDto {
  @ApiProperty({ description: 'NFT contract address', example: '0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d' })
  @IsString()
  contractAddress: string;

  @ApiPropertyOptional({ enum: ChainEnum, example: 'ethereum' })
  @IsOptional()
  @IsEnum(ChainEnum)
  chain?: ChainEnum = ChainEnum.ethereum;
}

export class NftHealthScoreBatchQueryDto {
  @ApiProperty({ description: 'List of NFT contract addresses', example: ['0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d', '0x23581767a106ae21c074b2276d25e5c3e136a68b'] })
  @IsString({ each: true })
  contractAddresses: string[];

  @ApiPropertyOptional({ enum: ChainEnum, example: 'ethereum' })
  @IsOptional()
  @IsEnum(ChainEnum)
  chain?: ChainEnum = ChainEnum.ethereum;
}

export class NftCollectionStatsDto {
  @ApiProperty({ description: 'Total number of NFTs in collection' })
  totalSupply: number;

  @ApiProperty({ description: 'Number of unique holders' })
  holderCount: number;

  @ApiProperty({ description: 'Number of floor price listings' })
  listingCount: number;

  @ApiProperty({ description: '24h trading volume' })
  volume24h: number;

  @ApiProperty({ description: 'Total trading volume' })
  totalVolume: number;

  @ApiProperty({ description: 'Number of owners' })
  ownerCount: number;

  @ApiProperty({ description: 'Collection age in days' })
  collectionAge: number;
}

export class HolderDistributionDto {
  @ApiProperty({ description: 'Top 10 holder percentages' })
  top10HolderPercent: number;

  @ApiProperty({ description: 'Top 25 holder percentages' })
  top25HolderPercent: number;

  @ApiProperty({ description: 'Top 50 holder percentages' })
  top50HolderPercent: number;

  @ApiProperty({ description: 'Concentration risk level: low/medium/high' })
  concentrationRisk: 'low' | 'medium' | 'high';

  @ApiProperty({ description: 'Gini coefficient (0-1, higher = more unequal)' })
  giniCoefficient: number;
}

export class TradingMetricsDto {
  @ApiProperty({ description: 'Wash trading suspicion score (0-100)' })
  washTradingScore: number;

  @ApiProperty({ description: 'Is wash trading detected' })
  isWashTradingDetected: boolean;

  @ApiProperty({ description: '24h average price' })
  avgPrice24h: number;

  @ApiProperty({ description: '7d average price' })
  avgPrice7d: number;

  @ApiProperty({ description: 'Price volatility (0-100)' })
  priceVolatility: number;

  @ApiProperty({ description: 'Sales count in last 24h' })
  salesCount24h: number;

  @ApiProperty({ description: 'Unique buyer count 24h' })
  uniqueBuyers24h: number;

  @ApiProperty({ description: 'Average time between sales (minutes)' })
  avgTimeBetweenSales: number;
}

export class MarketMetricsDto {
  @ApiProperty({ description: 'Current floor price' })
  floorPrice: number;

  @ApiProperty({ description: 'Floor price change 24h (%)' })
  floorPriceChange24h: number;

  @ApiProperty({ description: 'Highest sale price' })
  highestSale: number;

  @ApiProperty({ description: 'Lowest sale price' })
  lowestSale: number;

  @ApiProperty({ description: 'Market cap (floor * supply)' })
  marketCap: number;

  @ApiProperty({ description: 'Royalty percentage' })
  royaltyPercent: number;
}

export class RiskFactorsDto {
  @ApiProperty({ description: 'Ownership concentration risk (0-100)' })
  ownershipConcentration: number;

  @ApiProperty({ description: 'Wash trading risk (0-100)' })
  washTradingRisk: number;

  @ApiProperty({ description: 'Liquidity risk (0-100)' })
  liquidityRisk: number;

  @ApiProperty({ description: 'Manipulation risk (0-100)' })
  manipulationRisk: number;

  @ApiProperty({ description: 'Smart contract risk (0-100)' })
  contractRisk: number;

  @ApiProperty({ description: 'Overall risk level' })
  overallRisk: 'low' | 'medium' | 'high' | 'critical';

  @ApiProperty({ description: 'Risk factors explanation' })
  riskSummary: string[];
}

export class NftHealthScoreResponseDto {
  @ApiProperty({ description: 'Contract address' })
  contractAddress: string;

  @ApiProperty({ description: 'Chain' })
  chain: string;

  @ApiProperty({ description: 'Collection name' })
  collectionName: string;

  @ApiProperty({ description: 'Overall health score (0-100)' })
  healthScore: number;

  @ApiProperty({ description: 'Health grade (A/B/C/D/F)' })
  healthGrade: string;

  @ApiProperty({ description: 'Health level' })
  healthLevel: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';

  @ApiProperty({ description: 'Collection statistics' })
  collectionStats: NftCollectionStatsDto;

  @ApiProperty({ description: 'Holder distribution' })
  holderDistribution: HolderDistributionDto;

  @ApiProperty({ description: 'Trading metrics' })
  tradingMetrics: TradingMetricsDto;

  @ApiProperty({ description: 'Market metrics' })
  marketMetrics: MarketMetricsDto;

  @ApiProperty({ description: 'Risk factors' })
  riskFactors: RiskFactorsDto;

  @ApiProperty({ description: 'Recommendations' })
  recommendations: string[];

  @ApiProperty({ description: 'Timestamp' })
  timestamp: string;
}

export class NftHealthScoreSummaryDto {
  @ApiProperty({ description: 'Total collections analyzed' })
  totalAnalyzed: number;

  @ApiProperty({ description: 'Average health score' })
  averageHealthScore: number;

  @ApiProperty({ description: 'Collections by health level' })
  healthLevelDistribution: {
    excellent: number;
    good: number;
    fair: number;
    poor: number;
    critical: number;
  };

  @ApiProperty({ description: 'Results' })
  results: NftHealthScoreResponseDto[];
}
