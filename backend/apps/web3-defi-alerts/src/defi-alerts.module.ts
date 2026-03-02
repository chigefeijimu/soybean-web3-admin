import { Module } from '@nestjs/common';
import { DefiAlertsController } from './defi-alerts.controller';
import { DefiAlertsService } from './defi-alerts.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  controllers: [DefiAlertsController],
  providers: [DefiAlertsService],
})
export class DefiAlertsModule {}
