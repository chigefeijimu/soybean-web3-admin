import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';
import { SignatureVerifierService } from './signature-verifier.service';

class VerifySignatureDto {
  @ApiOperation({ summary: '签名消息' })
  @IsString()
  message: string;

  @ApiOperation({ summary: '签名' })
  @IsString()
  signature: string;
}

class SignMessageDto {
  @ApiOperation({ summary: '要签名的消息' })
  @IsString()
  message: string;

  @ApiOperation({ summary: '私钥（可选，不提供则生成随机签名）' })
  @IsOptional()
  @IsString()
  privateKey?: string;
}

class VerifyTypedDataDto {
  @ApiOperation({ summary: 'EIP-712类型化数据域' })
  @IsString()
  domain: string;

  @ApiOperation({ summary: '类型定义' })
  @IsString()
  types: string;

  @ApiOperation({ summary: '消息数据' })
  @IsString()
  value: string;

  @ApiOperation({ summary: '签名' })
  @IsString()
  signature: string;
}

@Controller('web3-signature-verifier')
@ApiTags('Web3 Signature Verifier')
export class SignatureVerifierController {
  constructor(private readonly service: SignatureVerifierService) {}

  @Post('verify')
  @ApiOperation({ summary: '验证以太坊签名消息' })
  async verifySignature(@Body() dto: VerifySignatureDto) {
    return this.service.verifySignature(dto.message, dto.signature);
  }

  @Post('sign')
  @ApiOperation({ summary: '生成签名消息（测试用）' })
  async signMessage(@Body() dto: SignMessageDto) {
    return this.service.signMessage(dto.message, dto.privateKey);
  }

  @Post('verify-typed-data')
  @ApiOperation({ summary: '验证EIP-712类型化数据签名' })
  async verifyTypedData(@Body() dto: VerifyTypedDataDto) {
    return this.service.verifyTypedData(dto.domain, dto.types, dto.value, dto.signature);
  }

  @Get('test-signatures')
  @ApiOperation({ summary: '获取测试签名示例' })
  async getTestSignatures() {
    return this.service.getTestSignatures();
  }

  @Get('supported-chains')
  @ApiOperation({ summary: '获取支持的链列表' })
  async getSupportedChains() {
    return this.service.getSupportedChains();
  }
}
