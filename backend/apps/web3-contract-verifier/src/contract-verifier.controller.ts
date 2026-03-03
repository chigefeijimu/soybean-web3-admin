import { Controller, Post, Get, Body, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ContractVerifierService, VerificationRequest, ContractVerificationResult, ChainInfo } from './contract-verifier.service';

class VerifyContractDto {
  contractAddress: string;
  chainId: number;
  sourceCode: string;
  compilerVersion: string;
  contractName: string;
  optimization: boolean;
  runs: number;
  constructorArgs?: string;
  libraries?: Record<string, string>;
}

@Controller('web3/contract-verifier')
export class ContractVerifierController {
  constructor(private readonly verifierService: ContractVerifierService) {}

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  async verifyContract(@Body() dto: VerifyContractDto): Promise<ContractVerificationResult> {
    return this.verifierService.verifyContract(dto);
  }

  @Get('chains')
  async getSupportedChains(): Promise<ChainInfo[]> {
    return this.verifierService.getSupportedChains();
  }

  @Get('compiler-versions')
  async getCompilerVersions(): Promise<string[]> {
    return this.verifierService.getCompilerVersions();
  }

  @Get('status/:chainId/:address')
  async getVerificationStatus(
    @Param('chainId') chainId: number,
    @Param('address') address: string,
  ): Promise<{ verified: boolean; timestamp?: string }> {
    return this.verifierService.getVerificationStatus(chainId, address);
  }
}
