import { Controller, Get, Param, Query } from '@nestjs/common';
import { TxPatternAnalyzerService } from './tx-pattern-analyzer.service';

@Controller('tx-pattern-analyzer')
export class TxPatternAnalyzerController {
  constructor(
    private readonly txPatternAnalyzerService: TxPatternAnalyzerService,
  ) {}

  @Get('analyze/:chain/:address')
  async analyzeAddress(
    @Param('address') address: string,
    @Param('chain') chain: string,
  ) {
    return this.txPatternAnalyzerService.analyzeAddressPattern(address, chain);
  }

  @Get('cross-chain/:address')
  async analyzeCrossChain(@Param('address') address: string) {
    return this.txPatternAnalyzerService.analyzeCrossChainPattern(address);
  }

  @Get('chains')
  getSupportedChains() {
    return {
      chains: [
        'ethereum',
        'polygon',
        'arbitrum',
        'optimism',
        'bsc',
        'base',
        'avalanche',
        'solana',
      ],
    };
  }
}
