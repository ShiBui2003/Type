"use client";

import { useFormBuilder } from "@/context/FormBuilderContext";

// Fully wired - feeds the real respondent thank-you screen once Phase 3
// builds it, not a placeholder.
export function ThankYouEditor() {
  const { form, patchForm } = useFormBuilder();
  if (!form) return null;

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold text-ink">Thank you screen</h2>
      <div>
        <label className="mb-1 block text-xs font-medium text-ink-muted">Title</label>
        <input
          value={form.thank_you_title ?? ""}
          onChange={(e) => patchForm({ thank_you_title: e.target.value })}
          placeholder="Thanks for completing this form!"
          className="w-full rounded border border-ink-faint px-3 py-2 text-sm text-ink"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-ink-muted">Description</label>
        <textarea
          value={form.thank_you_description ?? ""}
          onChange={(e) => patchForm({ thank_you_description: e.target.value })}
          rows={2}
          placeholder="We appreciate your time."
          className="w-full resize-none rounded border border-ink-faint px-3 py-2 text-sm text-ink"
        />
      </div>
    </div>
  );
}
