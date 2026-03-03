import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsArray, IsOptional, IsNumber, IsEnum, Min, Max } from 'class-validator';

export class StressTestRequestDto {
  @ApiProperty({ description: 'Wallet address to stress test' })
  @IsString()
  address: string;

  @ApiPropertyOptional({ description: 'Chains to include in analysis', type: [String] })
  @IsArray()
  @IsOptional()
  chains?: string[];

  @ApiPropertyOptional({ description: 'Specific scenarios to test', type: [String] })
  @IsArray()
  @IsOptional()
  scenarios?: string[];
}

export class ScenarioConfigDto {
  @ApiProperty({ description: 'Wallet address' })
  @IsString()
  address: string;

  @ApiProperty({ description: 'Custom scenario name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Scenario type' })
  @IsEnum(['market_crash', 'stablecoin_depeg', 'single_asset_crash', 'defi_collapse', 'liquidity_crisis', 'correlation_breakdown', 'regulatory', 'custom'])
  type: string;

  @ApiProperty({ description: 'Severity percentage (0-100)', minimum: 0, maximum: 100 })
  @IsNumber()
  @Min(0)
  @Max(100)
  severity: number;

  @ApiPropertyOptional({ description: 'Probability of scenario (0-1)' })
  @IsOptional()
  @IsNumber()
  probability?: number;

  @ApiPropertyOptional({ description: 'Chains to include' })
  @IsOptional()
  chains?: string[];

  @ApiPropertyOptional({ description: 'Additional parameters' })
  @IsOptional()
  parameters?: Record<string, any>;
}

export class StressScenarioDto {
  @ApiProperty({ description: 'Scenario ID' })
  id: string;

  @ApiProperty({ description: 'Scenario name' })
  name: string;

  @ApiProperty({ description: 'Scenario type' })
  type: string;

  @ApiProperty({ description: 'Severity percentage' })
  severity: number;

  @ApiProperty({ description: 'Probability of occurrence' })
  probability: number;

  @ApiPropertyOptional({ description: 'Affected asset for single_asset_crash type' })
  affectedAsset?: string;

  @ApiPropertyOptional({ description: 'Additional parameters' })
  parameters?: Record<string, any>;
}

export class AssetAllocationDto {
  @ApiProperty({ description: 'Token symbol' })
  symbol: string;

  @ApiProperty({ description: 'Token name' })
  name: string;

  @ApiProperty({ description: 'Token amount' })
  amount: number;

  @ApiProperty({ description: 'Value in USD' })
  value: number;

  @ApiProperty({ description: 'Chain name' })
  chain: string;

  @ApiProperty({ description: 'Asset category' })
  category: string;

  @ApiProperty({ description: 'Portfolio allocation percentage' })
  allocation: number;

  @ApiProperty({ description: 'Asset volatility (0-1)' })
  volatility: number;
}

export class PortfolioSnapshotDto {
  @ApiProperty({ description: 'Wallet address' })
  address: string;

  @ApiProperty({ description: 'Total portfolio value in USD' })
  totalValue: number;

  @ApiProperty({ description: 'Asset allocations', type: [AssetAllocationDto] })
  assets: AssetAllocationDto[];

  @ApiProperty({ description: 'Chains included' })
  chains: string[];

  @ApiProperty({ description: 'Category breakdown' })
  categories: {
    stablecoin: { value: number; percentage: number };
    defi: { value: number; percentage: number };
    layer1: { value: number; percentage: number };
    nft: { value: number; percentage: number };
  };

  @ApiProperty({ description: 'Timestamp' })
  timestamp: string;
}

export class RiskMetricsDto {
  @ApiProperty({ description: 'Diversification score (0-100)' })
  diversificationScore: number;

  @ApiProperty({ description: 'Stability score (0-100)' })
  stabilityScore: number;

  @ApiProperty({ description: 'Concentration score (0-100)' })
  concentrationScore: number;

  @ApiProperty({ description: 'Volatility score (0-100)' })
  volatilityScore: number;

  @ApiProperty({ description: 'DeFi risk score (0-100)' })
  defiRiskScore: number;

  @ApiProperty({ description: 'Composite risk score (0-100)' })
  compositeScore: number;

  @ApiProperty({ description: 'Average impact across scenarios' })
  avgImpact: number;

  @ApiProperty({ description: 'Worst case impact' })
  worstCase: number;

  @ApiProperty({ description: 'Best case impact' })
  bestCase: number;

  @ApiProperty({ description: 'Stablecoin ratio' })
  stablecoinRatio: number;

  @ApiProperty({ description: 'Maximum single asset allocation' })
  maxAllocation: number;

  @ApiProperty({ description: 'Average portfolio volatility' })
  avgVolatility: number;

  @ApiProperty({ description: 'DeFi exposure ratio' })
  defiExposure: number;

  @ApiProperty({ description: 'Concentration risk level' })
  concentrationRisk: string;
}

export class StressTestResultDto {
  @ApiProperty({ description: 'Wallet address' })
  address: string;

  @ApiProperty({ description: 'Portfolio snapshot' })
  portfolioSnapshot: PortfolioSnapshotDto;

  @ApiProperty({ description: 'Scenario results', type: [Object] })
  scenarios: any[];

  @ApiProperty({ description: 'Risk metrics' })
  riskMetrics: RiskMetricsDto;

  @ApiProperty({ description: 'Overall stress resistance score (0-100)' })
  overallScore: number;

  @ApiProperty({ description: 'Timestamp' })
  timestamp: string;
}

export class StressTestSummaryDto {
  @ApiProperty({ description: 'Wallet address' })
  address: string;

  @ApiProperty({ description: 'Total portfolio value' })
  portfolioValue: number;

  @ApiProperty({ description: 'Overall stress resistance score' })
  overallScore: number;

  @ApiProperty({ description: 'Risk level' })
  riskLevel: string;

  @ApiProperty({ description: 'Top identified risks', type: [String] })
  topRisks: string[];

  @ApiProperty({ description: 'Quick scenario results', type: [Object] })
  quickResults: any[];

  @ApiProperty({ description: 'Timestamp' })
  timestamp: string;
}

export class HistoricalCrashDto {
  @ApiProperty({ description: 'Crash ID' })
  id: string;

  @ApiProperty({ description: 'Crash name' })
  name: string;

  @ApiProperty({ description: 'Crash date' })
  date: string;

  @ApiProperty({ description: 'Description' })
  description: string;

  @ApiProperty({ description: 'Severity level' })
  severity: string;

  @ApiProperty({ description: 'Bitcoin drop percentage' })
  btcDrop: number;

  @ApiProperty({ description: 'Ethereum drop percentage' })
  ethDrop: number;

  @ApiProperty({ description: 'Total market cap loss in USD' })
  marketCapLoss: number;

  @ApiProperty({ description: 'Crash duration' })
  duration: string;

  @ApiProperty({ description: 'Time to recovery' })
  recoveryTime: string;
}
