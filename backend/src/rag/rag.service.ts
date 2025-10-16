import { Injectable, Logger } from '@nestjs/common';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { Runnable, RunnableSequence } from '@langchain/core/runnables';
import { DatabaseService } from 'src/database/database.service';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { SciBoxService } from 'src/ai/scibox.service';
import { FaqEntry } from 'src/database/util/parseExcelFile';
import { PRODUCT_MAPPING_STRING } from './constants';
import { Document } from '@langchain/core/documents';

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
  ): Promise<{ entries: FaqEntry[]; standaloneQuestion: string }> {
    const invokeStartedAt = Date.now();
    this.logger.log(`langchain chain started at  ${invokeStartedAt}`);
    const { results, standaloneQuestion } = await this.chain.invoke({
      question: originalQuestion,
    });

    const invokeMs = Date.now() - invokeStartedAt;
    const mapped = results.map(([d, score]: any) => {
      const similarity = 1 - score;
      const relevancePercent = Math.round(similarity * 100);
      return { ...d.metadata, relevancePercent, id: d.id };
    });
    this.logger.log(
      `timing langchain chain took time=${invokeMs}ms,  finished at ${Date.now()}`,
    );
    return { entries: mapped, standaloneQuestion };
  }

  public async addNewTemplates(
    newStandaloneQuestion: string,
    templates: {
      modifiedTemplateId: string;
      modifiedTemplateAnswer: string;
    }[],
  ) {
    if (!templates || templates.length === 0) return;

    const ids = templates.map((t) => t.modifiedTemplateId);

    const rows = await this.dbService.findByIds(ids);

    if (!rows || rows.length === 0) {
      throw new Error('No matching templates found for provided IDs.');
    }

    const templateMap = new Map(
      templates.map((t) => [t.modifiedTemplateId, t]),
    );

    const newDocs = rows
      .map((row: any) => {
        const templateData = templateMap.get(row.id);
        if (!templateData) return null;

        return new Document({
          pageContent: newStandaloneQuestion,
          metadata: {
            ...row.metadata,
            templateAnswer: templateData.modifiedTemplateAnswer,
          },
        });
      })
      .filter((doc) => doc !== null);

    if (newDocs.length > 0) {
      await this.dbService.saveNewDocuments(newDocs);
    }
  }

  private makeChain() {
    const chatModel = this.sciboxService.getChatModel();

    const normalizationPrompt = ChatPromptTemplate.fromTemplate(
      [
        'Вы — эксперт-корректор. Ваша задача — подготовить текст для точного векторного поиска.',
        'Выполните следующие шаги строго по порядку:',
        '1. Коррекция имен продуктов: Сначала просмотрите вопрос и найдите слова, которые могут быть названиями банковских продуктов.',
        '   Если слово похоже на одно из названий в списке (фонетически, визуально, или является неправильным регистром/транслитерацией), замените его на точное, каноническое название из списка. Если из контекста видно, что слово не используется как термин, то игнорируй это правило',
        '2. Коррекция валют: Найдите жаргонные выражения (например, "баксы", "евры"), или некорректные названия валют или их канонические названия ЗАМЕНИ ИХ НА аббревиатуры (USD, CNY, EUR, RUB и тд) .',
        '2. Нормализация: Исправьте грамматику, пунктуацию, и опечатки в тексте после шага 1.',
        '3. Расшифровка аббревиатур: Если в тексте остались аббревиатуры, не входящие в список продуктов (например, МСИ), расшифруйте их до полного значения.',
        '---',
        'Список продуктов для замены (ключ: найденный вариант, значение: канонический вариант):',
        '{productMappings}',
        '---',
        'Возвращайте ТОЛЬКО финальный, скорректированный текст вопроса без объяснений и кавычек.',
        'Вопрос: {question}',
      ].join('\n'),
    );
    const normalizeQuestion = normalizationPrompt
      .pipe(chatModel)
      .pipe(new StringOutputParser());

    const standaloneQuestionPrompt = ChatPromptTemplate.fromTemplate(
      [
        'Given a question, convert it to a standalone question.',
        'question: {question}',
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
          productMappings: PRODUCT_MAPPING_STRING,
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
        return {
          results,
          standaloneQuestion: prev.standaloneQuestion,
        };
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
