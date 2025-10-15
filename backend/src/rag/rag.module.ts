import { Module, OnModuleInit } from '@nestjs/common';
import { RagService } from './rag.service';
import { SciBoxService } from './scibox.service';

@Module({
  providers: [RagService, SciBoxService],
  exports: [RagService, SciBoxService],
})
export class RagModule {}
