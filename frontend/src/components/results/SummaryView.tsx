"use client";

import { QuestionSummaryCard } from "@/components/results/QuestionSummaryCard";
import type { FormSummary } from "@/lib/types";

// The summary deliberately includes soft-deleted questions (their
// historical answers still matter - see get_summary in
// routers/forms.py). The backend doesn't flag them, but any summary
// question_id absent from the live form's questions is by definition a
// deleted one.
export function SummaryView({
  summary,
  liveQuestionIds,
}: {
  summary: FormSummary;
  liveQuestionIds: Set<number>;
}) {
  return (
    <div className="flex flex-col gap-4">
      {summary.questions.map((question, i) => (
        <QuestionSummaryCard
          key={question.question_id}
          summary={question}
          index={i + 1}
          responseCount={summary.response_count}
          isDeleted={!liveQuestionIds.has(question.question_id)}
        />
      ))}
    </div>
  );
}
