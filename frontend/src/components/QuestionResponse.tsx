import { useEffect, useState } from "react";
import type { QuestionResponse, SuggestedResponse } from "@/types/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { submitResponse } from "@/api/api";
import { Send, Loader2 } from "lucide-react";

interface QuestionResponseProps {
  question: QuestionResponse | null;
  loading: boolean;
}

export default function QuestionDetails({
  question,
  loading,
}: QuestionResponseProps) {
  const [responses, setResponses] = useState<SuggestedResponse[]>([]);
  const [responseText, setResponseText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [selectedResponses, setSelectedResponses] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    if (question) {
      setResponses(question.suggestedResponses);
    } else {
      setResponses([]);
    }
  }, [question]);

  const handleResponseToggle = (response: SuggestedResponse) => {
    setSelectedResponses((prev) => {
      const newSet = new Set(prev);

      if (newSet.has(response.id)) {
        newSet.delete(response.id);
      } else {
        newSet.add(response.id);
      }

      const selectedTexts = responses
        .filter((r) => newSet.has(r.id))
        .map((r) => r.response)
        .join("\n\n");

      setResponseText(selectedTexts);

      return newSet;
    });
  };

  const handleSubmit = async () => {
    if (!responseText.trim() || !question) return;

    setSubmitting(true);
    try {
      await submitResponse(question.id, responseText);
      setResponseText("");
      alert("Response submitted successfully!");
    } catch (error) {
      console.error("Failed to submit response:", error);
      alert("Failed to submit response. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!question && !loading) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        <p className="text-lg">
          👋 Start by submitting a question to get response suggestions.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex items-center justify-between p-6 border-b">
        <h2 className="text-2xl font-semibold">Respond to Question</h2>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left: Question details and suggested responses */}
        <div className="w-2/3 border-r p-6 overflow-y-auto">
          {loading ? (
            <div className="space-y-6">
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-20 w-full" />
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-5 w-1/2" />
                <Skeleton className="h-5 w-1/2" />
              </div>
              <Skeleton className="h-6 w-1/4" />
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-4 mb-6">
                <div>
                  <h3 className="font-medium text-gray-700 mb-2">Question:</h3>
                  <p className="text-gray-900 bg-gray-50 p-4 rounded-lg">
                    {question?.question}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-700 mb-1">
                      Category:
                    </h4>
                    <p className="text-gray-600">{question?.category}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-700 mb-1">
                      Subcategory:
                    </h4>
                    <p className="text-gray-600">{question?.subcategory}</p>
                  </div>
                </div>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Suggested Responses</CardTitle>
                </CardHeader>
                <CardContent>
                  {responses.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[50px]">Select</TableHead>
                          <TableHead className="w-[70%]">Response</TableHead>
                          <TableHead className="w-[30%]">Relevance</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {responses.map((response) => (
                          <TableRow key={response.id}>
                            <TableCell>
                              <input
                                type="checkbox"
                                checked={selectedResponses.has(response.id)}
                                onChange={() => handleResponseToggle(response)}
                                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                              />
                            </TableCell>
                            <TableCell className="text-sm whitespace-normal">
                              {response.response}
                            </TableCell>
                            <TableCell>
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  response.relevance >= 80
                                    ? "bg-green-100 text-green-800"
                                    : response.relevance >= 70
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {response.relevance.toFixed(0)}%
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No suggested responses available
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Right: Response composition */}
        <div className="w-1/3 p-6 flex flex-col">
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-5 w-1/3" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-10 w-32 ml-auto" />
            </div>
          ) : (
            <>
              <div className="mb-4">
                <h3 className="font-medium text-gray-700 mb-2">
                  Your Response:
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  Click on a suggested response to use it as a starting point,
                  then edit as needed.
                </p>
              </div>

              <div className="flex-1 flex flex-col">
                <Textarea
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder="Type your response here or click on a suggested response..."
                  className="flex-1 resize-none"
                />

                <div className="mt-4 flex justify-end">
                  <Button
                    onClick={handleSubmit}
                    disabled={!responseText.trim() || submitting}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    {submitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    {submitting ? "Submitting..." : "Submit Response"}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
