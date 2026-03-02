import { Controller, Get, Query } from '@nestjs/common';
import { DexVolumeService } from './dex-volume.service';

@Controller('web3/dex-volume')
export class DexVolumeController {
  constructor(private readonly dexVolumeService: DexVolumeService) {}

  @Get('stats')
  async getDexStats(@Query('chain') chain: string) {
    return this.dexVolumeService.getDexStats(chain);
  }

  @Get('pairs')
  async getTopPairs(
    @Query('chain') chain: string,
    @Query('dex') dex: string,
    @Query('limit') limit: number = 50,
  ) {
    return this.dexVolumeService.getTopPairs(chain, dex, limit);
  }

  @Get('history')
  async getVolumeHistory(
    @Query('chain') chain: string,
    @Query('dex') dex: string,
    @Query('pair') pair: string,
    @Query('days') days: number = 7,
  ) {
    return this.dexVolumeService.getVolumeHistory(chain, dex, pair, days);
  }

  @Get('dexes')
  async getSupportedDexes(@Query('chain') chain: string) {
    return this.dexVolumeService.getSupportedDexes(chain);
  }

  @Get('chains')
  async getSupportedChains() {
    return this.dexVolumeService.getSupportedChains();
  }

  @Get('token-volume')
  async getTokenVolume(
    @Query('chain') chain: string,
    @Query('token') token: string,
    @Query('days') days: number = 7,
  ) {
    return this.dexVolumeService.getTokenVolume(chain, token, days);
  }

  @Get('comparison')
  async compareDexVolumes(
    @Query('chain') chain: string,
    @Query('days') days: number = 7,
  ) {
    return this.dexVolumeService.compareDexVolumes(chain, days);
  }
}
