import { IsString, IsOptional, IsNumber } from 'class-validator';

export class BlockDataDto {
  @IsString()
  chain: string;

  @IsOptional()
  @IsNumber()
  blockNumber?: number;
}
