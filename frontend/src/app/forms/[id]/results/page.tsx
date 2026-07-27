"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { useExportCsv } from "@/lib/exportCsv";
import { EmptyResponses } from "@/components/results/EmptyResponses";
import { ResponseDetailModal } from "@/components/results/ResponseDetailModal";
import { ResponsesTable } from "@/components/results/ResponsesTable";
import { ResultsTabs, type ResultsTab } from "@/components/results/ResultsTabs";
import { SummaryHeader } from "@/components/results/SummaryHeader";
import { SummaryView } from "@/components/results/SummaryView";
import { useFormBuilder } from "@/context/FormBuilderContext";
import * as responsesApi from "@/lib/api/responses";
import type { FormSummary, ResponseDetail } from "@/lib/types";

// Read-only data fetched once on mount - plain local state, no third
// context provider. formId/form come from FormBuilderContext (the
// /forms/[id] layout already provides it), which also gives the live
// question order for the detail modal and deleted-question detection.
export default function ResultsPage() {
  const { form, formId } = useFormBuilder();
  const { exportCsv, exporting } = useExportCsv();
  const [summary, setSummary] = useState<FormSummary | null>(null);
  const [responses, setResponses] = useState<ResponseDetail[] | null>(null);
  const [error, setError] = useState(false);
  const [tab, setTab] = useState<ResultsTab>("summary");
  const [openResponseId, setOpenResponseId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([responsesApi.getFormSummary(formId), responsesApi.listResponses(formId)])
      .then(([summaryData, responsesData]) => {
        if (cancelled) return;
        setSummary(summaryData);
        setResponses(responsesData);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [formId]);

  if (error) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-ink-muted">
        Couldn&apos;t load results. Refresh to try again.
      </div>
    );
  }

  if (!form || !summary || !responses) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-ink-muted">
        Loading results…
      </div>
    );
  }

  if (summary.response_count === 0) {
    return <EmptyResponses />;
  }

  const liveQuestionIds = new Set(form.questions.map((q) => q.id));
  // List is ordered newest-first (started_at desc) by the backend.
  const latestResponseAt = responses[0]?.submitted_at ?? responses[0]?.started_at ?? null;

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto flex max-w-3xl flex-col gap-4 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <ResultsTabs tab={tab} onChange={setTab} responseCount={summary.response_count} />
          {/* Sits on the tab row so it's visible from both sub-tabs
              rather than only alongside the table. */}
          <Button
            onClick={() => exportCsv(formId, form.title)}
            disabled={exporting}
            className="flex items-center gap-1.5"
          >
            <Download className="h-4 w-4" />
            {exporting ? "Exporting…" : "Export CSV"}
          </Button>
        </div>

        {tab === "summary" ? (
          <>
            <SummaryHeader
              responseCount={summary.response_count}
              latestResponseAt={latestResponseAt}
            />
            <SummaryView summary={summary} liveQuestionIds={liveQuestionIds} />
          </>
        ) : (
          <ResponsesTable responses={responses} onView={setOpenResponseId} />
        )}

        <ResponseDetailModal
          responseId={openResponseId}
          onClose={() => setOpenResponseId(null)}
        />
      </div>
    </div>
  );
}
