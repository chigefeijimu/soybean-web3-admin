import { Module } from '@nestjs/common';
import { DexVolumeController } from './dex-volume.controller';
import { DexVolumeService } from './dex-volume.service';

@Module({
  controllers: [DexVolumeController],
  providers: [DexVolumeService],
})
export class DexVolumeModule {}
