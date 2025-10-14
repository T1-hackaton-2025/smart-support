import { Module } from '@nestjs/common';
import { SupportService } from './support.service';
import { SupportController } from './support.controller';
import { RagModule } from '../rag/rag.module';

@Module({
  imports: [RagModule],
  providers: [SupportService],
  controllers: [SupportController],
})
export class SupportModule {}
