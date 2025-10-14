import { Module } from '@nestjs/common';
import { RagService } from './rag.service';
import { SciBoxService } from './scibox.service';

@Module({
  providers: [RagService, SciBoxService],
  exports: [RagService],
})
export class RagModule {}
