import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { CrossChainWhaleDashboardController } from './cross-chain-whale-dashboard.controller';
import { CrossChainWhaleDashboardService } from './cross-chain-whale-dashboard.service';

@Module({
  imports: [HttpModule],
  controllers: [CrossChainWhaleDashboardController],
  providers: [CrossChainWhaleDashboardService],
  exports: [CrossChainWhaleDashboardService],
})
export class AppModule {}
