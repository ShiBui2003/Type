"use client";

import { useEffect, useRef, useState } from "react";
import { Eye, Palette, Settings2, Smartphone, type LucideIcon } from "lucide-react";

import { useFormBuilder } from "@/context/FormBuilderContext";
import { ThemePicker } from "@/components/settings/ThemePicker";
import type { QuestionType } from "@/lib/types";
import { AddQuestionMenu } from "./AddQuestionMenu";

// Add content and Design are wired to the exact same functionality
// already built for the Pages list and the Settings page respectively -
// AddQuestionMenu and ThemePicker are both self-contained components, so
// reusing them here (with a different trigger/anchor) needed no new
// logic, just a second place to render them. Device toggle and Preview
// stay inert placeholders - not in the brief, not worth building.
export function BuilderToolbar() {
  const { addQuestion } = useFormBuilder();

  return (
    <div className="flex items-center gap-1 border-b border-ink-faint bg-surface-canvas px-4 py-2">
      <AddQuestionMenu variant="icon" onSelect={(type: QuestionType) => addQuestion(type)} />
      <DesignPopover />
      <ToolbarButton icon={Smartphone} label="Desktop view" />
      <ToolbarButton icon={Eye} label="Preview" />
      <div className="flex-1" />
      <ToolbarButton icon={Settings2} label="Settings" />
    </div>
  );
}

function DesignPopover() {
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
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Design"
        title="Design"
        className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm text-ink-muted transition-colors duration-200 ease-tf hover:bg-surface-panel hover:text-ink"
      >
        <Palette className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute left-0 z-10 mt-2 w-72 rounded-md bg-surface-panel p-3 shadow-ring">
          <ThemePicker />
        </div>
      )}
    </div>
  );
}

function ToolbarButton({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <button
      aria-label={label}
      title={label}
      className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm text-ink-muted transition-colors duration-200 ease-tf hover:bg-surface-panel hover:text-ink"
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
