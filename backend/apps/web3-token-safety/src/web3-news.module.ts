import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { Web3NewsController } from './web3-news.controller';

@Module({
  imports: [HttpModule],
  controllers: [Web3NewsController],
  providers: [],
  exports: [],
})
export class Web3NewsModule {}
