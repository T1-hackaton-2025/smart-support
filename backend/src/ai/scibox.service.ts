import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatOpenAI } from '@langchain/openai';
import { OpenAIEmbeddings } from '@langchain/openai';

@Injectable()
export class SciBoxService {
  private readonly chatModel: ChatOpenAI;
  private readonly embeddingModel: OpenAIEmbeddings;

  constructor(private configService: ConfigService) {
    const sciboxConfig = this.configService.get('scibox');

    this.chatModel = new ChatOpenAI({
      openAIApiKey: sciboxConfig.apiKey,
      configuration: {
        baseURL: sciboxConfig.baseUrl,
      },
      modelName: sciboxConfig.chatModel,
      temperature: 0.7,
      maxTokens: 1000,
    });

    this.embeddingModel = new OpenAIEmbeddings({
      openAIApiKey: sciboxConfig.apiKey,
      configuration: {
        baseURL: sciboxConfig.baseUrl,
      },
      modelName: sciboxConfig.embeddingModel,
    });
  }

  getChatModel(): ChatOpenAI {
    return this.chatModel;
  }

  getEmbeddingModel(): OpenAIEmbeddings {
    return this.embeddingModel;
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const embedding = await this.embeddingModel.embedQuery(text);
    return embedding;
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    const embeddings = await this.embeddingModel.embedDocuments(texts);
    return embeddings;
  }
}
