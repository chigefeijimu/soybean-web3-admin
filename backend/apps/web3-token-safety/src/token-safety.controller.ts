import { Controller, Get, Post, Body, Param, Query, ValidationPipe } from '@nestjs/common';
import { TokenSafetyService, TokenSafetyResult } from './token-safety.service';
import { IsString, IsNumber, IsArray, Min, Max } from 'class-validator';

class CheckTokenDto {
  @IsString()
  address: string;

  @IsNumber()
  @Min(1)
  @Max(10000)
  chainId: number;
}

class CheckMultipleTokensDto {
  @IsArray()
  @IsString({ each: true })
  addresses: string[];

  @IsNumber()
  @Min(1)
  @Max(10000)
  chainId: number;
}

@Controller('web3/token-safety')
export class TokenSafetyController {
  constructor(private readonly tokenSafetyService: TokenSafetyService) {}

  @Get('check/:chainId/:address')
  async checkToken(
    @Param('chainId') chainId: number,
    @Param('address') address: string,
  ): Promise<TokenSafetyResult> {
    return this.tokenSafetyService.checkTokenSafety(chainId, address);
  }

  @Post('check')
  async checkTokenPost(@Body(new ValidationPipe({ transform: true })) dto: CheckTokenDto): Promise<TokenSafetyResult> {
    return this.tokenSafetyService.checkTokenSafety(dto.chainId, dto.address);
  }

  @Post('batch')
  async checkMultipleTokens(
    @Body(new ValidationPipe({ transform: true })) dto: CheckMultipleTokensDto,
  ): Promise<TokenSafetyResult[]> {
    return this.tokenSafetyService.getMultipleTokensSafety(dto.chainId, dto.addresses);
  }

  @Get('health')
  async health(): Promise<{ status: string; timestamp: string }> {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
