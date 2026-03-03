import { Module } from '@nestjs/common';
import { NftRarityCalculatorController } from './controller/nft-rarity-calculator.controller';
import { NftRarityCalculatorService } from './service/nft-rarity-calculator.service';

@Module({
  controllers: [NftRarityCalculatorController],
  providers: [NftRarityCalculatorService],
  exports: [NftRarityCalculatorService],
})
export class NftRarityCalculatorModule {}
