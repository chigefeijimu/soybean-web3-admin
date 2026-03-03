import { IsOptional, IsString, IsEnum } from 'class-validator';

export enum Timeframe {
  SEVEN_DAYS = '7d',
  THIRTY_DAYS = '30d',
  NINETY_DAYS = '90d',
  SIX_MONTHS = '180d',
  ONE_YEAR = '1y',
}

export class DefiTvlHistoryQueryDto {
  @IsString()
  protocol: string;

  @IsOptional()
  @IsString()
  chain?: string;

  @IsOptional()
  @IsEnum(Timeframe)
  timeframe?: Timeframe = Timeframe.THIRTY_DAYS;
}

export class TvlPoint {
  date: string;
  tvl: number;
}

export class TvlStatistics {
  average: number;
  min: number;
  max: number;
  change24h: number;
  volatility: number;
}

export class ProtocolTvlHistoryDto {
  protocol: string;
  chain: string;
  currentTvl: number;
  history: TvlPoint[];
  statistics: TvlStatistics;
}

export class TvlTrendDto {
  protocol: string;
  chain: string;
  currentTvl: number;
  trend7d: number;
  trendDirection: 'up' | 'down' | 'stable';
}

export class ChainDistribution {
  chain: string;
  tvl: number;
  share: number;
}

export class TopProtocol {
  name: string;
  tvl: number;
  share: number;
}

export class TvlStatisticsDto {
  totalTvl: number;
  protocolCount: number;
  chainDistribution: ChainDistribution[];
  topProtocols: TopProtocol[];
  lastUpdated: string;
}
