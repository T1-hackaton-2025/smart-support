import { Module } from '@nestjs/common';
import { SciBoxService } from './scibox.service';

@Module({
  exports: [SciBoxService],
  providers: [SciBoxService],
})
export class AIModule {}
