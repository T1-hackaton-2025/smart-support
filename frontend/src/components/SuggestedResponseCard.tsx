import type { SuggestedResponse } from "@/types/types";
import { Card } from "./ui/card";
import { Check } from "lucide-react";

interface SuggestedResponseCardProps {
  response: SuggestedResponse;
  isSelected: boolean;
  isMostRelevant?: boolean;
  onToggle: () => void;
}

export function SuggestedResponseCard({
  response,
  isSelected,
  isMostRelevant = false,
  onToggle,
}: SuggestedResponseCardProps) {
  return (
    <Card
      onClick={onToggle}
      className={`p-4 cursor-pointer transition-all duration-200 relative  ${
        isSelected
          ? "bg-blue-50 border-blue-500 border-2 shadow-md"
          : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm"
      }`}
    >
      {isSelected && (
        <div className="absolute top-3 right-3 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
          <Check className="w-4 h-4 text-white" />
        </div>
      )}

      <div className="flex items-center gap-2 w-fit">
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium w-fit ${
            response.relevance >= 80
              ? "bg-green-100 text-green-800"
              : response.relevance >= 70
              ? "bg-yellow-100 text-yellow-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {response.relevance.toFixed(0)}%
        </span>

        {isMostRelevant && (
          <span className="text-xs font-semibold text-blue-600">
            Most Relevant
          </span>
        )}
      </div>

      <p
        className={`text-sm ${isSelected ? "text-blue-700" : "text-slate-600"}`}
      >
        {response.response}
      </p>
    </Card>
  );
}
