export class SuggestedResponseDto {
  id: string;
  response: string;
  relevance: number;
}

export class QuestionResponseDto {
  id: string;
  question: string;
  category: string;
  subcategory: string;
  suggestedResponses: SuggestedResponseDto[];
}
