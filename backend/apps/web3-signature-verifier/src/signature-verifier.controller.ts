import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

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
  @ApiOperation({ summary: 'EIP-712类型化数据' })
  @IsString()
  domain: string;

  @ApiOperation({ summary: '类型化数据' })
  @IsString()
  types: string;

  @ApiOperation({ summary: '消息数据' })
  @IsString()
  value: string;

  @ApiOperation({ summary: '签名' })
  @IsString()
  signature: string;
}

interface SignatureResult {
  valid: boolean;
  signer: string | null;
  message: string;
  signature: string;
  algorithm: string;
  timestamp: string;
}

@Controller('web3-signature-verifier')
@ApiTags('Web3 Signature Verifier')
export class SignatureVerifierController {
  private readonly crypto = require('crypto');
  private readonly ethers = require('ethers');

  @Post('verify')
  @ApiOperation({ summary: '验证以太坊签名消息' })
  async verifySignature(@Body() dto: VerifySignatureDto): Promise<SignatureResult> {
    try {
      const { message, signature } = dto;
      
      // 尝试多种签名方式
      let signer: string | null = null;
      let valid = false;
      
      // 方法1: 直接验证 personalSign
      try {
        const recovered = this.ethers.verifyMessage(message, signature);
        if (recovered) {
          signer = recovered;
          valid = true;
        }
      } catch (e) {
        // 尝试其他方法
      }
      
      // 方法2: 尝试 EIP-191 (0x19...直接消息)
      if (!valid) {
        try {
          const msgHex = this.ethers.hexlify(this.ethers.toUtf8String(message));
          const msgHash = this.ethers.keccak256(msgHex);
          const prefixedMsg = this.ethers.concat([
            this.ethers.hexlify(0x19),
            this.ethers.hexlify(0x00), // Ethereum signed message
            msgHash
          ]);
          const hash = this.ethers.keccak256(prefixedMsg);
          
          const sigParams = this.ethers.Signature.from(signature);
          const recovered = this.ethers.recoverAddress(hash, sigParams);
          if (recovered) {
            signer = recovered;
            valid = true;
          }
        } catch (e) {
          // 继续尝试其他方法
        }
      }
      
      // 方法3: 尝试直接哈希签名恢复
      if (!valid) {
        try {
          const messageHash = this.ethers.id(message);
          const sigBuffer = Buffer.from(signature.slice(2), 'hex');
          
          if (sigBuffer.length === 65) {
            const v = sigBuffer[64];
            const r = '0x' + sigBuffer.slice(0, 32).toString('hex');
            const s = '0x' + sigBuffer.slice(32, 64).toString('hex');
            
            const recovered = this.ethers.recoverAddress(messageHash, { r, s, v });
            if (recovered) {
              signer = recovered;
              valid = true;
            }
          }
        } catch (e) {
          // 
        }
      }
      
      return {
        valid,
        signer,
        message,
        signature,
        algorithm: 'ECDSA',
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      return {
        valid: false,
        signer: null,
        message: dto.message,
        signature: dto.signature,
        algorithm: 'ECDSA',
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Post('sign')
  @ApiOperation({ summary: '生成签名消息（测试用）' })
  async signMessage(@Body() dto: SignMessageDto): Promise<any> {
    try {
      const { message, privateKey } = dto;
      
      let wallet;
      if (privateKey) {
        wallet = new this.ethers.Wallet(privateKey);
      } else {
        wallet = this.ethers.Wallet.createRandom();
      }
      
      const signature = await wallet.signMessage(message);
      
      return {
        message,
        signature,
        signer: wallet.address,
        privateKey: wallet.privateKey,
        algorithm: 'ECDSA',
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      return {
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Post('verify-typed-data')
  @ApiOperation({ summary: '验证EIP-712类型化数据签名' })
  async verifyTypedData(@Body() dto: VerifyTypedDataDto): Promise<any> {
    try {
      const { domain, types, value, signature } = dto;
      
      const domainData = JSON.parse(domain);
      const typesData = JSON.parse(types);
      const valueData = JSON.parse(value);
      
      // 简化验证 - 实际需要完整的 EIP-712 解析
      const domainHash = this.ethers.id(JSON.stringify(domainData));
      const structHash = this.ethers.id(JSON.stringify(valueData));
      const hash = this.ethers.keccak256(
        this.ethers.concat([this.ethers.hexlify(0x19), this.ethers.hexlify(0x01), domainHash, structHash])
      );
      
      let signer: string | null = null;
      let valid = false;
      
      try {
        const sigParams = this.ethers.Signature.from(signature);
        signer = this.ethers.recoverAddress(hash, sigParams);
        valid = !!signer;
      } catch (e) {
        // 
      }
      
      return {
        valid,
        signer,
        domain: domainData,
        value: valueData,
        signature,
        algorithm: 'EIP-712',
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      return {
        valid: false,
        signer: null,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Get('test-signatures')
  @ApiOperation({ summary: '获取测试签名示例' })
  async getTestSignatures(): Promise<any> {
    // 生成测试用的签名示例
    const wallet = this.ethers.Wallet.createRandom();
    const testMessage = 'Hello, Web3!';
    const signature = await wallet.signMessage(testMessage);
    
    return {
      examples: [
        {
          message: testMessage,
          signature,
          signer: wallet.address,
          privateKey: wallet.privateKey,
          description: 'Personal Sign 示例',
        },
      ],
      chains: [
        { name: 'Ethereum', chainId: 1 },
        { name: 'Polygon', chainId: 137 },
        { name: 'Arbitrum', chainId: 42161 },
        { name: 'Optimism', chainId: 10 },
        { name: 'BSC', chainId: 56 },
      ],
      timestamp: new Date().toISOString(),
    };
  }
}
