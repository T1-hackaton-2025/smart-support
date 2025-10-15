import { DataSource } from 'typeorm';
import { PGVectorStore } from '@langchain/community/vectorstores/pgvector';
import { Document } from '@langchain/core/documents';
import { FaqEntry } from './parseExcelFile';

export async function saveFaqEntriesToDatabase(
  dataSource: DataSource,
  vectorStore: PGVectorStore,
  faqEntries: FaqEntry[],
  test: (document: Document) => void,
): Promise<void> {
  try {
    const existingCount = await dataSource.query(
      'SELECT COUNT(*) as count FROM documents',
    );
    const count = parseInt(existingCount[0].count);

    if (count > 0) {
      await dataSource.query('TRUNCATE TABLE documents RESTART IDENTITY');
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

    documents.forEach((d) => test(d));

    await vectorStore.addDocuments(documents);

    console.log(
      `Successfully saved ${faqEntries.length} FAQ entries with embeddings to database`,
    );
  } catch (error) {
    console.error('Failed to save FAQ entries to database:', error);
    throw error;
  }
}
