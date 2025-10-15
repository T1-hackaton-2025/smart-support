import { Module } from '@nestjs/common';
import { RagService } from './rag.service';
import { DatabaseModule } from 'src/database/database.module';
import { AIModule } from 'src/ai/ai.module';

@Module({
  imports: [DatabaseModule, AIModule],
  providers: [RagService],
  exports: [RagService],
})
export class RagModule {}
