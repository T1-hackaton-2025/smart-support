import { Module } from '@nestjs/common';
import { RagService } from './rag.service';

@Module({
  providers: [RagService]
})
export class RagModule {}
