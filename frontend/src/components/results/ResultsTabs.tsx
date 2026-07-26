"use client";

export type ResultsTab = "summary" | "responses";

// Same segmented style as the Build/Results/Settings nav in
// BuilderHeader, but buttons (local state), not links - the sub-tab
// isn't a route.
export function ResultsTabs({
  tab,
  onChange,
  responseCount,
}: {
  tab: ResultsTab;
  onChange: (tab: ResultsTab) => void;
  responseCount: number;
}) {
  const base = "px-3 py-1.5 transition-colors duration-200 ease-tf";
  return (
    <div className="flex w-fit overflow-hidden rounded-md border border-ink-faint text-sm text-ink-muted">
      <button
        type="button"
        onClick={() => onChange("summary")}
        className={`${base} ${tab === "summary" ? "bg-ink text-white" : ""}`}
      >
        Summary
      </button>
      <button
        type="button"
        onClick={() => onChange("responses")}
        className={`${base} ${tab === "responses" ? "bg-ink text-white" : ""}`}
      >
        Responses ({responseCount})
      </button>
    </div>
  );
}
