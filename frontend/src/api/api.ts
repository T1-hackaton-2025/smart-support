import type { FinalResponsePayload, QuestionResponse } from "@/types/types";
import $api from "./axios";

export const submitQuestion = async (
  questionText: string
): Promise<QuestionResponse> => {
  const response = await $api.post<QuestionResponse>("/support/questions", {
    question: questionText,
  });
  console.log(response.data);
  return response.data;
};

export const submitResponse = async (
  finalResponse: FinalResponsePayload
): Promise<void> => {
  await $api.post(`/support/responses`, finalResponse);
};
