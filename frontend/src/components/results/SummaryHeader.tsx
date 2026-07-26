"use client";

import { formatDateTime } from "@/lib/answerDisplay";

// The measured Insights "Big picture" counter style (spec section 7):
// large plain numbers under small gray labels, no charts. Real Typeform
// also shows Views/Starts/Completion rate/Time to complete there - all
// of those need partial-response tracking we deliberately don't do
// (out of scope), so this strip only shows counters backed by real data.
export function SummaryHeader({
  responseCount,
  latestResponseAt,
}: {
  responseCount: number;
  latestResponseAt: string | null;
}) {
  return (
    <div className="flex gap-12 rounded-xl bg-surface-canvas p-5 shadow-ring-sm">
      <div>
        <div className="text-[13px] text-ink-muted">Responses</div>
        <div className="mt-1 text-2xl font-normal text-ink">{responseCount}</div>
      </div>
      {latestResponseAt && (
        <div>
          <div className="text-[13px] text-ink-muted">Latest response</div>
          <div className="mt-2 text-base font-normal text-ink">
            {formatDateTime(latestResponseAt)}
          </div>
        </div>
      )}
    </div>
  );
}
