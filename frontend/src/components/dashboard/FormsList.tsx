"use client";

import { useEffect, useState } from "react";
import { LayoutGrid, List as ListIcon, Plus } from "lucide-react";

import * as formsApi from "@/lib/api/forms";
import type { FormListItem } from "@/lib/types";
import { CreateFormModal } from "./CreateFormModal";
import { FormCard } from "./FormCard";

export function FormsList() {
  const [forms, setForms] = useState<FormListItem[] | null>(null);
  const [error, setError] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  // Grid is the only view that actually renders differently - List is a
  // plain visual toggle, matched to the real Typeform workspace header
  // enough to read as a real workspace rather than a floating card grid.
  const [view, setView] = useState<"list" | "grid">("grid");
  // Bumping this re-runs the effect below - lets duplicate/delete/retry
  // trigger a refetch without the effect body delegating to an external
  // function that itself calls setState.
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    formsApi
      .listForms()
      .then((data) => {
        if (cancelled) return;
        setForms(data);
        setError(false);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  function refetch() {
    setRefreshKey((key) => key + 1);
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center gap-3 bg-surface-page p-16 text-center">
        <p className="text-ink-muted">Couldn&apos;t reach the server.</p>
        <button
          onClick={refetch}
          className="rounded-md bg-ink px-4 py-2 text-sm text-white transition-colors duration-200 ease-tf hover:bg-ink-soft"
        >
          Retry
        </button>
      </div>
    );
  }

  if (forms === null) {
    return <div className="min-h-screen bg-surface-page p-6 text-ink-muted">Loading forms…</div>;
  }

  return (
    <div className="min-h-screen bg-surface-page">
      <div className="mx-auto flex max-w-4xl flex-col gap-4 p-6">
        <div className="flex items-center justify-between rounded-md bg-surface-canvas px-4 py-2.5 shadow-ring-sm">
          <span className="text-sm font-medium text-ink">My workspace</span>
          <div className="flex overflow-hidden rounded-md border border-ink-faint text-sm">
            <button
              onClick={() => setView("list")}
              aria-label="List view"
              aria-pressed={view === "list"}
              className={`flex items-center gap-1.5 px-3 py-1.5 transition-colors duration-200 ease-tf ${
                view === "list" ? "bg-ink text-white" : "text-ink-muted hover:bg-surface-panel"
              }`}
            >
              <ListIcon className="h-3.5 w-3.5" /> List
            </button>
            <button
              onClick={() => setView("grid")}
              aria-label="Grid view"
              aria-pressed={view === "grid"}
              className={`flex items-center gap-1.5 px-3 py-1.5 transition-colors duration-200 ease-tf ${
                view === "grid" ? "bg-ink text-white" : "text-ink-muted hover:bg-surface-panel"
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" /> Grid
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <h1 className="text-xl font-normal text-ink">Your forms</h1>
          <button
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-1 rounded-md bg-ink px-3 py-1.5 text-sm text-white transition-colors duration-200 ease-tf hover:bg-ink-soft"
          >
            <Plus className="h-4 w-4" /> New form
          </button>
        </div>

        {forms.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-md border border-dashed border-ink-faint py-16 text-center">
            <p className="text-ink-muted">No forms yet.</p>
            <button
              onClick={() => setCreateOpen(true)}
              className="rounded-md bg-ink px-4 py-2 text-sm text-white transition-colors duration-200 ease-tf hover:bg-ink-soft"
            >
              Create your first form
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {forms.map((form) => (
              <FormCard key={form.id} form={form} onChanged={refetch} />
            ))}
          </div>
        )}

        <CreateFormModal isOpen={createOpen} onClose={() => setCreateOpen(false)} />
      </div>
    </div>
  );
}
