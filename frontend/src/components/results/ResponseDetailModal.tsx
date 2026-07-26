"use client";

import { useEffect, useState } from "react";

import { Modal } from "@/components/ui/Modal";
import { useFormBuilder } from "@/context/FormBuilderContext";
import { formatAnswerValue, formatDateTime } from "@/lib/answerDisplay";
import * as responsesApi from "@/lib/api/responses";
import type { ResponseAnswer, ResponseDetail } from "@/lib/types";

// Fetches GET /api/responses/{id} on open rather than reusing the row
// data from the list - keeps the detail view independent of how the
// list was loaded, and it's the endpoint's one consumer.
//
// A response's answers arrive in insertion order, not form order, so
// rows are rendered by walking the live form's questions (position
// order, unanswered ones included as "—"); answers whose question was
// since soft-deleted no longer appear in form.questions and are
// appended at the end with a badge instead of being dropped.
export function ResponseDetailModal({
  responseId,
  onClose,
}: {
  responseId: number | null;
  onClose: () => void;
}) {
  const { form } = useFormBuilder();
  const [detail, setDetail] = useState<ResponseDetail | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (responseId === null) return;
    let cancelled = false;
    setDetail(null);
    setError(false);
    responsesApi
      .getResponse(responseId)
      .then((d) => {
        if (!cancelled) setDetail(d);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [responseId]);

  if (!form) return null;

  const byQuestionId = new Map<number, ResponseAnswer>(
    (detail?.answers ?? []).map((a) => [a.question_id, a])
  );
  const liveQuestionIds = new Set(form.questions.map((q) => q.id));
  const orphanAnswers = (detail?.answers ?? []).filter(
    (a) => !liveQuestionIds.has(a.question_id)
  );

  return (
    <Modal isOpen={responseId !== null} onClose={onClose} title="Response details">
      {error ? (
        <p className="text-sm text-ink-muted">Couldn&apos;t load this response.</p>
      ) : !detail ? (
        <p className="text-sm text-ink-muted">Loading…</p>
      ) : (
        <div className="flex max-h-[60vh] flex-col gap-4 overflow-y-auto pr-1">
          <p className="text-[13px] text-ink-muted">
            Submitted {formatDateTime(detail.submitted_at ?? detail.started_at)}
          </p>
          <ul className="flex flex-col gap-3">
            {form.questions.map((question, i) => {
              const answer = byQuestionId.get(question.id);
              return (
                <li key={question.id}>
                  <div className="text-[13px] text-ink-muted">
                    {i + 1}. {question.title}
                  </div>
                  <div className="mt-0.5 whitespace-pre-wrap text-sm text-ink">
                    {answer ? formatAnswerValue(answer.question_type, answer.value) : "—"}
                  </div>
                </li>
              );
            })}
            {orphanAnswers.map((answer) => (
              <li key={answer.question_id}>
                <div className="flex items-center gap-2 text-[13px] text-ink-muted">
                  <span>{answer.question_title}</span>
                  <span className="rounded-full bg-surface-panel px-2 py-0.5 text-xs">
                    Removed question
                  </span>
                </div>
                <div className="mt-0.5 whitespace-pre-wrap text-sm text-ink">
                  {formatAnswerValue(answer.question_type, answer.value)}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Modal>
  );
}
