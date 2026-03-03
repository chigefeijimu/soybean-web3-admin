import { IsString, IsOptional, IsNumber, IsEnum, IsArray, IsBoolean } from 'class-validator';

export class CreateDelegationDto {
  @IsString()
  walletAddress: string;

  @IsString()
  daoName: string;

  @IsString()
  tokenSymbol: string;

  @IsString()
  @IsOptional()
  delegateAddress?: string;

  @IsString()
  @IsOptional()
  chain?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateDelegationDto {
  @IsNumber()
  id: number;

  @IsString()
  @IsOptional()
  delegateAddress?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class QueryDelegationDto {
  @IsString()
  @IsOptional()
  walletAddress?: string;

  @IsString()
  @IsOptional()
  daoName?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  chain?: string;

  @IsNumber()
  @IsOptional()
  page?: number;

  @IsNumber()
  @IsOptional()
  pageSize?: number;
}

export class CreateAlertDto {
  @IsString()
  walletAddress: string;

  @IsString()
  daoName: string;

  @IsString()
  alertType: string;

  @IsString()
  condition: string;

  @IsNumber()
  @IsOptional()
  threshold?: number;

  @IsString()
  @IsOptional()
  webhookUrl?: string;

  @IsString()
  @IsOptional()
  email?: string;
}

export class DelegationStatsDto {
  @IsString()
  daoName: string;

  @IsString()
  chain: string;

  @IsNumber()
  totalDelegators: number;

  @IsNumber()
  totalDelegatedPower: number;

  @IsNumber()
  activeDelegations: number;

  @IsNumber()
  revokedDelegations: number;
}
