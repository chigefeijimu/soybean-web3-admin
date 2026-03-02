import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TokenInsiderTrackerController } from './token-insider-tracker.controller';
import { TokenInsiderTrackerService } from './token-insider-tracker.service';

@Module({
  imports: [HttpModule],
  controllers: [TokenInsiderTrackerController],
  providers: [TokenInsiderTrackerService],
  exports: [TokenInsiderTrackerService],
})
export class TokenInsiderTrackerModule {}
