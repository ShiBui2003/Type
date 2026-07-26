"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Copy, MoreVertical, Trash2 } from "lucide-react";

import { ShareLinkModal } from "@/components/ui/ShareLinkModal";
import { useToast } from "@/components/ui/ToastProvider";
import * as formsApi from "@/lib/api/forms";
import { createKeyedDebouncer } from "@/lib/debounce";
import type { FormListItem } from "@/lib/types";
import { DeleteFormModal } from "./DeleteFormModal";

const AUTOSAVE_DELAY_MS = 800;

export function FormCard({ form, onChanged }: { form: FormListItem; onChanged: () => void }) {
  const { showToast } = useToast();
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
    <div className="flex flex-col gap-2 rounded-md border border-zinc-200 p-4 dark:border-zinc-800">
      <div className="flex items-start justify-between gap-2">
        <input
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          aria-label="Form title"
          className="min-w-0 flex-1 border-none bg-transparent font-medium outline-none"
        />
        <div className="relative shrink-0">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Form actions"
            className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 z-10 mt-1 w-40 rounded-md border border-zinc-200 bg-white py-1 text-sm shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
              <button
                onClick={handleDuplicate}
                className="flex w-full items-center gap-2 px-3 py-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <Copy className="h-3.5 w-3.5" /> Duplicate
              </button>
              <button
                onClick={() => {
                  setDeleteOpen(true);
                  setMenuOpen(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-red-600 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs">
        <span
          className={`rounded-full px-2 py-0.5 ${
            form.status === "published"
              ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400"
              : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
          }`}
        >
          {form.status === "published" ? "Published" : "Draft"}
        </span>
        <span className="text-zinc-400">
          {form.response_count} response{form.response_count === 1 ? "" : "s"}
        </span>
      </div>

      <div className="flex items-center gap-3 text-sm">
        <Link href={`/forms/${form.id}`} className="text-blue-600 hover:underline">
          Open builder
        </Link>
        {form.status === "published" && form.slug && (
          <button onClick={() => setShareOpen(true)} className="text-zinc-500 hover:underline">
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
        <ShareLinkModal isOpen={shareOpen} onClose={() => setShareOpen(false)} slug={form.slug} />
      )}
    </div>
  );
}
