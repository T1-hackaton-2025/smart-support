import { Body, Controller, Logger, Param, Post } from '@nestjs/common';
import { SupportService } from './support.service';
import { SubmitQuestionDto } from './dto/submit-question.dto';
import { SubmitResponseDto } from './dto/submit-response.dto';
import { QuestionResponseDto } from './dto/question-response.dto';

@Controller('support')
export class SupportController {
  private readonly logger = new Logger(SupportController.name);

  constructor(private readonly supportService: SupportService) {}

  @Post('questions')
  async submitQuestion(
    @Body() submitQuestionDto: SubmitQuestionDto,
  ): Promise<QuestionResponseDto> {
    this.logger.log('POST /support/questions');
    return this.supportService.submitQuestion(submitQuestionDto.question);
  }

  @Post('questions/:id/response')
  async submitResponse(
    @Param('id') questionId: string,
    @Body() submitResponseDto: SubmitResponseDto,
  ): Promise<void> {
    this.logger.log(`POST /support/questions/${questionId}/response`);
    return this.supportService.submitResponse(
      questionId,
      submitResponseDto.response,
    );
  }
}
