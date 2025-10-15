import { Injectable, Logger } from '@nestjs/common';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { Runnable, RunnableSequence } from '@langchain/core/runnables';
import { DatabaseService } from 'src/database/database.service';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { SciBoxService } from 'src/ai/scibox.service';
import { FaqEntry } from 'src/database/util/parseExcelFile';
import { categoriesWithSubcategories } from './constants';

@Injectable()
export class RagService {
  private readonly chain: Runnable;
  private readonly logger = new Logger(RagService.name);

  constructor(
    private readonly sciboxService: SciBoxService,
    private readonly dbService: DatabaseService,
  ) {
    this.sciboxService = sciboxService;

    this.chain = this.makeChain();
  }

  public async getSuggestedTemplates(
    originalQuestion: string,
  ): Promise<FaqEntry[]> {
    const invokeStartedAt = Date.now();
    this.logger.log(`langchain chain started at  ${invokeStartedAt}`);
    const response = await this.chain.invoke({
      question: originalQuestion,
    });
    const invokeMs = Date.now() - invokeStartedAt;
    const mapped = response.map((d) => d.metadata);
    this.logger.log(
      `timing langchain chain took time=${invokeMs}ms,  finished at ${Date.now()}`,
    );
    return mapped;
  }

  private makeChain() {
    const chatModel = this.sciboxService.getChatModel();

    const normalizationPrompt = ChatPromptTemplate.fromTemplate(
      [
        'Given a user question, fix grammar and punctuation without changing the meaning.',
        'Correct typos. Return ONLY the corrected question text without quotes or explanations.',
        'Treat uppercase and lowercase letters as equivalent.',
        'question: {question}',
      ].join('\n'),
    );
    const normalizeQuestion = normalizationPrompt
      .pipe(chatModel)
      .pipe(new StringOutputParser());

    const standaloneQuestionPrompt = ChatPromptTemplate.fromTemplate(
      [
        'Given a question, convert it to a standalone question.',
        'Treat uppercase and lowercase letters as equivalent.',
        'question: {question}',
      ].join('\n'),
    );
    const toStandalone = standaloneQuestionPrompt
      .pipe(chatModel)
      .pipe(new StringOutputParser());

    const classifyPrompt = ChatPromptTemplate.fromTemplate(
      [
        'Classify the standalone question into one of the categories and subcategories provided.',
        'Return ONLY valid JSON object with exact keys and double quotes:',
        '{{"mainCategory":"...","subCategory":"..."}}',
        'If there is no suitable subcategory, set subCategory to an empty string.',
        'Treat uppercase and lowercase letters as equivalent.',
        'Standalone question: {standaloneQuestion}',
        'Categories JSON list: {categories}',
      ].join('\n'),
    );
    const classifyStep = classifyPrompt
      .pipe(chatModel)
      .pipe(new StringOutputParser());

    const chain = RunnableSequence.from([
      async (input: { question: string }) => {
        const startedAt = Date.now();
        const normalizedQuestion = await normalizeQuestion.invoke({
          question: input.question,
        });
        this.logger.log(
          `timing normalizeQuestion took time=${Date.now() - startedAt}ms`,
        );
        return { normalizedQuestion } as { normalizedQuestion: string };
      },
      async (prev: { normalizedQuestion: string }) => {
        const standaloneStartedAt = Date.now();
        const standaloneQuestion = await toStandalone.invoke({
          question: prev.normalizedQuestion,
        });
        this.logger.log(
          `timing toStandalone took time=${Date.now() - standaloneStartedAt}ms`,
        );
        const categories = JSON.stringify(
          categoriesWithSubcategories.map((c) => ({
            category: c.category,
            subcategories: c.subcategories,
          })),
        );
        return { standaloneQuestion, categories } as {
          standaloneQuestion: string;
          categories: string;
        };
      },
      async (prev: { standaloneQuestion: string; categories: string }) => {
        const classifyStartedAt = Date.now();
        const classification = await classifyStep.invoke({
          standaloneQuestion: prev.standaloneQuestion,
          categories: prev.categories,
        });
        this.logger.log(
          `timing classify took time=${Date.now() - classifyStartedAt}ms`,
        );
        return {
          standaloneQuestion: prev.standaloneQuestion,
          classification,
        } as { standaloneQuestion: string; classification: string };
      },
      async (prev: { standaloneQuestion: string; classification: string }) => {
        let mainCategory = '';
        let subCategory = '';
        try {
          const parsed = JSON.parse(prev.classification);
          if (parsed && typeof parsed === 'object') {
            mainCategory = parsed.mainCategory || '';
            subCategory = parsed.subCategory || '';
          }
        } catch {}

        const filter = mainCategory
          ? subCategory
            ? { metadata: { mainCategory, subCategory } }
            : { metadata: { mainCategory } }
          : undefined;

        const vectorStore = this.dbService.getVectorStore();
        const retrieveStartedAt = Date.now();
        if (filter) {
          const results = await vectorStore.similaritySearch(
            prev.standaloneQuestion,
            1,
            filter,
          );
          this.logger.log(
            `timing similaritySearch (filtered) took time=${
              Date.now() - retrieveStartedAt
            }ms`,
          );
          return results;
        }
        const results = await vectorStore.similaritySearch(
          prev.standaloneQuestion,
          1,
        );
        this.logger.log(
          `timing similaritySearch took time=${Date.now() - retrieveStartedAt}ms`,
        );
        return results;
      },
    ]);

    return chain;
  }

  private async testChatModel(): Promise<string> {
    try {
      const chatModel = this.sciboxService.getChatModel();
      const response = await chatModel.invoke([
        { role: 'system', content: 'Ты дружелюбный помощник' },
        { role: 'user', content: 'Расскажи короткий анекдот' },
      ]);
      console.log(response);
      return response.content as string;
    } catch (error) {
      return `Ошибка чат-модели: ${error.message}`;
    }
  }

  private async testEmbeddings(): Promise<{
    success: boolean;
    embeddingLength?: number;
    error?: string;
  }> {
    try {
      const testText = 'Тестовый текст для проверки эмбеддингов';
      const embedding = await this.sciboxService.generateEmbedding(testText);
      console.log(embedding);
      return {
        success: true,
        embeddingLength: embedding.length,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async testSciBoxService(): Promise<{
    chatTest: string;
    embeddingTest: {
      success: boolean;
      embeddingLength?: number;
      error?: string;
    };
    timestamp: string;
  }> {
    const chatTest = await this.testChatModel();
    const embeddingTest = await this.testEmbeddings();

    return {
      chatTest,
      embeddingTest,
      timestamp: new Date().toISOString(),
    };
  }
}
