import { Module } from '@nestjs/common';
import { FlashloanDetectorController } from './flashloan-detector.controller';
import { FlashloanDetectorService } from './flashloan-detector.service';

@Module({
  controllers: [FlashloanDetectorController],
  providers: [FlashloanDetectorService],
  exports: [FlashloanDetectorService],
})
export class FlashloanDetectorModule {}
