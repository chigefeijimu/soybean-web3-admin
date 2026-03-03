import { IsString, IsOptional, IsEnum, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GetOrderbookDto {
  @ApiProperty({ example: 'ETH', description: 'Token symbol (e.g., ETH, WBTC)' })
  @IsString()
  token: string;

  @ApiProperty({ example: 'USDC', description: 'Quote token symbol' })
  @IsString()
  quote: string;

  @ApiProperty({ example: 'ethereum', description: 'Blockchain network', enum: ['ethereum', 'arbitrum', 'optimism', 'polygon', 'bsc', 'base', 'avalanche'] })
  @IsEnum(['ethereum', 'arbitrum', 'optimism', 'polygon', 'bsc', 'base', 'avalanche'])
  @IsOptional()
  chain?: string;

  @ApiPropertyOptional({ example: 20, description: 'Number of price levels to return', minimum: 5, maximum: 100 })
  @IsOptional()
  @IsNumber()
  @Min(5)
  @Max(100)
  limit?: number;
}

export class GetMarketDepthDto {
  @ApiProperty({ example: 'ETH', description: 'Token symbol' })
  @IsString()
  token: string;

  @ApiProperty({ example: 'USDC', description: 'Quote token symbol' })
  @IsString()
  quote: string;

  @ApiProperty({ example: 'ethereum', description: 'Blockchain network', enum: ['ethereum', 'arbitrum', 'optimism', 'polygon', 'bsc', 'base', 'avalanche'] })
  @IsEnum(['ethereum', 'arbitrum', 'optimism', 'polygon', 'bsc', 'base', 'avalanche'])
  @IsOptional()
  chain?: string;

  @ApiPropertyOptional({ example: 5, description: 'Depth percentage from mid price', minimum: 1, maximum: 20 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(20)
  depthPercent?: number;
}

export class GetOrderbookHistoryDto {
  @ApiProperty({ example: 'ETH', description: 'Token symbol' })
  @IsString()
  token: string;

  @ApiProperty({ example: 'USDC', description: 'Quote token symbol' })
  @IsString()
  quote: string;

  @ApiProperty({ example: 'ethereum', description: 'Blockchain network' })
  @IsEnum(['ethereum', 'arbitrum', 'optimism', 'polygon', 'bsc', 'base', 'avalanche'])
  @IsOptional()
  chain?: string;

  @ApiPropertyOptional({ example: '1h', description: 'Time range', enum: ['15m', '1h', '4h', '24h'] })
  @IsOptional()
  @IsEnum(['15m', '1h', '4h', '24h'])
  timeframe?: string;
}
