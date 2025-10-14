import type { QuestionResponse, SuggestedResponse } from "@/types/types";
// import $api from "./axios";

const mockResponses: SuggestedResponse[] = [
  {
    id: "r1-1",
    response:
      "To reset your password, go to the login page and click 'Forgot Password'. Enter your email address and follow the instructions sent to your inbox.",
    relevance: 0.95,
  },
  {
    id: "r1-2",
    response:
      "You can reset your password by visiting the account settings page and selecting 'Change Password' option.",
    relevance: 0.87,
  },
  {
    id: "r1-3",
    response:
      "For password reset, contact our support team who can assist you with account recovery.",
    relevance: 0.72,
  },
];

export const submitQuestion = async (
  questionText: string
): Promise<QuestionResponse> => {
  // const response = await $api.post<Question>("/questions", {
  //   question: questionText,
  // });
  // return response.data;

  await new Promise((resolve) => setTimeout(resolve, 2000));
  const newQuestionId = Math.random().toString(36).substr(2, 9);

  const category = "General";
  const subcategory = "Something";

  const newQuestion: QuestionResponse = {
    id: newQuestionId,
    question: questionText,
    category,
    subcategory,
    suggestedResponses: mockResponses,
  };

  console.log(`Submitting question:`, questionText);
  return newQuestion;
};

export const submitResponse = async (
  questionId: string,
  responseText: string
): Promise<void> => {
  // const response = await $api.post(`/questions/${questionId}/response`, {
  //   response: responseText
  // });
  // return response.data;

  await new Promise((resolve) => setTimeout(resolve, 1000));

  console.log(`Submitting response for question ${questionId}:`, responseText);
};
