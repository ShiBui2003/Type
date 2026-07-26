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
    <div
      className="flex h-full items-center justify-center overflow-y-auto p-8"
      // CSS custom properties on this wrapper, never :root, so one
      // form's theme never leaks into another form's preview.
      style={{ ...preset.vars, backgroundColor: "var(--form-bg)" } as React.CSSProperties}
    >
      {question ? (
        <div className="w-full max-w-md">
          <QuestionPreview question={question} />
        </div>
      ) : (
        <p className="text-zinc-400">Select a question to preview it</p>
      )}
    </div>
  );
}
