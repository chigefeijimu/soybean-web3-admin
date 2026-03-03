import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { IntentSolverController } from './intent-solver.controller';
import { IntentSolverService } from './intent-solver.service';

@Module({
  imports: [HttpModule],
  controllers: [IntentSolverController],
  providers: [IntentSolverService],
})
export class IntentSolverModule {}
