"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";

import * as formsApi from "@/lib/api/forms";
import type { FormListItem } from "@/lib/types";
import { CreateFormModal } from "./CreateFormModal";
import { FormCard } from "./FormCard";

export function FormsList() {
  const [forms, setForms] = useState<FormListItem[] | null>(null);
  const [error, setError] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
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
      <div className="flex flex-col items-center gap-3 p-16 text-center">
        <p className="text-zinc-500">Couldn&apos;t reach the server.</p>
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
    return <div className="p-6 text-zinc-400">Loading forms…</div>;
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Your forms</h1>
        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-1 rounded-md bg-ink px-3 py-1.5 text-sm text-white transition-colors duration-200 ease-tf hover:bg-ink-soft"
        >
          <Plus className="h-4 w-4" /> New form
        </button>
      </div>

      {forms.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-md border border-dashed border-zinc-300 py-16 text-center dark:border-zinc-700">
          <p className="text-zinc-500">No forms yet.</p>
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
  );
}
