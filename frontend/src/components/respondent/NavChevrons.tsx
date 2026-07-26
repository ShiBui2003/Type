"use client";

import { ChevronDown, ChevronUp } from "lucide-react";

import { useRespondentFlow } from "@/context/RespondentFlowContext";

// Persistent, not stripped on mobile (addendum B) - only the advance
// button's keyboard hint gets hidden on small viewports, since these
// chevrons are the touch-friendly nav affordance mobile actually needs.
export function NavChevrons() {
  const { form, currentIndex, status, goNext, goBack } = useRespondentFlow();
  if (!form || currentIndex < 0 || status === "submitted") return null;

  const total = form.questions.length;
  const canGoBack = currentIndex > 0;

  return (
    <div
      className="fixed bottom-4 left-3 flex flex-col items-center gap-2 sm:bottom-6 sm:left-6"
      style={{ color: "var(--form-fg)" }}
    >
      <button
        type="button"
        aria-label="Previous question"
        onClick={goBack}
        disabled={!canGoBack}
        className="flex h-8 w-8 items-center justify-center rounded-tl-sm rounded-bl-sm rounded-tr-md rounded-br-md bg-current/10 transition-opacity duration-200 ease-tf hover:bg-current/20 disabled:opacity-30"
      >
        <ChevronUp className="h-4 w-4" />
      </button>
      <button
        type="button"
        aria-label="Next question"
        onClick={goNext}
        className="flex h-8 w-8 items-center justify-center rounded-tl-sm rounded-bl-sm rounded-tr-md rounded-br-md bg-current/10 transition-opacity duration-200 ease-tf hover:bg-current/20"
      >
        <ChevronDown className="h-4 w-4" />
      </button>
      <span className="mt-1 text-xs opacity-60">
        {currentIndex + 1} of {total}
      </span>
    </div>
  );
}
