import { useState, useEffect } from "react";
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
import { submitResponse } from "@/api/api";
import { Send, Loader2 } from "lucide-react";

interface QuestionResponseProps {
  question: QuestionResponse;
  onClose: () => void;
}

export default function QuestionDetails({
  question,
  onClose,
}: QuestionResponseProps) {
  const [responses, setResponses] = useState<SuggestedResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [responseText, setResponseText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [selectedResponses, setSelectedResponses] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    const fetchResponses = async () => {
      setLoading(true);
      try {
        setResponses(question.suggestedResponses);
      } catch (error) {
        console.error("Failed to fetch responses:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchResponses();
  }, [question.id, question.suggestedResponses]);

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
    if (!responseText.trim()) return;

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

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex items-center justify-between p-6 border-b">
        <h2 className="text-2xl font-semibold">Respond to Question</h2>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 text-xl cursor-pointer"
        >
          x
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Question details and suggested responses */}
        <div className="w-1/2 border-r p-6 overflow-y-auto">
          <div className="space-y-4 mb-6">
            <div>
              <h3 className="font-medium text-gray-700 mb-2">Question:</h3>
              <p className="text-gray-900 bg-gray-50 p-4 rounded-lg">
                {question.question}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-700 mb-1">Category:</h4>
                <p className="text-gray-600">{question.category}</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-700 mb-1">Subcategory:</h4>
                <p className="text-gray-600">{question.subcategory}</p>
              </div>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Suggested Responses</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Loading responses...</span>
                </div>
              ) : responses.length > 0 ? (
                <div className="overflow-y-auto">
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
                          <TableCell className="text-sm">
                            <div className="whitespace-normal">
                              {response.response}
                            </div>
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
                              {(response.relevance)}%
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No suggested responses available
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Response composition */}
        <div className="w-1/2 p-6 flex flex-col">
          <div className="mb-4">
            <h3 className="font-medium text-gray-700 mb-2">Your Response:</h3>
            <p className="text-sm text-gray-500 mb-4">
              Click on a suggested response to use it as a starting point, then
              edit as needed.
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
        </div>
      </div>
    </div>
  );
}
