import { Controller, Get, Post, Body, Query, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { GasStationService } from './gas-station.service';

@ApiTags('gas-station')
@Controller('gas-station')
export class GasStationController {
  constructor(private readonly gasStationService: GasStationService) {}

  @Get('health')
  @ApiOperation({ description: 'Check API health status' })
  async health() {
    return this.gasStationService.healthCheck();
  }

  @Get('supported-chains')
  @ApiOperation({ description: 'Get supported chains for gas station' })
  async getSupportedChains(@Query('feature') feature?: string) {
    return this.gasStationService.getSupportedChains(feature);
  }

  @Get('supported-tokens/:chainId')
  @ApiOperation({ description: 'Get supported gas payment tokens for a chain' })
  async getSupportedTokens(@Param('chainId') chainId: string) {
    return this.gasStationService.getSupportedTokens(parseInt(chainId));
  }

  @Post('estimate-gas')
  @ApiOperation({ description: 'Estimate gas fee in both native token and ERC20' })
  async estimateGas(@Body() body: any) {
    return this.gasStationService.estimateGas({
      chainId: body.chainId,
      tokenAddress: body.tokenAddress,
      txType: body.txType,
      gasLimit: body.gasLimit,
    });
  }

  @Get('token-price')
  @ApiOperation({ description: 'Get token price for gas calculation' })
  async getTokenPrice(@Query('address') address: string, @Query('chainId') chainId: string) {
    return this.gasStationService.getTokenPrice(address, parseInt(chainId));
  }

  @Post('calculate-relayer-fee')
  @ApiOperation({ description: 'Calculate cross-chain relayer fee' })
  async calculateRelayerFee(@Body() body: any) {
    return this.gasStationService.calculateRelayerFee({
      sourceChainId: body.sourceChainId,
      destChainId: body.destChainId,
      tokenAddress: body.tokenAddress,
      gasLimit: body.gasLimit,
    });
  }

  @Get('gas-savings')
  @ApiOperation({ description: 'Compare gas costs across payment methods' })
  @ApiQuery({ name: 'chainId', required: true })
  @ApiQuery({ name: 'txType', required: true })
  async getGasSavings(@Query('chainId') chainId: string, @Query('txType') txType: string) {
    return this.gasStationService.getGasSavings(parseInt(chainId), txType);
  }

  @Get('relayer-status')
  @ApiOperation({ description: 'Get relayer network status' })
  async getRelayerStatus() {
    return this.gasStationService.getRelayerStatus();
  }

  @Get('history/:address')
  @ApiOperation({ description: 'Get gas payment history for an address' })
  async getHistory(@Param('address') address: string) {
    return this.gasStationService.getPaymentHistory(address);
  }

  @Get('stats')
  @ApiOperation({ description: 'Get gas station statistics' })
  async getStats() {
    return this.gasStationService.getStats();
  }
}
