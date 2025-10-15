import { Injectable } from '@nestjs/common';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { Runnable } from '@langchain/core/runnables';
import { DatabaseService } from 'src/database/database.service';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { SciBoxService } from 'src/ai/scibox.service';

@Injectable()
export class RagService {
  private readonly chain: Runnable;

  constructor(
    private readonly sciboxService: SciBoxService,
    private readonly dbService: DatabaseService,
  ) {
    this.sciboxService = sciboxService;

    this.chain = this.makeChain();
  }

  public async getStandaloneQuestion(
    originalQuestion: string,
  ): Promise<string> {
    const response = await this.chain.invoke({
      question: originalQuestion,
    });

    console.log(response);

    return '';
  }

  private makeChain() {
    const chatModel = this.sciboxService.getChatModel();
    const retreiver = this.dbService.getRetreiver();

    const standaloneQuestionPrompt = ChatPromptTemplate.fromTemplate(
      'Given a question, convert it to a standalone question. question: {question}',
    );
    const chain = standaloneQuestionPrompt
      .pipe(chatModel)
      .pipe(new StringOutputParser())
      .pipe(retreiver);
    // const response = await chain.invoke({
    //   question:
    //     'How do I build a pc. Im a little confused about this, I want to know what parts to buy.',
    // });
    // console.log(response);

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
