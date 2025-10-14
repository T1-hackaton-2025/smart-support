import type { QuestionResponse } from "@/types/types";
import $api from "./axios";

export const submitQuestion = async (
  questionText: string
): Promise<QuestionResponse> => {
  const response = await $api.post<QuestionResponse>("/support/questions", {
    question: questionText,
  });
  return response.data;
};

export const submitResponse = async (
  questionId: string,
  responseText: string
): Promise<void> => {
  await $api.post(`/support/questions/${questionId}/response`, {
    response: responseText,
  });
};
