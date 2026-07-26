import { QUESTION_TYPE_MAP } from "@/lib/constants";
import type { QuestionType } from "@/lib/types";

// Thin wrapper so AddQuestionMenu and QuestionListItem always render the
// same icon for a given type at a consistent size - looked up from
// QUESTION_TYPE_MAP (lib/constants.ts) rather than each picking its own.
export function QuestionTypeIcon({
  type,
  className,
}: {
  type: QuestionType;
  className?: string;
}) {
  const Icon = QUESTION_TYPE_MAP[type].icon;
  return <Icon className={className ?? "h-4 w-4"} aria-hidden="true" />;
}
