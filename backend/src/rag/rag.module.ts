import { Module } from '@nestjs/common';
import { RagService } from './rag.service';
import { SciBoxService } from './scibox.service';

@Module({
  providers: [RagService, SciBoxService],
})
export class RagModule {}
