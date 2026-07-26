"use client";

import { Clock } from "lucide-react";

import { useFormBuilder } from "@/context/FormBuilderContext";
import { QuestionPreview } from "@/components/preview/QuestionPreview";
import { DEFAULT_THEME_KEY, THEME_PRESETS } from "@/lib/constants";

export function LivePreviewPanel() {
  const { form, selectedQuestionId } = useFormBuilder();
  const question = form?.questions.find((q) => q.id === selectedQuestionId);

  const themeKey = (form?.theme_json?.preset as string | undefined) ?? DEFAULT_THEME_KEY;
  const preset = THEME_PRESETS.find((t) => t.key === themeKey) ?? THEME_PRESETS[0];

  return (
    <div className="flex h-full items-center justify-center overflow-y-auto bg-surface-panel p-8">
      {/* Fixed 361x643px mobile-proportioned canvas, not a flat full-
          width panel and not a rounded phone-mockup card - real Typeform
          measures this at border-radius: 0, separated from the page by a
          hairline ring-shadow rather than a visible border. The card's
          own background is the form's respondent-facing theme
          (--form-bg), not builder chrome, and font-inter here since this
          content is respondent-facing (same font /f/[slug] will use once
          Phase 3 builds it) - admin chrome around it stays system-font. */}
      <div
        className="font-inter flex h-[643px] w-[361px] flex-col justify-center overflow-y-auto p-8 shadow-hairline"
        style={{ ...preset.vars, backgroundColor: "var(--form-bg)" } as React.CSSProperties}
      >
        {question ? (
          <QuestionPreview question={question} />
        ) : (
          // Welcome-screen preview only - there's no welcome-screen
          // EDITOR yet (deferred per the brief's own scope-control
          // note), so this shows what the first screen will look like
          // using the form's title as a placeholder, but nothing here is
          // editable yet. "Takes ~N minutes" is a rough client-side
          // estimate for display purposes, not stored/real data.
          <div className="text-center">
            <h2 className="text-xl font-semibold">{form?.title || "Welcome"}</h2>
            <button
              type="button"
              className="mx-auto mt-6 block rounded-full px-6 py-2 text-sm font-medium"
              style={{ background: "var(--form-fg)", color: "var(--form-bg)" }}
            >
              Start
            </button>
            <p className="mt-3 flex items-center justify-center gap-1 text-xs opacity-60">
              <Clock className="h-3 w-3" />
              Takes {Math.max(1, Math.ceil((form?.questions.length ?? 0) / 4))} min
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
