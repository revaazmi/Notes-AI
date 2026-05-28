import { Badge } from "@/components/ui/Badge";

interface Suggestion {
  type: "summary" | "quiz" | "explain" | "paraphrase";
  title: string;
  description: string;
}

const typeLabels: Record<Suggestion["type"], string> = {
  summary: "Summarize",
  quiz: "Quiz",
  explain: "Explain",
  paraphrase: "Rewrite",
};

const typeVariants: Record<Suggestion["type"], "purple" | "orange" | "pink" | "tag-green"> = {
  summary: "purple",
  quiz: "orange",
  explain: "pink",
  paraphrase: "tag-green",
};

interface AISuggestionCardProps {
  suggestion: Suggestion;
  mode: "compact" | "expanded";
  onClick: () => void;
}

export function AISuggestionCard({ suggestion, mode, onClick }: AISuggestionCardProps) {
  if (mode === "compact") {
    return (
      <button
        onClick={onClick}
        className="flex flex-col gap-1 rounded-lg border border-hairline bg-canvas p-md text-left cursor-pointer hover:shadow-card transition-shadow"
      >
        <Badge variant={typeVariants[suggestion.type]}>{typeLabels[suggestion.type]}</Badge>
        <h4 className="text-body-sm text-charcoal leading-snug">{suggestion.title}</h4>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className="w-full rounded-lg border border-hairline bg-canvas p-xxl text-left cursor-pointer hover:shadow-card transition-shadow animate-fadeIn"
    >
      <div className="flex flex-col gap-sm">
        <Badge variant={typeVariants[suggestion.type]}>{typeLabels[suggestion.type]}</Badge>
        <h4 className="text-heading-5 text-charcoal">{suggestion.title}</h4>
        <p className="text-body-sm text-slate">{suggestion.description}</p>
      </div>
    </button>
  );
}
