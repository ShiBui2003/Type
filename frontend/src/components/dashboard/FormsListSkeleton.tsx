// Loading placeholder for the dashboard. Deliberately mirrors the real
// layout below it - same page shell, same workspace bar, same card
// dimensions and internal rows - so nothing jumps when the data lands.
// Blocks are tinted with the ink token at low opacity rather than a
// generic grey, and pulse instead of spinning.
export function FormsListSkeleton() {
  return (
    <div className="min-h-screen bg-surface-page" role="status" aria-busy="true">
      <span className="sr-only">Loading forms…</span>
      <div className="mx-auto flex max-w-4xl animate-pulse flex-col gap-4 p-6">
        {/* workspace bar */}
        <div className="flex items-center justify-between rounded-md bg-surface-canvas px-4 py-2.5 shadow-ring-sm">
          <Block className="h-4 w-28" />
          <div className="flex items-center gap-2">
            {/* 34px matches the real sort control / view toggle height
                (text-sm line + py-1.5 + 1px border), so the bar is the
                same height here as it is once loaded. */}
            <Block className="h-8.5 w-44 rounded-md" />
            <Block className="h-8.5 w-28 rounded-md" />
          </div>
        </div>

        {/* "Your forms" + New form */}
        <div className="flex items-center justify-between">
          <Block className="h-6 w-32" />
          <Block className="h-8 w-28 rounded-md" />
        </div>

        {/* card grid - two cards, matching the seeded default */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    </div>
  );
}

// Same shell as FormCard: rounded-md, canvas background, p-4, gap-2.
function CardSkeleton() {
  return (
    <div className="flex flex-col gap-2 rounded-md bg-surface-canvas p-4">
      <div className="flex items-start justify-between gap-2">
        <Block className="h-5 w-40" />
        <Block className="h-4 w-4 shrink-0" />
      </div>
      <div className="flex items-center gap-2">
        <Block className="h-4 w-20 rounded-full" />
        <Block className="h-3 w-24" />
      </div>
      <div className="flex items-center gap-3">
        <Block className="h-4 w-24" />
        <Block className="h-4 w-16" />
      </div>
    </div>
  );
}

function Block({ className = "" }: { className?: string }) {
  return <div className={`rounded bg-ink/10 ${className}`} aria-hidden="true" />;
}
