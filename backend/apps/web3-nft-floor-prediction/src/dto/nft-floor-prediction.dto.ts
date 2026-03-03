import { IsString, IsOptional, IsNumber, Min, Max, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum Chain {
  ETHEREUM = 'ethereum',
  POLYGON = 'polygon',
  ARBITRUM = 'arbitrum',
  OPTIMISM = 'optimism',
  BASE = 'base',
  SOLANA = 'solana',
}

export enum SignalType {
  STRONG_BUY = 'strong_buy',
  BUY = 'buy',
  HOLD = 'hold',
  SELL = 'sell',
  STRONG_SELL = 'strong_sell',
}

export enum TimeFrame {
  HOUR_1 = '1h',
  HOUR_4 = '4h',
  HOUR_24 = '24h',
  DAY_7 = '7d',
}

export class PredictFloorPriceDto {
  @ApiProperty({ description: 'NFT collection contract address' })
  @IsString()
  address: string;

  @ApiProperty({ enum: Chain, description: 'Blockchain chain' })
  @IsEnum(Chain)
  chain: Chain;

  @ApiPropertyOptional({ description: 'Time frame for prediction' })
  @IsOptional()
  @IsEnum(TimeFrame)
  timeFrame?: TimeFrame = TimeFrame.DAY_7;
}

export class GetCollectionPredictionsDto {
  @ApiProperty({ description: 'NFT collection contract address' })
  @IsString()
  address: string;

  @ApiPropertyOptional({ enum: Chain })
  @IsOptional()
  @IsEnum(Chain)
  chain?: Chain;
}

export class GetPredictionHistoryDto {
  @ApiProperty({ description: 'NFT collection contract address' })
  @IsString()
  address: string;

  @ApiProperty({ enum: Chain })
  @IsEnum(Chain)
  chain: Chain;

  @ApiPropertyOptional({ description: 'Days to look back' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(90)
  days?: number = 30;
}

export class AddToWatchlistDto {
  @ApiProperty({ description: 'User ID' })
  @IsString()
  userId: string;

  @ApiProperty({ description: 'NFT collection contract address' })
  @IsString()
  address: string;

  @ApiProperty({ enum: Chain })
  @IsEnum(Chain)
  chain: Chain;

  @ApiPropertyOptional({ description: 'Custom name for the collection' })
  @IsOptional()
  @IsString()
  name?: string;
}

export class GetTrendingCollectionsDto {
  @ApiProperty({ enum: Chain })
  @IsEnum(Chain)
  chain: Chain;

  @ApiPropertyOptional({ description: 'Limit number of results' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  limit?: number = 10;
}
