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
    <div className="flex items-start gap-3 rounded-md border border-dashed border-zinc-300 p-4 dark:border-zinc-700">
      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-zinc-400" aria-hidden="true" />
      <div>
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium">{title}</h3>
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-500 dark:bg-zinc-800">
            Coming soon
          </span>
        </div>
        <p className="mt-1 text-xs text-zinc-500">{description}</p>
      </div>
    </div>
  );
}
