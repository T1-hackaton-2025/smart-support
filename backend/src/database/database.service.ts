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
  private readonly vectorStoreExtra: PGVectorStore;

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

      const vectorStoreConfig = {
        postgresConnectionOptions: {
          connectionString,
        },
        columns: {
          vectorColumnName: 'embedding',
          contentColumnName: 'content',
          metadataColumnName: 'metadata',
        },
      };

      this.vectorStore = new PGVectorStore(embeddingModel, {
        ...vectorStoreConfig,
        tableName: 'documents',
      });

      this.vectorStoreExtra = new PGVectorStore(embeddingModel, {
        ...vectorStoreConfig,
        tableName: 'documents_extra',
      });
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
    return this.vectorStore.asRetriever({ k: 1 });
  }

  getVectorStoreExtra(): PGVectorStore {
    return this.vectorStoreExtra;
  }

  getRetreiverExtra(): VectorStoreRetriever<PGVectorStore> {
    return this.vectorStore.asRetriever({ k: 1 });
  }

  async findByIds(ids: string[]) {
    const {
      pool,
      tableName,
      idColumnName,
      contentColumnName,
      metadataColumnName,
    } = this.vectorStore;

    if (!ids || ids.length === 0) {
      return [];
    }

    const placeholders = ids.map((_, i) => `$${i + 1}`).join(', ');

    const query = `
    SELECT ${idColumnName} AS id,
           ${contentColumnName} AS content,
           ${metadataColumnName} AS metadata
    FROM ${tableName}
    WHERE ${idColumnName} IN (${placeholders})
  `;

    console.log(tableName);

    const res = await pool.query(
      query,
      ids.map((i) => parseInt(i)),
    );

    console.log(ids);
    console.log(res);
    console.log(res.rows);

    return res.rows;
  }

  async saveNewDocuments(documents: Document[]) {
    try {
      await this.vectorStoreExtra.addDocuments(documents);
    } catch (error) {
      console.log('Failed to save FAQ entries to database:', error);
      throw error;
    }
  }

  private async saveFaqEntriesToDatabase(
    faqEntries: FaqEntry[],
  ): Promise<void> {
    try {
      const existingCount = await this.dataSource.query(
        'SELECT COUNT(*) as count FROM documents',
      );
      const count = parseInt(existingCount[0].count);

      if (count > 0) {
        await this.dataSource.query(
          'TRUNCATE TABLE documents RESTART IDENTITY',
        );
      }

      const documents: Document[] = faqEntries.map(entryToDocumentMapper);

      await this.vectorStore.addDocuments(documents);
    } catch (error) {
      console.error('Failed to save FAQ entries to database:', error);
      throw error;
    }
  }
}

const entryToDocumentMapper = (entry: FaqEntry) =>
  new Document({
    pageContent: entry.question,
    metadata: {
      mainCategory: entry.mainCategory,
      subCategory: entry.subCategory,
      priority: entry.priority,
      targetAudience: entry.targetAudience,
      templateAnswer: entry.templateAnswer,
    },
  });
