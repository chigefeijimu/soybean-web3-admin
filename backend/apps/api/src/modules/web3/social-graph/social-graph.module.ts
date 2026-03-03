import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { SocialGraphController } from './social-graph.controller';
import { SocialGraphService } from './social-graph.service';

@Module({
  imports: [HttpModule],
  controllers: [SocialGraphController],
  providers: [SocialGraphService],
  exports: [SocialGraphService],
})
export class SocialGraphModule {}
