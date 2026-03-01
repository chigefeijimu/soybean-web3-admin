import { ApiProperty } from '@nestjs/common';
import { IsString, IsOptional, IsNumber, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class DefiPositionDto {
  @ApiProperty({ description: 'Protocol name' })
  @IsString()
  protocol: string;

  @ApiProperty({ description: 'Token symbol' })
  @IsString()
  symbol: string;

  @ApiProperty({ description: 'Token address' })
  @IsString()
  tokenAddress: string;

  @ApiProperty({ description: 'Token balance' })
  @IsNumber()
  balance: number;

  @ApiProperty({ description: 'Token value in USD' })
  @IsNumber()
  valueUsd: number;

  @ApiProperty({ description: 'APY or APR percentage' })
  @IsNumber()
  apy: number;

  @ApiProperty({ description: 'Pool address if liquidity position' })
  @IsOptional()
  @IsString()
  poolAddress?: string;

  @ApiProperty({ description: 'Chain ID' })
  @IsNumber()
  chainId: number;
}

export class DefiPortfolioDto {
  @ApiProperty({ description: 'Wallet address' })
  @IsString()
  walletAddress: string;

  @ApiProperty({ description: 'Total portfolio value in USD' })
  @IsNumber()
  totalValueUsd: number;

  @ApiProperty({ description: 'Total APY weighted' })
  @IsNumber()
  totalApy: number;

  @ApiProperty({ description: '24h change percentage' })
  @IsNumber()
  change24h: number;

  @ApiProperty({ description: 'List of positions' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DefiPositionDto)
  positions: DefiPositionDto[];

  @ApiProperty({ description: 'Breakdown by protocol' })
  @IsOptional()
  protocolBreakdown?: Record<string, number>;
}

export class QueryPortfolioDto {
  @ApiProperty({ description: 'Wallet address to query' })
  @IsString()
  walletAddress: string;

  @ApiProperty({ description: 'Chain ID', required: false })
  @IsOptional()
  @IsNumber()
  chainId?: number;

  @ApiProperty({ description: 'Include protocols (comma separated)', required: false })
  @IsOptional()
  @IsString()
  protocols?: string;
}
