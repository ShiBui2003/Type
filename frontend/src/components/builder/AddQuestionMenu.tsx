"use client";

import { useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";

import { QUESTION_TYPES } from "@/lib/constants";
import { QuestionTypeIcon } from "@/components/ui/QuestionTypeIcon";
import type { QuestionType } from "@/lib/types";

// Exactly the 8 types from the brief - Yes/No is not a 9th tile here,
// it's a toggle on multiple_choice questions in QuestionEditorPanel.
//
// variant "full" (default) is the labelled "+ Add question" pill at the
// bottom of the Pages list. variant "icon" is a bare icon button for the
// toolbar's "Add content" entry point - same dropdown, same onSelect,
// just a different trigger so each can sit naturally where it's used
// without one popover needing two different anchor positions.
export function AddQuestionMenu({
  onSelect,
  variant = "full",
}: {
  onSelect: (type: QuestionType) => void;
  variant?: "full" | "icon";
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      {variant === "icon" ? (
        <button
          onClick={() => setOpen((o) => !o)}
          aria-label="Add content"
          title="Add content"
          className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm text-ink-muted transition-colors duration-200 ease-tf hover:bg-surface-panel hover:text-ink"
        >
          <Plus className="h-4 w-4" />
        </button>
      ) : (
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-zinc-300 px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
        >
          <Plus className="h-4 w-4" /> Add question
        </button>
      )}
      {open && (
        <div className="absolute left-0 z-10 mt-2 grid w-64 grid-cols-2 gap-1 rounded-md bg-surface-panel p-2 shadow-ring">
          {QUESTION_TYPES.map((meta) => (
            <button
              key={meta.type}
              onClick={() => {
                onSelect(meta.type);
                setOpen(false);
              }}
              className="flex flex-col items-center gap-1 rounded p-2 text-xs text-ink transition-colors duration-200 ease-tf hover:bg-surface-canvas"
            >
              <QuestionTypeIcon type={meta.type} className="h-5 w-5" />
              {meta.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
