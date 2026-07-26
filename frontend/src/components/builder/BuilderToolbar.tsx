"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Monitor, Palette, Settings2, Smartphone, X } from "lucide-react";

import { useFormBuilder } from "@/context/FormBuilderContext";
import { ThemePicker } from "@/components/settings/ThemePicker";
import type { QuestionType } from "@/lib/types";
import type { PreviewDevice } from "./LivePreviewPanel";
import { AddQuestionMenu } from "./AddQuestionMenu";

// Every control in this row does something real. Add content and Design
// reuse AddQuestionMenu/ThemePicker (self-contained already, so a second
// trigger needed no new logic); the device toggle resizes the preview
// canvas; Settings links to the Settings route.
//
// A full-screen Preview button used to sit here as an inert placeholder
// and was removed rather than left dead: the brief's "live preview of the
// form" is already satisfied by the always-visible canvas that updates
// per keystroke, and a true full preview of an *unpublished* form would
// need a new backend endpoint (the public one is slug-based and
// published-only). Published forms are already previewable end to end via
// the share link.
export function BuilderToolbar({
  device,
  onDeviceChange,
}: {
  device: PreviewDevice;
  onDeviceChange: (device: PreviewDevice) => void;
}) {
  const { addQuestion, formId } = useFormBuilder();
  const isMobile = device === "mobile";

  return (
    <div className="flex items-center gap-1 border-b border-ink-faint bg-surface-canvas px-4 py-2">
      <AddQuestionMenu variant="icon" onSelect={(type: QuestionType) => addQuestion(type)} />
      <DesignPopover />
      <button
        onClick={() => onDeviceChange(isMobile ? "desktop" : "mobile")}
        aria-label={isMobile ? "Switch to desktop preview" : "Switch to mobile preview"}
        title={isMobile ? "Switch to desktop preview" : "Switch to mobile preview"}
        aria-pressed={!isMobile}
        className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm text-ink-muted transition-colors duration-200 ease-tf hover:bg-surface-panel hover:text-ink"
      >
        {isMobile ? <Smartphone className="h-4 w-4" /> : <Monitor className="h-4 w-4" />}
      </button>
      <div className="flex-1" />
      <Link
        href={`/forms/${formId}/settings`}
        aria-label="Settings"
        title="Settings"
        className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm text-ink-muted transition-colors duration-200 ease-tf hover:bg-surface-panel hover:text-ink"
      >
        <Settings2 className="h-4 w-4" />
      </Link>
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
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-ink">Design</span>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="text-ink-muted hover:text-ink"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          {/* No "My themes"/"Gallery" tabs here - we only have one
              preset gallery, no saved-custom-themes feature to put in a
              second tab. */}
          <ThemePicker showHeading={false} />
        </div>
      )}
    </div>
  );
}
