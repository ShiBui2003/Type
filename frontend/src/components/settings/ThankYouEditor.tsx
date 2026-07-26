"use client";

import { useFormBuilder } from "@/context/FormBuilderContext";

// Fully wired - feeds the real respondent thank-you screen once Phase 3
// builds it, not a placeholder.
export function ThankYouEditor() {
  const { form, patchForm } = useFormBuilder();
  if (!form) return null;

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Thank you screen</h2>
      <div>
        <label className="mb-1 block text-xs font-medium text-zinc-500">Title</label>
        <input
          value={form.thank_you_title ?? ""}
          onChange={(e) => patchForm({ thank_you_title: e.target.value })}
          placeholder="Thanks for completing this form!"
          className="w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-zinc-500">Description</label>
        <textarea
          value={form.thank_you_description ?? ""}
          onChange={(e) => patchForm({ thank_you_description: e.target.value })}
          rows={2}
          placeholder="We appreciate your time."
          className="w-full resize-none rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
        />
      </div>
    </div>
  );
}
