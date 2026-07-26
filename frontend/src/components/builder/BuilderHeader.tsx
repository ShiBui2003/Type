"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { useFormBuilder } from "@/context/FormBuilderContext";
import { useToast } from "@/components/ui/ToastProvider";
import { ShareLinkModal } from "@/components/ui/ShareLinkModal";
import * as formsApi from "@/lib/api/forms";

const SAVE_LABEL: Record<string, string> = {
  idle: "",
  saving: "Saving…",
  saved: "Saved",
  error: "Couldn't save",
};

// Rename is inline-editable text (same 800ms-autosave pattern as every
// other field), not a modal - the brief names exactly four Modal uses
// and rename isn't one of them. Unpublish is a single click + toast for
// the same reason.
export function BuilderHeader() {
  const { form, formId, saveStatus, patchForm, setForm } = useFormBuilder();
  const pathname = usePathname();
  const { showToast } = useToast();
  const [shareOpen, setShareOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!form) return null;

  const isSettingsTab = pathname?.endsWith("/settings") ?? false;
  const isPublished = form.status === "published";

  async function handlePublishToggle() {
    setBusy(true);
    try {
      if (isPublished) {
        const updated = await formsApi.unpublishForm(formId);
        setForm(updated);
        showToast("Form unpublished");
      } else {
        const updated = await formsApi.publishForm(formId);
        setForm(updated);
        setShareOpen(true);
        showToast("Form published");
      }
    } catch {
      showToast("Something went wrong", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <header className="flex flex-col gap-3 border-b border-zinc-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800">
      <div className="flex min-w-0 items-center gap-3">
        <Link href="/" className="shrink-0 text-sm text-zinc-500 hover:underline">
          ← All forms
        </Link>
        <input
          value={form.title}
          onChange={(e) => patchForm({ title: e.target.value })}
          aria-label="Form title"
          className="min-w-0 flex-1 border-none bg-transparent text-lg font-semibold outline-none"
        />
        <span className="shrink-0 text-xs text-zinc-400" aria-live="polite">
          {SAVE_LABEL[saveStatus]}
        </span>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <nav className="flex overflow-hidden rounded-md border border-zinc-200 text-sm dark:border-zinc-700">
          <Link
            href={`/forms/${formId}`}
            className={`px-3 py-1.5 transition-colors duration-200 ease-tf ${!isSettingsTab ? "bg-ink text-white" : ""}`}
          >
            Build
          </Link>
          <Link
            href={`/forms/${formId}/settings`}
            className={`px-3 py-1.5 transition-colors duration-200 ease-tf ${isSettingsTab ? "bg-ink text-white" : ""}`}
          >
            Settings
          </Link>
        </nav>
        <button
          onClick={handlePublishToggle}
          disabled={busy}
          className="rounded-md bg-ink px-3 py-1.5 text-sm font-medium text-white transition-colors duration-200 ease-tf hover:bg-ink-soft disabled:opacity-50"
        >
          {isPublished ? "Unpublish" : "Publish"}
        </button>
      </div>

      {form.slug && (
        <ShareLinkModal isOpen={shareOpen} onClose={() => setShareOpen(false)} slug={form.slug} />
      )}
    </header>
  );
}
