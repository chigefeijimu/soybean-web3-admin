import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Web3GasService } from './web3-gas.service';

@ApiTags('Web3 Gas')
@Controller('web3/gas')
export class Web3GasController {
  constructor(private readonly web3GasService: Web3GasService) {}

  @Get('prices')
  @ApiOperation({ summary: '获取多链Gas价格' })
  async getGasPrices(
    @Query('chainId') chainId?: number,
  ) {
    if (chainId) {
      return this.web3GasService.getGasPrice(chainId);
    }
    return this.web3GasService.getAllGasPrices();
  }

  @Get('history')
  @ApiOperation({ summary: '获取Gas价格历史' })
  async getGasHistory(
    @Query('chainId') chainId: number = 1,
    @Query('hours') hours: number = 24,
  ) {
    return this.web3GasService.getGasHistory(chainId, hours);
  }

  @Get('estimate')
  @ApiOperation({ summary: '估算交易Gas费用' })
  async estimateFee(
    @Query('chainId') chainId: number = 1,
    @Query('gasLimit') gasLimit: number = 21000,
  ) {
    return this.web3GasService.estimateFee(chainId, gasLimit);
  }
}
