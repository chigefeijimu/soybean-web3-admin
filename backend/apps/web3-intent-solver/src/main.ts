import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { IntentSolverModule } from './intent-solver.module';

async function bootstrap() {
  const app = await NestFactory.create(IntentSolverModule);
  
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });
  
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  
  const port = process.env.PORT || 3019;
  await app.listen(port);
  console.log(`🚀 Intent Solver API running on port ${port}`);
}
bootstrap();
