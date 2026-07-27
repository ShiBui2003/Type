"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Eye, Monitor, Palette, Settings2, Smartphone, X } from "lucide-react";

import { useFormBuilder } from "@/context/FormBuilderContext";
import { ThemePicker } from "@/components/settings/ThemePicker";
import type { PreviewDevice } from "./LivePreviewPanel";
import { AddQuestionMenu } from "./AddQuestionMenu";

// Every control in this row does something real. Add content and Design
// reuse AddQuestionMenu/ThemePicker (self-contained already, so a second
// trigger needed no new logic); the device toggle resizes the preview
// canvas; Settings links to the Settings route.
//
// Preview opens the *actual* respondent experience at /f/{slug} in a new
// tab rather than a mock. That only exists once a form is published (the
// public API is slug-based and published-only), so on a draft the control
// is rendered disabled with an explanatory tooltip instead of appearing
// and disappearing as the status changes - a control that vanishes is
// harder to understand than one that explains why it's unavailable.
export function BuilderToolbar({
  device,
  onDeviceChange,
}: {
  device: PreviewDevice;
  onDeviceChange: (device: PreviewDevice) => void;
}) {
  const { addQuestion, formId, form } = useFormBuilder();
  const isMobile = device === "mobile";
  const previewSlug = form?.status === "published" ? form.slug : null;

  return (
    <div className="flex items-center gap-1 border-b border-ink-faint bg-surface-canvas px-4 py-2">
      <AddQuestionMenu
        variant="icon"
        onSelect={(entry) => addQuestion(entry.type, entry.variant)}
      />
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
      {previewSlug ? (
        <a
          href={`/f/${previewSlug}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Preview form"
          title="Preview the published form in a new tab"
          className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm text-ink-muted transition-colors duration-200 ease-tf hover:bg-surface-panel hover:text-ink"
        >
          <Eye className="h-4 w-4" />
        </a>
      ) : (
        <button
          type="button"
          disabled
          aria-label="Preview form"
          title="Publish this form to preview it"
          className="flex cursor-not-allowed items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm text-ink-muted opacity-40"
        >
          <Eye className="h-4 w-4" />
        </button>
      )}
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
