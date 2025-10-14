import { Module } from '@nestjs/common';
import { RagModule } from './rag/rag.module';
import { SupportModule } from './support/support.module';

@Module({
  imports: [RagModule, SupportModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
