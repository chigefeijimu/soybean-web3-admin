import { Controller, Get, Post, Query, Body } from '@nestjs/common';
import { PrivacyAnalyzerService } from './privacy-analyzer.service';

@Controller('web3/privacy')
export class PrivacyAnalyzerController {
  constructor(private readonly privacyService: PrivacyAnalyzerService) {}

  @Get('analyze')
  async analyzeAddress(
    @Query('address') address: string,
    @Query('chainId') chainId?: string,
  ) {
    const chain = chainId ? parseInt(chainId, 10) : 1;
    return this.privacyService.analyzeAddressPrivacy(address, chain);
  }

  @Get('best-practices')
  async getBestPractices() {
    return this.privacyService.getPrivacyBestPractices();
  }

  @Post('compare')
  async compareWallets(
    @Body() body: { addresses: string[]; chainId?: number },
  ) {
    const chainId = body.chainId || 1;
    return this.privacyService.compareWallets(body.addresses, chainId);
  }
}
