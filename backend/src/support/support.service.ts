import { Injectable, Logger } from '@nestjs/common';
import {
  QuestionResponseDto,
  SuggestedResponseDto,
} from './dto/question-response.dto';
import { RagService } from 'src/rag/rag.service';

@Injectable()
export class SupportService {
  private readonly logger = new Logger(SupportService.name);
  private mockResponses: SuggestedResponseDto[] = [
    {
      id: 'r1-1',
      response:
        "To reset your password, go to the login page and click 'Forgot Password'. Enter your email address and follow the instructions sent to your inbox.",
      relevance: 0.95,
    },
    {
      id: 'r1-2',
      response:
        "You can reset your password by visiting the account settings page and selecting 'Change Password' option.",
      relevance: 0.87,
    },
    {
      id: 'r1-3',
      response:
        'For password reset, contact our support team who can assist you with account recovery.',
      relevance: 0.72,
    },
  ];

  constructor(private readonly ragService: RagService) {}

  async submitQuestion(questionText: string): Promise<QuestionResponseDto> {
    this.logger.log(`Received question: ${questionText}`);

    const templates = await this.ragService.getSuggestedTemplates(questionText);

    return {
      id: '123',
      question: questionText,
      category: templates[0].mainCategory || 'category',
      subcategory: templates[0].subCategory || 'subcategory',
      suggestedResponses: templates.map((t, i) => ({
        id: i.toString(10),
        response: t.templateAnswer,
        relevance: 1,
      })),
    };
  }

  async submitResponse(
    questionId: string,
    responseText: string,
  ): Promise<void> {
    this.logger.log(
      `Submitting response for question ${questionId}: ${responseText}`,
    );

    await new Promise((resolve) => setTimeout(resolve, 500));

    this.logger.log(
      `Response submitted successfully for question ${questionId}`,
    );
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 11);
  }
}
