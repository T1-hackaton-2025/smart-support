import { Injectable, Logger } from '@nestjs/common';
import { QuestionResponseDto } from './dto/question-response.dto';
import { RagService } from 'src/rag/rag.service';
import { SubmitResponseDto } from './dto/submit-response.dto';

@Injectable()
export class SupportService {
  private readonly logger = new Logger(SupportService.name);

  constructor(private readonly ragService: RagService) {}

  async submitQuestion(questionText: string): Promise<QuestionResponseDto> {
    const { entries: templates, standaloneQuestion } =
      await this.ragService.getSuggestedTemplates(questionText);

    return {
      question: questionText,
      standaloneQuestion,
      category: templates[0].mainCategory || 'category',
      subcategory: templates[0].subCategory || 'subcategory',
      suggestedResponses: templates.map((t) => ({
        id: t.id,
        response: t.templateAnswer,
        relevance:
          typeof t.relevancePercent === 'number' ? t.relevancePercent : 1,
      })),
    };
  }

  async submitResponse(dto: SubmitResponseDto): Promise<void> {
    if (dto.selectedResponses.length === 0) return;

    await this.ragService.addNewTemplates(
      dto.standaloneQuestion,
      dto.selectedResponses,
    );

    console.log('submitted new template successfully');
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 11);
  }
}
