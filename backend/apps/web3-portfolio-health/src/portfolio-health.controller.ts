import { Controller, Get, Param, Query, Post, Body } from '@nestjs/common';
import { PortfolioHealthService } from './portfolio-health.service';

@Controller('web3/portfolio-health')
export class PortfolioHealthController {
  constructor(private readonly portfolioHealthService: PortfolioHealthService) {}

  /**
   * Get portfolio health score for a single wallet
   */
  @Get(':address')
  async getPortfolioHealth(
    @Param('address') address: string,
    @Query('chainId') chainId?: number
  ) {
    return this.portfolioHealthService.analyzePortfolioHealth(
      address,
      chainId ? parseInt(chainId.toString()) : 1
    );
  }

  /**
   * Batch analyze multiple wallets
   */
  @Post('batch')
  async batchAnalyze(
    @Body() body: { addresses: string[]; chainId?: number }
  ) {
    const { addresses, chainId } = body;
    return this.portfolioHealthService.analyzeMultipleWallets(
      addresses,
      chainId || 1
    );
  }

  /**
   * Compare multiple wallets' health
   */
  @Get('compare/:addresses')
  async compareWallets(
    @Param('addresses') addresses: string,
    @Query('chainId') chainId?: number
  ) {
    const addrList = addresses.split(',').map(a => a.trim());
    const results = await this.portfolioHealthService.analyzeMultipleWallets(
      addrList,
      chainId ? parseInt(chainId.toString()) : 1
    );

    // Calculate comparison metrics
    const avgScore = results.reduce((sum, r) => sum + r.overallScore, 0) / results.length;
    const best = results.reduce((best, r) => r.overallScore > best.overallScore ? r : best, results[0]);
    const worst = results.reduce((worst, r) => r.overallScore < worst.overallScore ? r : worst, results[0]);

    return {
      wallets: results,
      comparison: {
        averageScore: Math.round(avgScore),
        bestPerformer: best.address,
        bestScore: best.overallScore,
        worstPerformer: worst.address,
        worstScore: worst.overallScore
      }
    };
  }
}
