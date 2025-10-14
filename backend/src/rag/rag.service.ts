import { Injectable } from '@nestjs/common';
import { SciBoxService } from './scibox.service';
import { ChatPromptTemplate } from '@langchain/core/prompts';

@Injectable()
export class RagService {
  constructor(private sciboxService: SciBoxService) {
    this.sciboxService = sciboxService;
  }

  async makeChain() {
    const chatModel = this.sciboxService.getChatModel();
    const standaloneQuestionTemplate =
      'Given a question, convert it to a standalone question. question: {question}';
    const standaloneQuestionPrompt = ChatPromptTemplate.fromTemplate(
      standaloneQuestionTemplate,
    );
    const chain = standaloneQuestionPrompt.pipe(chatModel);
    const response = await chain.invoke({
      question:
        'How do I build a pc. Im a little confused about this, I want to know what parts to buy.',
    });
    console.log(response);
  }

  async testChatModel(): Promise<string> {
    try {
      const chatModel = this.sciboxService.getChatModel();
      const response = await chatModel.invoke([
        { role: 'system', content: 'Ты дружелюбный помощник' },
        { role: 'user', content: 'Расскажи короткий анекдот' },
      ]);
      return response.content as string;
    } catch (error) {
      return `Ошибка чат-модели: ${error.message}`;
    }
  }

  async testEmbeddings(): Promise<{
    success: boolean;
    embeddingLength?: number;
    error?: string;
  }> {
    try {
      const testText = 'Тестовый текст для проверки эмбеддингов';
      const embedding = await this.sciboxService.generateEmbedding(testText);
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
