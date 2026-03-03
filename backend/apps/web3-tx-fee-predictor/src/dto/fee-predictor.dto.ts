import { IsString, IsOptional, IsEnum, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ChainEnum {
  ethereum = 'ethereum',
  polygon = 'polygon',
  arbitrum = 'arbitrum',
  optimism = 'optimism',
  bsc = 'bsc',
  base = 'base',
  avalanche = 'avalanche',
  zksync = 'zksync',
  starknet = 'starknet',
  linea = 'linea',
}

export enum TimeRangeEnum {
  '1h' = '1h',
  '4h' = '4h',
  '12h' = '12h',
  '24h' = '24h',
  '7d' = '7d',
}

export enum TransactionTypeEnum {
  'eth_transfer' = 'eth_transfer',
  'erc20_transfer' = 'erc20_transfer',
  'swap' = 'swap',
  'nft_transfer' = 'nft_transfer',
  'contract_deploy' = 'contract_deploy',
  'staking' = 'staking',
  'bridge' = 'bridge',
}

export class PredictFeeDto {
  @ApiProperty({ enum: ChainEnum, example: 'ethereum' })
  @IsEnum(ChainEnum)
  chain: string;

  @ApiProperty({ enum: TransactionTypeEnum, example: 'swap' })
  @IsEnum(TransactionTypeEnum)
  transactionType: string;

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @IsNumber()
  gasLimit?: number;

  @ApiPropertyOptional({ example: '7d' })
  @IsOptional()
  @IsEnum(TimeRangeEnum)
  predictionWindow?: string;
}

export class GetHistoricalFeesDto {
  @ApiProperty({ enum: ChainEnum, example: 'ethereum' })
  @IsEnum(ChainEnum)
  chain: string;

  @ApiPropertyOptional({ example: '7d' })
  @IsOptional()
  @IsEnum(TimeRangeEnum)
  timeRange?: string;
}

export class GetFeeComparisonDto {
  @ApiProperty({ example: ['ethereum', 'polygon', 'arbitrum'] })
  @IsString({ each: true })
  chains: string[];

  @ApiPropertyOptional({ enum: TransactionTypeEnum, example: 'swap' })
  @IsOptional()
  @IsEnum(TransactionTypeEnum)
  transactionType?: string;

  @ApiPropertyOptional({ example: 200000 })
  @IsOptional()
  @IsNumber()
  gasLimit?: number;
}

export class GetOptimalTimeDto {
  @ApiProperty({ enum: ChainEnum, example: 'ethereum' })
  @IsEnum(ChainEnum)
  chain: string;

  @ApiProperty({ enum: TransactionTypeEnum, example: 'swap' })
  @IsEnum(TransactionTypeEnum)
  transactionType: string;

  @ApiPropertyOptional({ example: 3 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(30)
  days?: number;
}

export class GetFeeAlertDto {
  @ApiProperty({ enum: ChainEnum, example: 'ethereum' })
  @IsEnum(ChainEnum)
  chain: string;

  @ApiProperty({ example: 50 })
  @IsNumber()
  thresholdGwei: number;

  @ApiPropertyOptional()
  @IsOptional()
  webhookUrl?: string;
}
