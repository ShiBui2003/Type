"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Copy, Download, MoreVertical, Trash2 } from "lucide-react";

import { ShareLinkModal } from "@/components/ui/ShareLinkModal";
import { useToast } from "@/components/ui/ToastProvider";
import * as formsApi from "@/lib/api/forms";
import { useExportCsv } from "@/lib/exportCsv";
import { createKeyedDebouncer } from "@/lib/debounce";
import type { FormListItem } from "@/lib/types";
import { DeleteFormModal } from "./DeleteFormModal";

const AUTOSAVE_DELAY_MS = 800;

export function FormCard({ form, onChanged }: { form: FormListItem; onChanged: () => void }) {
  const { showToast } = useToast();
  const { exportCsv, exporting } = useExportCsv();
  const [title, setTitle] = useState(form.title);
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  // Standalone debounce here (not FormBuilderContext's) - the dashboard
  // list isn't wrapped in a per-form builder context, so this rename
  // field needs its own debounced-save, built on the same shared
  // primitive (lib/debounce.ts) rather than a second hand-rolled timer.
  const debouncer = useRef(createKeyedDebouncer(AUTOSAVE_DELAY_MS));

  function handleTitleChange(value: string) {
    setTitle(value);
    debouncer.current("rename", () => {
      formsApi.updateForm(form.id, { title: value }).catch(() => {
        showToast("Couldn't rename form", "error");
      });
    });
  }

  async function handleDuplicate() {
    setMenuOpen(false);
    try {
      await formsApi.duplicateForm(form.id);
      showToast("Form duplicated");
      onChanged();
    } catch {
      showToast("Couldn't duplicate form", "error");
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-md bg-surface-canvas p-4">
      <div className="flex items-start justify-between gap-2">
        <input
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          aria-label="Form title"
          className="min-w-0 flex-1 border-none bg-transparent font-normal text-ink outline-none"
        />
        <div className="relative shrink-0">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Form actions"
            className="text-ink-muted hover:text-ink"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 z-10 mt-1 w-40 rounded-md bg-surface-panel py-1 text-sm shadow-ring">
              <button
                onClick={handleDuplicate}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-ink hover:bg-surface-canvas"
              >
                <Copy className="h-3.5 w-3.5" /> Duplicate
              </button>
              {/* Same useExportCsv hook the Results view uses - one
                  implementation, a second entry point, so exporting from
                  here can't drift from exporting from there. */}
              <button
                onClick={() => {
                  setMenuOpen(false);
                  exportCsv(form.id, form.title);
                }}
                disabled={exporting}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-ink hover:bg-surface-canvas disabled:opacity-50"
              >
                <Download className="h-3.5 w-3.5" /> Export CSV
              </button>
              <button
                onClick={() => {
                  setDeleteOpen(true);
                  setMenuOpen(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-red-600 hover:bg-surface-canvas"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs">
        {/* Both states get a pill so status is legible to someone who has
            never used this app (the brief asks the list to show
            draft/published). Draft's is deliberately muted - neutral
            surface, no color - so Published stays the only thing that
            draws the eye, which is how real Typeform weights it.
            The count shows on both: a draft can hold a real historical
            count (published -> collected responses -> unpublished), and
            hiding it there would lose information the brief asks the
            list to show. */}
        {form.status === "published" ? (
          <span className="rounded-full bg-green-100 px-2 py-0.5 text-green-700">Published</span>
        ) : (
          <span className="rounded-full bg-surface-panel px-2 py-0.5 text-ink-muted">Draft</span>
        )}
        <span className="text-ink-muted">
          {form.response_count} response{form.response_count === 1 ? "" : "s"}
        </span>
      </div>

      <div className="flex items-center gap-3 text-sm">
        <Link href={`/forms/${form.id}`} className="text-ink hover:underline">
          Open builder
        </Link>
        {form.status === "published" && form.slug && (
          <button onClick={() => setShareOpen(true)} className="text-ink-muted hover:underline">
            Share link
          </button>
        )}
      </div>

      <DeleteFormModal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        form={form}
        onDeleted={onChanged}
      />
      {form.slug && (
        <ShareLinkModal
          isOpen={shareOpen}
          onClose={() => setShareOpen(false)}
          slug={form.slug}
          title={form.title}
        />
      )}
    </div>
  );
}
