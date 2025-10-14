import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RagModule } from './rag/rag.module';
import { SupportModule } from './support/support.module';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [configuration],
    }),
    RagModule,
    SupportModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
