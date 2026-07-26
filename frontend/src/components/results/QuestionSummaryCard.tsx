"use client";

import { QuestionTypeIcon } from "@/components/ui/QuestionTypeIcon";
import { formatNumber } from "@/lib/answerDisplay";
import type { QuestionSummary } from "@/lib/types";

// Per-question stat card. The layout is our own design on the
// established token system - the spec explicitly GAPs real Typeform's
// per-question insights (upgrade-gated during recon, never observed).
// Which body renders is driven by which summary branch the backend
// populated: options (choice), average+distribution (number/rating),
// samples (text types).
export function QuestionSummaryCard({
  summary,
  index,
  responseCount,
  isDeleted,
}: {
  summary: QuestionSummary;
  index: number;
  responseCount: number;
  isDeleted: boolean;
}) {
  return (
    <section className="rounded-xl bg-surface-canvas p-5 shadow-ring-sm">
      <header className="mb-4 flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-2">
          <QuestionTypeIcon type={summary.question_type} className="h-4 w-4 shrink-0 text-ink-muted" />
          <h3 className="min-w-0 truncate text-base font-normal text-ink">
            {index}. {summary.question_title}
          </h3>
          {isDeleted && (
            <span className="shrink-0 rounded-full bg-surface-panel px-2 py-0.5 text-xs text-ink-muted">
              Removed question
            </span>
          )}
        </div>
        <span className="shrink-0 text-[13px] text-ink-muted">
          {summary.total_answers} of {responseCount} answered
        </span>
      </header>

      {summary.total_answers === 0 ? (
        <p className="text-sm text-ink-muted">No answers yet</p>
      ) : summary.options ? (
        <OptionBars options={summary.options} />
      ) : summary.distribution ? (
        <NumberStats average={summary.average} distribution={summary.distribution} />
      ) : (
        <Samples samples={summary.samples ?? []} />
      )}
    </section>
  );
}

function OptionBars({ options }: { options: NonNullable<QuestionSummary["options"]> }) {
  return (
    <ul className="flex flex-col gap-3">
      {options.map((option) => (
        <li key={option.label}>
          <div className="flex items-baseline justify-between gap-4 text-sm">
            <span className="min-w-0 truncate text-ink">{option.label}</span>
            <span className="shrink-0 text-ink-muted">
              {option.count} · {Math.round(option.percentage)}%
            </span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-panel">
            <div
              className="h-full rounded-full bg-ink/70 transition-[width] duration-300 ease-tf"
              style={{ width: `${option.percentage}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

function NumberStats({
  average,
  distribution,
}: {
  average: number | null;
  distribution: NonNullable<QuestionSummary["distribution"]>;
}) {
  const maxCount = Math.max(...distribution.map((d) => d.count), 1);
  return (
    <div className="flex flex-wrap items-start gap-x-12 gap-y-4">
      <div>
        <div className="text-[13px] text-ink-muted">Average</div>
        <div className="mt-1 text-2xl font-normal text-ink">
          {average === null ? "—" : formatNumber(average)}
        </div>
      </div>
      <ul className="flex min-w-48 flex-1 flex-col gap-1.5">
        {distribution.map((row) => (
          <li key={row.value} className="flex items-center gap-3 text-sm">
            <span className="w-8 shrink-0 text-right text-ink">{formatNumber(row.value)}</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-panel">
              <div
                className="h-full rounded-full bg-ink/70"
                style={{ width: `${(row.count / maxCount) * 100}%` }}
              />
            </div>
            <span className="w-6 shrink-0 text-ink-muted">{row.count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Samples({ samples }: { samples: string[] }) {
  return (
    <div>
      <div className="mb-2 text-[13px] text-ink-muted">Latest answers</div>
      <ul className="flex flex-col gap-1.5">
        {samples.map((sample, i) => (
          <li key={i} className="rounded-lg bg-surface-panel px-3 py-2 text-sm text-ink">
            {sample}
          </li>
        ))}
      </ul>
    </div>
  );
}
