import type { SuggestedResponse } from "@/types/types";
import { Card } from "./ui/card";
import { Check, Edit3, Save } from "lucide-react";
import { useState } from "react";
import { Textarea } from "./ui/textarea";

interface SuggestedResponseCardProps {
  response: SuggestedResponse;
  isSelected: boolean;
  isMostRelevant?: boolean;
  onToggle: () => void;
  onModified: (response: SuggestedResponse, newText: string) => void;
  modifiedText?: string;
}

export function SuggestedResponseCard({
  response,
  isSelected,
  isMostRelevant = false,
  onToggle,
  onModified,
  modifiedText,
}: SuggestedResponseCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(modifiedText ?? response.response);

  const handleSave = () => {
    if (editText.trim() !== response.response.trim()) {
      onModified(response, editText.trim());
    }
    setIsEditing(false);
  };

  return (
    <Card
      onClick={!isEditing ? onToggle : undefined}
      className={`p-4 cursor-pointer transition-all duration-200 relative ${
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

      {/* Header Row */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
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
          {isMostRelevant && (
            <span className="text-xs font-semibold text-blue-600">
              Most Relevant
            </span>
          )}
        </div>

        {!isEditing ? (
          <Edit3
            className="w-4 h-4 text-slate-500 hover:text-blue-600 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
            }}
          />
        ) : (
          <Save
            className="w-4 h-4 text-green-600 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              handleSave();
            }}
          />
        )}
      </div>

      {/* Content */}
      {!isEditing ? (
        <p
          className={`text-sm ${
            isSelected ? "text-blue-700" : "text-slate-600"
          }`}
        >
          {modifiedText ?? response.response}
        </p>
      ) : (
        <Textarea
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          className="text-sm h-28 resize-none"
          onClick={(e) => e.stopPropagation()}
        />
      )}
    </Card>
  );
}
