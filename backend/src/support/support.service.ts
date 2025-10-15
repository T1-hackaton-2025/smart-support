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

    // await new Promise((resolve) => setTimeout(resolve, 1000));

    // const questionId = this.generateId();
    // const category = 'General';
    // const subcategory = 'Something';

    // this.logger.log(`Generated question ID: ${questionId}`);

    // return {
    //   id: questionId,
    //   question: questionText,
    //   category,
    //   subcategory,
    //   suggestedResponses: this.mockResponses,
    // };

    const standalone =
      await this.ragService.getStandaloneQuestion(questionText);

    return {
      id: '123',
      question: standalone,
      category: 'category',
      subcategory: 'subcategory',
      suggestedResponses: this.mockResponses,
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
