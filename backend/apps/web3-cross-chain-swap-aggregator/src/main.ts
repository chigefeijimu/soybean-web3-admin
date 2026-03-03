import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { CrossChainSwapAggregatorModule } from './cross-chain-swap-aggregator.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    CrossChainSwapAggregatorModule,
    {
      transport: Transport.GRPC,
      options: {
        package: 'cross_chain_swap_aggregator',
        protoPath: join(__dirname, 'cross-chain-swap-aggregator.proto'),
        url: '0.0.0.0:50052',
      },
    },
  );
  await app.listen();
  console.log('Cross-chain Swap Aggregator microservice is running on port 50052');
}
bootstrap();
