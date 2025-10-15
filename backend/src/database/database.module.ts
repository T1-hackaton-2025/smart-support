import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { PGVectorStore } from '@langchain/community/vectorstores/pgvector';
import { RagModule } from '../rag/rag.module';
import { SciBoxService } from '../rag/scibox.service';
import * as path from 'path';
import * as fs from 'fs';
import { parseExcelFile } from './util/parseExcelFile';
import { saveFaqEntriesToDatabase } from './util/saveToDatabase';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DATABASE_HOST', 'localhost'),
        port: configService.get('DATABASE_PORT', 5432),
        username: configService.get('DATABASE_USERNAME', 'myuser'),
        password: configService.get('DATABASE_PASSWORD', 'ChangeMe'),
        database: configService.get('DATABASE_NAME', 'api'),
        entities: [],
        synchronize: false,
        logging: true,
      }),
    }),
    RagModule,
  ],
  providers: [SciBoxService],
  exports: [SciBoxService],
})
export class DatabaseModule implements OnModuleInit {
  private vectorStore: PGVectorStore;

  constructor(
    private dataSource: DataSource,
    private configService: ConfigService,
    private sciBoxService: SciBoxService,
  ) {}

  async onModuleInit() {
    try {
      const sqlPath = path.join(process.cwd(), 'src/database/init.sql');
      const sqlScript = fs.readFileSync(sqlPath, 'utf8');
      
      await this.dataSource.query(sqlScript);
      console.log('Database initialization completed successfully');

      await this.initializeVectorStore();
      console.log('PGVectorStore initialized successfully');

      const faqEntries = await parseExcelFile();
      console.log(`Parsed ${faqEntries.length} FAQ entries from Excel file`);

      await saveFaqEntriesToDatabase(this.dataSource, this.vectorStore, faqEntries);
    } catch (error) {
      console.error('Database initialization failed:', error);
      throw error;
    }
  }

  private async initializeVectorStore(): Promise<void> {
    try {
      const host = this.configService.get('DATABASE_HOST', 'localhost');
      const port = this.configService.get('DATABASE_PORT', 5432);
      const username = this.configService.get('DATABASE_USERNAME', 'myuser');
      const password = this.configService.get('DATABASE_PASSWORD', 'ChangeMe');
      const database = this.configService.get('DATABASE_NAME', 'api');

      const connectionString = `postgresql://${username}:${password}@${host}:${port}/${database}`;

      const embeddingModel = this.sciBoxService.getEmbeddingModel();

      this.vectorStore = new PGVectorStore(embeddingModel, {
        postgresConnectionOptions: {
          connectionString,
        },
        tableName: 'documents',
        columns: {
          vectorColumnName: 'embedding',
          contentColumnName: 'content',
          metadataColumnName: 'metadata',
        },
      });
    } catch (error) {
      console.error('Failed to initialize PGVectorStore:', error);
      throw error;
    }
  }
}
