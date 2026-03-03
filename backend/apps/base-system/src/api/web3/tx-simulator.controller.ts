import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  HttpStatus,
  HttpCode,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import { TxSimulatorService, TransactionSimulationRequest } from './tx-simulator.service';

class SimulateTransactionDto {
  from: string;
  to: string;
  value?: string;
  data?: string;
  chainId: number;
  gasLimit?: string;
}

class SimulateBatchDto {
  transactions: TransactionSimulationRequest[];
}

class SimulateSwapDto {
  chainId: number;
  from: string;
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  amountOutMin: string;
  recipient: string;
  deadline: number;
}

class SimulateDeploymentDto {
  chainId: number;
  from: string;
  bytecode: string;
  constructorArgs?: string;
}

@Controller('web3/tx-simulator')
export class TxSimulatorController {
  constructor(private readonly txSimulatorService: TxSimulatorService) {}

  /**
   * Get supported chains
   * GET /web3/tx-simulator/chains
   */
  @Get('chains')
  @HttpCode(HttpStatus.OK)
  async getSupportedChains() {
    const chains = this.txSimulatorService.getSupportedChains();
    return {
      success: true,
      data: chains,
    };
  }

  /**
   * Get gas price recommendations
   * GET /web3/tx-simulator/gas-recommendation?chainId=1&urgency=medium
   */
  @Get('gas-recommendation')
  @HttpCode(HttpStatus.OK)
  async getGasRecommendation(
    @Query('chainId') chainId: string,
    @Query('urgency') urgency?: 'low' | 'medium' | 'high',
  ) {
    const chainIdNum = parseInt(chainId, 10);
    const recommendation = await this.txSimulatorService.getGasRecommendation(
      chainIdNum,
      urgency || 'medium',
    );
    return {
      success: true,
      data: recommendation,
    };
  }

  /**
   * Simulate a single transaction
   * POST /web3/tx-simulator/simulate
   */
  @Post('simulate')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true }))
  async simulateTransaction(@Body() dto: SimulateTransactionDto) {
    const result = await this.txSimulatorService.simulateTransaction(dto);
    return {
      success: result.success,
      data: result,
    };
  }

  /**
   * Simulate multiple transactions in batch
   * POST /web3/tx-simulator/simulate-batch
   */
  @Post('simulate-batch')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true }))
  async simulateBatch(@Body() dto: SimulateBatchDto) {
    const results = await this.txSimulatorService.simulateBatch(dto.transactions);
    return {
      success: true,
      data: results,
    };
  }

  /**
   * Simulate a swap transaction
   * POST /web3/tx-simulator/simulate-swap
   */
  @Post('simulate-swap')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true }))
  async simulateSwap(@Body() dto: SimulateSwapDto) {
    const result = await this.txSimulatorService.simulateSwap(dto);
    return {
      success: result.success,
      data: result,
    };
  }

  /**
   * Simulate a contract deployment
   * POST /web3/tx-simulator/simulate-deployment
   */
  @Post('simulate-deployment')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true }))
  async simulateDeployment(@Body() dto: SimulateDeploymentDto) {
    const result = await this.txSimulatorService.simulateDeployment(dto);
    return {
      success: result.success,
      data: result,
    };
  }

  /**
   * Estimate gas for a transaction
   * POST /web3/tx-simulator/estimate-gas
   */
  @Post('estimate-gas')
  @HttpCode(HttpStatus.OK)
  async estimateGas(
    @Body() dto: { from: string; to: string; value?: string; data?: string; chainId: number },
  ) {
    const result = await this.txSimulatorService.simulateTransaction({
      from: dto.from,
      to: dto.to,
      value: dto.value,
      data: dto.data,
      chainId: dto.chainId,
    });
    return {
      success: true,
      data: {
        gasEstimate: result.simulation.gasEstimate,
        gasPrice: result.simulation.gasPrice,
        totalCost: result.simulation.totalCost,
      },
    };
  }
}
