import { Controller, Post, Body, Get, Query, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TokenFactoryService } from './token-factory.service';

class CreateTokenDto {
  tokenType: 'ERC20' | 'ERC721' | 'ERC1155';
  name: string;
  symbol: string;
  decimals?: number;
  initialSupply?: string;
  maxSupply?: string;
  chainId: number;
  owner?: string;
}

class DeployTokenDto {
  bytecode: string;
  abi: string;
  constructorArgs: any[];
  chainId: number;
  privateKey: string;
  gasLimit?: number;
}

class VerifyTokenDto {
  address: string;
  chainId: number;
  sourceCode?: string;
}

@ApiTags('Token Factory')
@Controller('web3/token-factory')
export class TokenFactoryController {
  constructor(private readonly tokenFactoryService: TokenFactoryService) {}

  @Post('create-bytecode')
  @ApiOperation({ summary: 'Generate token bytecode and ABI' })
  @ApiResponse({ status: 200, description: 'Bytecode and ABI generated' })
  async createBytecode(@Body() dto: CreateTokenDto) {
    return this.tokenFactoryService.generateTokenBytecode(dto);
  }

  @Post('deploy')
  @ApiOperation({ summary: 'Deploy token to blockchain' })
  @ApiResponse({ status: 200, description: 'Token deployed successfully' })
  async deployToken(@Body() dto: DeployTokenDto) {
    return this.tokenFactoryService.deployToken(dto);
  }

  @Get('estimate-gas')
  @ApiOperation({ summary: 'Estimate deployment gas cost' })
  @ApiResponse({ status: 200, description: 'Gas estimate returned' })
  async estimateGas(
    @Query('tokenType') tokenType: string,
    @Query('chainId') chainId: number,
  ) {
    return this.tokenFactoryService.estimateDeploymentGas(tokenType, chainId);
  }

  @Get('standard/:type')
  @ApiOperation({ summary: 'Get token standard templates' })
  @ApiResponse({ status: 200, description: 'Token templates returned' })
  async getTokenStandard(@Param('type') type: string) {
    return this.tokenFactoryService.getTokenStandard(type);
  }

  @Post('verify')
  @ApiOperation({ summary: 'Verify token contract on explorer' })
  @ApiResponse({ status: 200, description: 'Verification result' })
  async verifyToken(@Body() dto: VerifyTokenDto) {
    return this.tokenFactoryService.verifyTokenContract(dto);
  }

  @Get('chains')
  @ApiOperation({ summary: 'Get supported chains for deployment' })
  @ApiResponse({ status: 200, description: 'Supported chains returned' })
  async getSupportedChains() {
    return this.tokenFactoryService.getSupportedChains();
  }
}
