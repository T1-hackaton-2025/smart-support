export class SubmitResponseDto {
  finalResponse: string;
  modifiedResponses: { id: string; modifiedResponse: string }[];
  selectedResponses: string[];
  standaloneQuestion: string;
}
