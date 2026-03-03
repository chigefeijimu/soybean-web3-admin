import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { 
  DefiRoiCalculatorService, 
  StakingInput, 
  LendingInput, 
  LiquidityPositionInput,
  ImpermanentLossCalcInput 
} from './defi-roi-calculator.service';

@ApiTags('DeFi ROI Calculator')
@Controller('api/defi-roi')
export class DefiRoiCalculatorController {
  constructor(private readonly defiRoiService: DefiRoiCalculatorService) {}

  @Get('rates')
  @ApiOperation({ summary: 'Get current DeFi rates for popular protocols' })
  async getCurrentRates() {
    const rates = this.defiRoiService.getCurrentRates();
    return { data: rates };
  }

  @Post('staking')
  @ApiOperation({ summary: 'Calculate staking ROI with compound interest' })
  async calculateStakingRoi(@Body() input: StakingInput) {
    const result = this.defiRoiService.calculateStakingRoi(input);
    return { data: result };
  }

  @Post('lending')
  @ApiOperation({ summary: 'Calculate lending ROI' })
  async calculateLendingRoi(@Body() input: LendingInput) {
    const result = this.defiRoiService.calculateLendingRoi(input);
    return { data: result };
  }

  @Post('liquidity')
  @ApiOperation({ summary: 'Calculate liquidity provision ROI with impermanent loss' })
  async calculateLiquidityRoi(@Body() input: LiquidityPositionInput) {
    const result = this.defiRoiService.calculateLiquidityRoi(input);
    return { data: result };
  }

  @Post('impermanent-loss')
  @ApiOperation({ summary: 'Calculate impermanent loss for any price change' })
  async calculateImpermanentLoss(@Body() input: ImpermanentLossCalcInput) {
    const result = this.defiRoiService.calculateImpermanentLoss(input);
    return { data: result };
  }

  @Post('compare')
  @ApiOperation({ summary: 'Compare multiple DeFi strategies' })
  async compareStrategies(
    @Body() body: { 
      strategies: Array<{
        name: string;
        type: 'staking' | 'lending' | 'liquidity';
        apy: number;
        risk: 'low' | 'medium' | 'high';
        lockPeriod: number;
        initialAmount: number;
      }>
    }
  ) {
    const result = this.defiRoiService.compareStrategies(body.strategies);
    return { data: result };
  }

  @Post('yield-farming')
  @ApiOperation({ summary: 'Calculate multi-hop yield farming ROI' })
  async calculateYieldFarming(
    @Body() body: {
      initialAmount: number;
      steps: Array<{
        protocol: string;
        fromToken: string;
        toToken: string;
        apy: number;
        steps: number;
      }>;
      durationDays: number;
    }
  ) {
    const result = this.defiRoiService.calculateYieldFarmingRoi(
      body.initialAmount,
      body.steps,
      body.durationDays
    );
    return { data: result };
  }

  @Get('calculator')
  @ApiOperation({ summary: 'Get calculator interface info' })
  async getCalculatorInfo() {
    return {
      data: {
        staking: {
          description: 'Calculate returns from staking tokens',
          inputs: ['token', 'amount', 'apy', 'durationDays', 'compoundFrequency'],
          example: {
            token: 'ETH',
            amount: 10000,
            apy: 5.0,
            durationDays: 365,
            compoundFrequency: 'daily'
          }
        },
        lending: {
          description: 'Calculate returns from lending assets',
          inputs: ['token', 'amount', 'supplyApy', 'durationDays', 'compoundFrequency'],
          example: {
            token: 'USDC',
            amount: 10000,
            supplyApy: 4.5,
            durationDays: 365,
            compoundFrequency: 'daily'
          }
        },
        liquidity: {
          description: 'Calculate LP returns with impermanent loss',
          inputs: ['token0', 'token1', 'amount0', 'amount1', 'apy', 'durationDays', 'expectedPriceChange'],
          example: {
            token0: 'ETH',
            token1: 'USDC',
            amount0: 5000,
            amount1: 5000,
            apy: 20,
            durationDays: 365,
            expectedPriceChange: 20
          }
        },
        impermanentLoss: {
          description: 'Calculate impermanent loss for any price change',
          inputs: ['token0StartPrice', 'token1StartPrice', 'token0EndPrice', 'token1EndPrice'],
          example: {
            token0StartPrice: 2000,
            token1StartPrice: 1,
            token0EndPrice: 2400,
            token1EndPrice: 1
          }
        }
      }
    };
  }
}
