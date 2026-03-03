import { Module } from '@nestjs/common';
import { AddressClusteringController } from './address-clustering.controller';
import { AddressClusteringService } from './address-clustering.service';

@Module({
  imports: [],
  controllers: [AddressClusteringController],
  providers: [AddressClusteringService],
  exports: [AddressClusteringService],
})
export class AddressClusteringModule {}
