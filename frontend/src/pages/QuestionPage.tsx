import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { QuestionResponse } from "@/types/types";
import { submitQuestion } from "@/api/api";
import { Send, Loader2 } from "lucide-react";
import QuestionDetails from "@/components/QuestionResponse";

export default function QuestionPage() {
  const [questionText, setQuestionText] = useState("");
  const [questionResponse, setQuestionResponse] =
    useState<QuestionResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!questionText.trim()) return;

    setLoading(true);
    try {
      const questionResponse = await submitQuestion(questionText);
      setQuestionResponse(questionResponse);
    } catch (error) {
      console.error("Failed to submit question:", error);
      alert("Failed to submit question. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full">
      {/* Left Panel – Question Input */}
      <div className="w-1/3">
        <Card className="h-full flex flex-col rounded-none">
          <CardHeader>
            <CardTitle className="text-2xl">
              Input the client's question
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="question"
                  className="block text-m font-medium text-gray-700 mb-2"
                >
                  Submit to get response recommendations
                </label>
                <Textarea
                  id="question"
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  placeholder="Input client's question here..."
                  className="min-h-[200px] resize-none"
                  disabled={loading}
                />
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleSubmit}
                  disabled={!questionText.trim() || loading}
                  className="flex items-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  {loading ? "Processing..." : "Submit Question"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Panel – Always visible */}
      <div className="w-2/3 border-l">
        <QuestionDetails question={questionResponse} loading={loading} />
      </div>
    </div>
  );
}
