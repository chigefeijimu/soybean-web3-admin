import { IsString, IsOptional, IsEnum, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ChainId {
  ETHEREUM = '1',
  POLYGON = '137',
  ARBITRUM = '42161',
  OPTIMISM = '10',
  BSC = '56',
  BASE = '8453',
  AVALANCHE = '43114',
}

export enum DefiActionType {
  SWAP = 'swap',
  ADD_LIQUIDITY = 'add_liquidity',
  REMOVE_LIQUIDITY = 'remove_liquidity',
  SUPPLY = 'supply',
  BORROW = 'borrow',
  STAKE = 'stake',
  UNSTAKE = 'unstake',
  CLAIM = 'claim',
  TRANSFER = 'transfer',
  APPROVE = 'approve',
  NFT_TRANSFER = 'nft_transfer',
  CONTRACT_DEPLOY = 'contract_deploy',
}

export enum StrategyType {
  CONSERVATIVE = 'conservative',
  BALANCED = 'balanced',
  AGGRESSIVE = 'aggressive',
}

export enum TimePreference {
  URGENT = 'urgent',
  NORMAL = 'normal',
  FLEXIBLE = 'flexible',
}

export class OptimizeGasDto {
  @ApiProperty({ enum: ChainId, description: 'Chain ID' })
  @IsEnum(ChainId)
  chainId: ChainId;

  @ApiProperty({ enum: DefiActionType, description: 'DeFi action type' })
  @IsEnum(DefiActionType)
  actionType: DefiActionType;

  @ApiPropertyOptional({ enum: StrategyType })
  @IsOptional()
  @IsEnum(StrategyType)
  strategyType?: StrategyType = StrategyType.BALANCED;

  @ApiPropertyOptional({ enum: TimePreference })
  @IsOptional()
  @IsEnum(TimePreference)
  timePreference?: TimePreference = TimePreference.NORMAL;

  @ApiPropertyOptional({ description: 'Estimated transaction value in USD' })
  @IsOptional()
  @IsNumber()
  estimatedValue?: number;

  @ApiPropertyOptional({ description: 'User wallet address' })
  @IsOptional()
  @IsString()
  walletAddress?: string;
}

export class GetGasHistoryDto {
  @ApiProperty({ enum: ChainId })
  @IsEnum(ChainId)
  chainId: ChainId;

  @ApiPropertyOptional({ description: 'Number of days to look back' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(90)
  days?: number = 7;

  @ApiPropertyOptional({ description: 'Action type filter' })
  @IsOptional()
  @IsEnum(DefiActionType)
  actionType?: DefiActionType;
}

export class GetOptimalTimeDto {
  @ApiProperty({ enum: ChainId })
  @IsEnum(ChainId)

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  hoursAhead?: number = 24;
}

export class GasStrategyDto {
  @ApiProperty()
  @IsString()
  walletAddress: string;

  @ApiProperty({ enum: ChainId })
  @IsEnum(ChainId)
  chainId: ChainId;
}
