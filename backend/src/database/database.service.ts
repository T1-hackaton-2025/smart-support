import { Injectable, OnModuleInit } from '@nestjs/common';
import { PGVectorStore } from '@langchain/community/vectorstores/pgvector';
import { VectorStoreRetriever } from '@langchain/core/vectorstores';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { SciBoxService } from '../ai/scibox.service';
import * as path from 'path';
import * as fs from 'fs';
import { FaqEntry, parseExcelFile } from './util/parseExcelFile';
import { Document } from '@langchain/core/documents';
@Injectable()
export class DatabaseService implements OnModuleInit {
  private readonly vectorStore: PGVectorStore;

  constructor(
    private readonly configService: ConfigService,
    private readonly sciBoxService: SciBoxService,
    private dataSource: DataSource,
  ) {
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
      console.log('PGVectorStore initialized successfully');
    } catch (error) {
      console.error('Failed to initialize PGVectorStore:', error);
      throw error;
    }
  }

  async onModuleInit() {
    try {
      const sqlPath = path.join(process.cwd(), 'src/database/init.sql');
      const sqlScript = fs.readFileSync(sqlPath, 'utf8');

      await this.dataSource.query(sqlScript);
      console.log('Database initialization completed successfully');

      const faqEntries = await parseExcelFile();
      console.log(`Parsed ${faqEntries.length} FAQ entries from Excel file`);

      await this.saveFaqEntriesToDatabase(faqEntries);
    } catch (error) {
      console.error('Database initialization failed:', error);
      throw error;
    }
  }

  getVectorStore(): PGVectorStore {
    return this.vectorStore;
  }

  getRetreiver(): VectorStoreRetriever<PGVectorStore> {
    return this.vectorStore.asRetriever();
  }

  private async saveFaqEntriesToDatabase(
    faqEntries: FaqEntry[],
  ): Promise<void> {
    try {
      console.log(
        `Starting to save ${faqEntries.length} FAQ entries to database with embeddings...`,
      );

      const existingCount = await this.dataSource.query(
        'SELECT COUNT(*) as count FROM documents',
      );
      const count = parseInt(existingCount[0].count);

      if (count > 0) {
        console.log(`Found ${count} existing documents. Clearing table...`);
        await this.dataSource.query(
          'TRUNCATE TABLE documents RESTART IDENTITY',
        );
      }

      const documents: Document[] = faqEntries.map((entry, index) => {
        return new Document({
          pageContent: entry.question,
          metadata: {
            mainCategory: entry.mainCategory,
            subCategory: entry.subCategory,
            priority: entry.priority,
            targetAudience: entry.targetAudience,
            templateAnswer: entry.templateAnswer,
          },
        });
      });

      await new Promise((resolve) => setTimeout(resolve, 3000));

      await this.vectorStore.addDocuments(documents);

      console.log(
        `Successfully saved ${faqEntries.length} FAQ entries with embeddings to database`,
      );
    } catch (error) {
      console.error('Failed to save FAQ entries to database:', error);
      throw error;
    }
  }
}
