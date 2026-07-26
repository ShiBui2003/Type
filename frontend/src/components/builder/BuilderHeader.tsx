"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { useFormBuilder } from "@/context/FormBuilderContext";
import { useToast } from "@/components/ui/ToastProvider";
import { Button } from "@/components/ui/Button";
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
  const isResultsTab = pathname?.endsWith("/results") ?? false;
  const isBuildTab = !isSettingsTab && !isResultsTab;
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
    <header className="flex flex-col gap-3 border-b border-ink-faint bg-surface-canvas px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <Link href="/" className="shrink-0 text-sm text-ink-muted hover:underline">
          ← All forms
        </Link>
        <input
          value={form.title}
          onChange={(e) => patchForm({ title: e.target.value })}
          aria-label="Form title"
          className="min-w-0 flex-1 border-none bg-transparent text-lg font-normal text-ink outline-none"
        />
        <span className="shrink-0 text-xs text-ink-muted" aria-live="polite">
          {SAVE_LABEL[saveStatus]}
        </span>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <nav className="flex overflow-hidden rounded-md border border-ink-faint text-sm text-ink-muted">
          <Link
            href={`/forms/${formId}`}
            className={`px-3 py-1.5 transition-colors duration-200 ease-tf ${isBuildTab ? "bg-ink text-white" : ""}`}
          >
            Build
          </Link>
          <Link
            href={`/forms/${formId}/results`}
            className={`px-3 py-1.5 transition-colors duration-200 ease-tf ${isResultsTab ? "bg-ink text-white" : ""}`}
          >
            Results
          </Link>
          <Link
            href={`/forms/${formId}/settings`}
            className={`px-3 py-1.5 transition-colors duration-200 ease-tf ${isSettingsTab ? "bg-ink text-white" : ""}`}
          >
            Settings
          </Link>
        </nav>
        <Button onClick={handlePublishToggle} disabled={busy}>
          {isPublished ? "Unpublish" : "Publish"}
        </Button>
      </div>

      {form.slug && (
        <ShareLinkModal
          isOpen={shareOpen}
          onClose={() => setShareOpen(false)}
          slug={form.slug}
          title={form.title}
        />
      )}
    </header>
  );
}
