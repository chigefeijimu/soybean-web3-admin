import { Controller, Get, Post, Param, Body, HttpException, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiParam, ApiBody } from '@nestjs/swagger';
import { Web3GasFaucetService } from './web3-gas-faucet.service';

@ApiTags('Web3 Gas Faucet')
@Controller('web3/gas-faucet')
export class Web3GasFaucetController {
  constructor(private readonly gasFaucetService: Web3GasFaucetService) {}

  @Get('networks')
  @ApiOperation({ summary: 'Get supported testnetworks' })
  async getNetworks() {
    return this.gasFaucetService.getSupportedNetworks();
  }

  @Get('address/:chainId')
  @ApiOperation({ summary: 'Get faucet address for a network' })
  @ApiParam({ name: 'chainId', description: 'Chain ID (e.g., 5 for Goerli)' })
  async getFaucetAddress(@Param('chainId') chainId: string) {
    const address = await this.gasFaucetService.getFaucetAddress(chainId);
    if (!address) {
      throw new HttpException('Network not supported', HttpStatus.NOT_FOUND);
    }
    return { address };
  }

  @Post('request')
  @ApiOperation({ summary: 'Request testnet tokens' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        address: { type: 'string', description: 'Recipient wallet address' },
        network: { type: 'string', description: 'Chain ID' },
        amount: { type: 'string', description: 'Amount to request' },
      },
      required: ['address', 'network'],
    },
  })
  async requestTokens(@Body() body: { address: string; network: string; amount?: string }) {
    const result = await this.gasFaucetService.requestTokens(
      body.address,
      body.network,
      body.amount,
    );
    return result;
  }

  @Get('history/:address')
  @ApiOperation({ summary: 'Get request history for an address' })
  @ApiParam({ name: 'address', description: 'Wallet address' })
  async getHistory(@Param('address') address: string) {
    return this.gasFaucetService.getRequestHistory(address);
  }

  @Get('gas-price/:chainId')
  @ApiOperation({ summary: 'Get current gas prices for a network' })
  @ApiParam({ name: 'chainId', description: 'Chain ID' })
  async getGasPrice(@Param('chainId') chainId: string) {
    return this.gasFaucetService.getGasPrice(chainId);
  }
}
