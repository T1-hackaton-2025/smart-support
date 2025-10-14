export interface QuestionResponse {
  id: string;
  question: string;
  category: string;
  subcategory: string;
  suggestedResponses: SuggestedResponse[];
}

export interface SuggestedResponse {
  id: string;
  response: string;
  relevance: number;
}
