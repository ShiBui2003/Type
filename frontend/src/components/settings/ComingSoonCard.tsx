import type { LucideIcon } from "lucide-react";

// Generic stub card, instantiated 5x (logic jumps, integrations/webhooks,
// team collaboration, file upload, payment question types) - the brief
// explicitly permits these as stubs.
export function ComingSoonCard({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-md border border-dashed border-ink-faint p-4">
      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-ink-muted" aria-hidden="true" />
      <div>
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-ink">{title}</h3>
          <span className="rounded-full bg-surface-panel px-2 py-0.5 text-[10px] font-medium text-ink-muted">
            Coming soon
          </span>
        </div>
        <p className="mt-1 text-xs text-ink-muted">{description}</p>
      </div>
    </div>
  );
}
