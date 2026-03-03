import { IsString, IsOptional, IsEnum } from 'class-validator';

export class QueryDto {
  @IsString()
  query: string;

  @IsOptional()
  @IsString()
  chain?: string;
}

export class ChainStatsDto {
  @IsEnum(['ethereum', 'polygon', 'arbitrum', 'optimism', 'bsc', 'base', 'avalanche'])
  chain: string;
}

export class BlockDataDto {
  @IsEnum(['ethereum', 'polygon', 'arbitrum', 'optimism', 'bsc', 'base', 'avalanche'])
  chain: string;

  @IsOptional()
  blockNumber?: number;
}

export class TransactionListDto {
  @IsEnum(['ethereum', 'polygon', 'arbitrum', 'optimism', 'bsc', 'base', 'avalanche'])
  chain: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  fromBlock?: number;

  @IsOptional()
  toBlock?: number;

  @IsOptional()
  limit?: number;
}
