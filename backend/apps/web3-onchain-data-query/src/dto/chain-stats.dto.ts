import { IsString, IsOptional } from 'class-validator';

export class ChainStatsDto {
  @IsString()
  chain: string;
}

export class BlockDataDto {
  @IsString()
  chain: string;

  @IsOptional()
  blockNumber?: number;
}

export class TransactionListDto {
  @IsString()
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
