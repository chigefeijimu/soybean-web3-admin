import { IsString, IsNumber, IsOptional, IsArray, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateMultisigWalletDto {
  @IsString()
  name: string;

  @IsNumber()
  @Min(1)
  @Max(10)
  @Type(() => Number)
  threshold: number;

  @IsArray()
  @IsString({ each: true })
  owners: string[];
}

export class CreateTransactionDto {
  @IsString()
  walletAddress: string;

  @IsString()
  to: string;

  @IsString()
  @IsOptional()
  value?: string;

  @IsString()
  @IsOptional()
  data?: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  nonce?: number;
}

export class SignTransactionDto {
  @IsString()
  txHash: string;

  @IsString()
  signerAddress: string;

  @IsString()
  signature: string;
}

export class ExecuteTransactionDto {
  @IsString()
  txHash: string;

  @IsString()
  executorAddress: string;
}

export class GetTransactionsDto {
  @IsString()
  walletAddress: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  limit?: number;
}
