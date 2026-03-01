import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Web3ContractService } from './web3-contract.service';

class DeployContractDto {
  chainId: number;
  contractType: 'ERC20' | 'ERC721' | 'ERC1155' | 'Multisig';
  name: string;
  symbol?: string;
  initialSupply?: string;
  owners?: string[];
  threshold?: number;
  uri?: string;
}

class VerifyContractDto {
  chainId: number;
  contractAddress: string;
  abi?: string;
}

@ApiTags('Web3 - Contract Deployment')
@Controller('web3/contract')
export class Web3ContractController {
  constructor(private readonly web3ContractService: Web3ContractService) {}

  @Post('deploy')
  @ApiOperation({ summary: 'Deploy a smart contract' })
  async deployContract(@Body() dto: DeployContractDto) {
    return this.web3ContractService.deployContract(dto);
  }

  @Post('verify')
  @ApiOperation({ summary: 'Verify a smart contract' })
  async verifyContract(@Body() dto: VerifyContractDto) {
    return this.web3ContractService.verifyContract(dto);
  }

  @Post('estimate-gas')
  @ApiOperation({ summary: 'Estimate gas for contract deployment' })
  async estimateGas(@Body() dto: DeployContractDto) {
    return this.web3ContractService.estimateDeploymentGas(dto);
  }
}
