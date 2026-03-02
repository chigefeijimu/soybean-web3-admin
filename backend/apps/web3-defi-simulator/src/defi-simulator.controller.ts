import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { DefiSimulatorService } from './defi-simulator.service';

@Controller('defi-simulator')
export class DefiSimulatorController {
  constructor(private readonly defiSimulatorService: DefiSimulatorService) {}

  @Get('protocols')
  async getSupportedProtocols() {
    return this.defiSimulatorService.getSupportedProtocols();
  }

  @Post('swap')
  async simulateSwap(
    @Body() body: {
      protocol: string;
      chain: string;
      fromToken: string;
      toToken: string;
      amount: string;
    },
  ) {
    return this.defiSimulatorService.simulateSwap(body);
  }

  @Post('add-liquidity')
  async simulateAddLiquidity(
    @Body() body: {
      protocol: string;
      chain: string;
      tokenA: string;
      tokenB: string;
      amountA: string;
      amountB: string;
    },
  ) {
    return this.defiSimulatorService.simulateAddLiquidity(body);
  }

  @Post('lending')
  async simulateLending(
    @Body() body: {
      protocol: string;
      chain: string;
      action: 'deposit' | 'borrow' | 'withdraw' | 'repay';
      token: string;
      amount: string;
    },
  ) {
    return this.defiSimulatorService.simulateLending(body);
  }

  @Post('stake')
  async simulateStake(
    @Body() body: {
      protocol: string;
      chain: string;
      token: string;
      amount: string;
    },
  ) {
    return this.defiSimulatorService.simulateStake(body);
  }
}
