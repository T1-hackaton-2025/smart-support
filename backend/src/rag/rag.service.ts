import { Injectable, Logger } from '@nestjs/common';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { Runnable, RunnableSequence } from '@langchain/core/runnables';
import { DatabaseService } from 'src/database/database.service';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { SciBoxService } from 'src/ai/scibox.service';
import { FaqEntry } from 'src/database/util/parseExcelFile';

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
    const mapped = response.map(([d, score]: any) => {
      const similarity = 1 - score;
      const relevancePercent = Math.round(similarity * 100);
      return { ...d.metadata, relevancePercent };
    });
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
        'Treat uppercase and lowercase letters as equivalent.',
      ].join('\n'),
    );
    const toStandalone = standaloneQuestionPrompt
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
        return { standaloneQuestion } as { standaloneQuestion: string };
      },
      async (prev: { standaloneQuestion: string }) => {
        const vectorStore = this.dbService.getVectorStore();
        const retrieveStartedAt = Date.now();
        const results = await vectorStore.similaritySearchWithScore(
          prev.standaloneQuestion,
          5,
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
