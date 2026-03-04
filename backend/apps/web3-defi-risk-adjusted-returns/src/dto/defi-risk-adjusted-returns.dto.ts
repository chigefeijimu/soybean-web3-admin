import { IsString, IsNumber, IsOptional, IsEnum, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CalculateRiskAdjustedReturnsDto {
  @ApiProperty({ description: 'DeFi protocol name', example: 'uniswap_v3' })
  @IsString()
  protocol: string;

  @ApiProperty({ description: 'Blockchain chain', example: 'ethereum' })
  @IsString()
  chain: string;

  @ApiProperty({ description: 'First token symbol', example: 'ETH' })
  @IsString()
  token0: string;

  @ApiProperty({ description: 'Second token symbol', example: 'USDC' })
  @IsString()
  token1: string;

  @ApiProperty({ description: 'Investment amount in USD', example: 10000 })
  @IsNumber()
  @Min(100)
  amount: number;

  @ApiPropertyOptional({ description: 'Investment duration in days', example: 30 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(365)
  duration?: number;
}

export class PoolDataDto {
  @ApiProperty()
  tvl: number;

  @ApiProperty()
  apy: number;

  @ApiProperty()
  volume24h: number;

  @ApiProperty()
  fees24h: number;
}

export class ImpermanentLossDto {
  @ApiProperty()
  value: number;

  @ApiProperty()
  percentage: number;

  @ApiProperty({ enum: ['MINIMAL', 'LOW', 'MEDIUM', 'HIGH'] })
  severity: string;
}

export class GasCostDto {
  @ApiProperty()
  value: number;

  @ApiProperty()
  currency: string;
}

export class ReturnsDto {
  @ApiProperty()
  gross: number;

  @ApiProperty()
  net: number;

  @ApiProperty()
  netApy: number;
}

export class RiskMetricsDto {
  @ApiProperty()
  volatility: number;

  @ApiProperty()
  sharpeRatio: number;

  @ApiProperty()
  sortinoRatio: number;

  @ApiProperty()
  maxDrawdown: number;

  @ApiProperty({ enum: ['VERY_LOW', 'LOW', 'MEDIUM', 'HIGH'] })
  riskLevel: string;
}

export class RiskAdjustedReturnsResponseDto {
  @ApiProperty()
  protocol: string;

  @ApiProperty()
  chain: string;

  @ApiProperty()
  token0: string;

  @ApiProperty()
  token1: string;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  duration: number;

  @ApiProperty({ type: PoolDataDto })
  poolData: PoolDataDto;

  @ApiProperty({ type: ImpermanentLossDto })
  impermanentLoss: ImpermanentLossDto;

  @ApiProperty({ type: GasCostDto })
  gasCost: GasCostDto;

  @ApiProperty({ type: ReturnsDto })
  returns: ReturnsDto;

  @ApiProperty({ type: RiskMetricsDto })
  riskMetrics: RiskMetricsDto;

  @ApiProperty()
  riskAdjustedScore: number;

  @ApiProperty({ enum: ['S', 'A+', 'A', 'B+', 'B', 'C', 'D'] })
  rank: string;

  @ApiProperty()
  recommendation: string;

  @ApiProperty()
  confidence: number;
}

export class ProtocolDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ type: [String] })
  chains: string[];
}

export class ChainDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  icon: string;
}
