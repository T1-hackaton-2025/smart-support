import { SuggestedResponseCard } from "@/components/SuggestedResponseCard";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Search, Send } from "lucide-react";
import { useEffect, useState } from "react";
import { submitQuestion, submitResponse } from "@/api/api";
import type {
  FinalResponsePayload,
  QuestionResponse,
  SuggestedResponse,
} from "@/types/types";
import Skeletons from "@/components/Skeletons";

export default function QuestionsPage() {
  const [selectedResponses, setSelectedResponses] = useState<Set<string>>(
    new Set()
  );
  const [responses, setResponses] = useState<SuggestedResponse[]>([]);
  const [modifiedResponses, setModifiedResponses] = useState<
    Record<string, string>
  >({});
  const [responseText, setResponseText] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [questionText, setQuestionText] = useState("");
  const [questionResponse, setQuestionResponse] =
    useState<QuestionResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (questionResponse) {
      setResponses(questionResponse.suggestedResponses);
    } else {
      setResponses([]);
    }
  }, [questionResponse]);

  const handleSearch = async () => {
    if (!questionText.trim()) return;

    setLoading(true);
    try {
      const questionResponse = await submitQuestion(questionText);
      setQuestionResponse(questionResponse);
      setShowResults(true);
      setModifiedResponses({});
      setSelectedResponses(new Set());
      setResponseText("");
    } catch (error) {
      console.error("Failed to submit question:", error);
      alert("Failed to submit question. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSearch();
    }
  };

  const handleTemplateToggle = (response: SuggestedResponse) => {
    setSelectedResponses((prev) => {
      const newSet = new Set(prev);

      if (newSet.has(response.id)) {
        newSet.delete(response.id);
      } else {
        newSet.add(response.id);
      }

      const selectedTexts = responses
        .filter((r) => newSet.has(r.id))
        .map((r) => modifiedResponses[r.id]?.trim() || r.response)
        .join("\n\n");

      setResponseText(selectedTexts);
      return newSet;
    });
  };

  const handleResponseModified = (
    response: SuggestedResponse,
    newText: string
  ) => {
    setModifiedResponses((prev) => {
      const updated = { ...prev, [response.id]: newText };
      if (selectedResponses.has(response.id)) {
        const updatedText = responses
          .filter((r) => selectedResponses.has(r.id))
          .map((r) => updated[r.id]?.trim() || r.response)
          .join("\n\n");
        setResponseText(updatedText);
      }
      return updated;
    });
  };

  const handleSubmit = async () => {
    const payload: FinalResponsePayload = {
      finalResponse: responseText.trim(),
      modifiedResponses: Object.entries(modifiedResponses).map(
        ([id, modifiedResponse]) => ({
          id,
          modifiedResponse,
        })
      ),
      selectedResponses: Array.from(selectedResponses),
      standaloneQuestion: questionResponse?.standaloneQuestion!,
    };

    console.log("Submitting:", payload);
    await submitResponse(payload);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-slate-900 mb-2">Bank Operator Support</h1>
        </header>

        <div
          className={`transition-all duration-300 ${
            showResults ? "mb-6" : "mt-32"
          }`}
        >
          <div className="relative">
            <Textarea
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter customer's question here and press Enter or click Send..."
              className="h-[44px] max-h-[120px] overflow-y-auto pr-24 resize-none leading-tight"
            />
            <Button
              onClick={handleSearch}
              disabled={!questionText.trim() || loading}
              size="icon"
              className="absolute right-5 top-3"
            >
              <Search className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {loading ? (
          <Skeletons />
        ) : (
          showResults && (
            <div className="space-y-6">
              {/* Category and Subcategory */}
              <div className="flex items-center gap-3">
                <span className="text-slate-600">Category:</span>
                <Badge variant="secondary" className="text-sm">
                  {questionResponse?.category}
                </Badge>
                <span className="text-slate-600">Subcategory:</span>
                <Badge variant="outline" className="text-sm">
                  {questionResponse?.subcategory}
                </Badge>
              </div>

              {/* Template Cards */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                {responses.map((response, i) => (
                  <SuggestedResponseCard
                    key={response.id}
                    response={response}
                    isSelected={selectedResponses.has(response.id)}
                    isMostRelevant={i === 0}
                    onToggle={() => handleTemplateToggle(response)}
                    onModified={handleResponseModified}
                    modifiedText={modifiedResponses[response.id]}
                  />
                ))}
              </div>

              {/* Combined Response Textarea */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-slate-900">Your Response</h2>
                  {selectedResponses.size > 0 && (
                    <span className="text-slate-500 text-sm">
                      {selectedResponses.size} template
                      {selectedResponses.size !== 1 ? "s" : ""} selected
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Textarea
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    placeholder="Select template cards above or write your own response..."
                    className="h-[calc(100vh-550px)] max-h-[200px] overflow-y-auto resize-none leading-tight bg-white dark:bg-slate-950 pr-20"
                  />

                  <Button
                    onClick={handleSubmit}
                    disabled={!responseText.trim()}
                    size="icon"
                    className="absolute right-5 bottom-3"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
