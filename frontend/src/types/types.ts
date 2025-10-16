export interface QuestionResponse {
  id: string;
  question: string;
  standaloneQuestion: string;
  category: string;
  subcategory: string;
  suggestedResponses: SuggestedResponse[];
}

export interface SuggestedResponse {
  id: string;
  response: string;
  relevance: number;
}

export interface FinalResponsePayload {
  finalResponse: string;
  selectedResponses: string[];
  standaloneQuestion: string;
}
