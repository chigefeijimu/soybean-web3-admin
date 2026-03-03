import { IsString, IsOptional, IsNumber } from 'class-validator';

export class TransactionListDto {
  @IsString()
  chain: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsNumber()
  fromBlock?: number;

  @IsOptional()
  @IsNumber()
  toBlock?: number;

  @IsOptional()
  @IsNumber()
  limit?: number;
}
