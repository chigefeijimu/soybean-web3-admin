import { Controller, Get, Post, Body, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { IntentSolverService, IntentType, SolverType } from './intent-solver.service';

class SubmitIntentDto {
  user: string;
  type: IntentType;
  fromChain: string;
  toChain?: string;
  fromToken: string;
  toToken: string;
  amount: string;
  maxSlippage?: number;
  maxGasFee?: string;
  deadline?: number;
  allowPartialFill?: boolean;
}

class ExecuteIntentDto {
  solver: SolverType;
}

@Controller('intent-solver')
export class IntentSolverController {
  constructor(private readonly intentSolverService: IntentSolverService) {}

  /**
   * Submit a new intent for solving
   * POST /api/v1/intent-solver/intents
   */
  @Post('intents')
  @HttpCode(HttpStatus.CREATED)
  async submitIntent(@Body() dto: SubmitIntentDto) {
    const constraints = dto.maxSlippage ? {
      maxSlippage: dto.maxSlippage,
      maxGasFee: dto.maxGasFee,
      deadline: dto.deadline,
      allowPartialFill: dto.allowPartialFill,
    } : undefined;

    return this.intentSolverService.submitIntent(
      dto.user,
      dto.type,
      dto.fromChain,
      dto.toChain,
      dto.fromToken,
      dto.toToken,
      dto.amount,
      constraints,
    );
  }

  /**
   * Get solution quotes for an intent
   * GET /api/v1/intent-solver/intents/:id/solution
   */
  @Get('intents/:id/solution')
  async getSolution(@Param('id') id: string) {
    const solution = await this.intentSolverService.getSolution(id);
    if (!solution) {
      return { error: 'Solution not found or intent not solved yet', intentId: id };
    }
    return solution;
  }

  /**
   * Execute an intent with a specific solver
   * POST /api/v1/intent-solver/intents/:id/execute
   */
  @Post('intents/:id/execute')
  @HttpCode(HttpStatus.ACCEPTED)
  async executeIntent(@Param('id') id: string, @Body() dto: ExecuteIntentDto) {
    return this.intentSolverService.executeIntent(id, dto.solver);
  }

  /**
   * Get intent status
   * GET /api/v1/intent-solver/intents/:id
   */
  @Get('intents/:id')
  async getIntentStatus(@Param('id') id: string) {
    const intent = await this.intentSolverService.getIntentStatus(id);
    if (!intent) {
      return { error: 'Intent not found', intentId: id };
    }
    return intent;
  }

  /**
   * Get all intents for a user
   * GET /api/v1/intent-solver/intents
   */
  @Get('intents')
  async getUserIntents(@Query('user') user: string) {
    if (!user) {
      return { error: 'User address is required' };
    }
    return this.intentSolverService.getUserIntents(user);
  }

  /**
   * Get solver statistics
   * GET /api/v1/intent-solver/stats
   */
  @Get('stats')
  async getStats() {
    return this.intentSolverService.getStats();
  }

  /**
   * Get supported chains
   * GET /api/v1/intent-solver/chains
   */
  @Get('chains')
  async getSupportedChains() {
    return this.intentSolverService.getSupportedChains();
  }

  /**
   * Get supported tokens for a chain
   * GET /api/v1/intent-solver/tokens
   */
  @Get('tokens')
  async getSupportedTokens(@Query('chain') chain: string) {
    if (!chain) {
      return { error: 'Chain parameter is required' };
    }
    return this.intentSolverService.getSupportedTokens(chain);
  }

  /**
   * Health check
   * GET /api/v1/intent-solver/health
   */
  @Get('health')
  async health() {
    return {
      status: 'operational',
      service: 'Intent Solver API',
      version: '1.0.0',
      supportedSolvers: ['uniswapx', 'across', 'cowswap', '1inch', 'paraswap', 'odos', 'native_bridge'],
      supportedChains: await this.intentSolverService.getSupportedChains(),
      timestamp: new Date().toISOString(),
    };
  }
}
