"use client";

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
      {/* Fixed-width, mobile-proportioned card, not a flat full-width
          panel - matches the real builder's centered canvas mock rather
          than stretching to fill the column. The card's own background
          is the form's respondent-facing theme (--form-bg), not our
          builder chrome color, since this is a preview of what a
          respondent actually sees. */}
      <div
        className="flex min-h-150 w-full max-w-95 flex-col justify-center overflow-y-auto rounded-lg p-8 shadow-ring"
        style={{ ...preset.vars, backgroundColor: "var(--form-bg)" } as React.CSSProperties}
      >
        {question ? (
          <QuestionPreview question={question} />
        ) : (
          <p className="text-center text-zinc-400">Select a question to preview it</p>
        )}
      </div>
    </div>
  );
}
