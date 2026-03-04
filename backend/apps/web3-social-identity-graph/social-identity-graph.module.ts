import { Module } from '@nestjs/common';
import { SocialIdentityGraphController } from './social-identity-graph.controller';
import { SocialIdentityGraphService } from './social-identity-graph.service';

@Module({
  imports: [],
  controllers: [SocialIdentityGraphController],
  providers: [SocialIdentityGraphService],
})
export class SocialIdentityGraphModule {}
