import { NestFactory } from '@nestjs/core';
import { TxAcceleratorModule } from './tx-accelerator.module';

async function bootstrap() {
  const app = await NestFactory.create(TxAcceleratorModule);
  
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });
  
  const port = process.env.PORT || 3008;
  await app.listen(port);
  
  console.log(`🚀 Transaction Accelerator running on port ${port}`);
}

bootstrap();
