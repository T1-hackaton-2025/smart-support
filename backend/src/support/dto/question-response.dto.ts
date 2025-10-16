export class SuggestedResponseDto {
  id: string;
  response: string;
  relevance: number;
}

export class QuestionResponseDto {
  question: string;
  standaloneQuestion: string;
  category: string;
  subcategory: string;
  suggestedResponses: SuggestedResponseDto[];
}
