"use client";

import { useEffect, useRef } from "react";
import { Clock } from "lucide-react";

import { useFormBuilder } from "@/context/FormBuilderContext";
import { QuestionPreview } from "@/components/preview/QuestionPreview";
import { DEFAULT_THEME_KEY, THEME_PRESETS } from "@/lib/constants";

export type PreviewDevice = "mobile" | "desktop";

// Measured mobile canvas (361x643, border-radius 0, hairline ring). The
// desktop size isn't a measured value - it's our own reasonable wider
// canvas for the device toggle, capped so it degrades instead of
// overflowing the center column on narrow windows.
const CANVAS = {
  mobile: "h-[643px] w-[361px]",
  desktop: "h-[520px] w-full max-w-[760px]",
} satisfies Record<PreviewDevice, string>;

export function LivePreviewPanel({ device = "mobile" }: { device?: PreviewDevice }) {
  const { form, selectedQuestionId } = useFormBuilder();
  const question = form?.questions.find((q) => q.id === selectedQuestionId);

  const themeKey = (form?.theme_json?.preset as string | undefined) ?? DEFAULT_THEME_KEY;
  const preset = THEME_PRESETS.find((t) => t.key === themeKey) ?? THEME_PRESETS[0];

  return (
    <div className="flex h-full items-center justify-center overflow-y-auto bg-surface-panel p-8">
      {/* Fixed mobile-proportioned canvas by default, not a flat full-
          width panel and not a rounded phone-mockup card - real Typeform
          measures this at border-radius: 0, separated from the page by a
          hairline ring-shadow rather than a visible border. The card's
          own background is the form's respondent-facing theme
          (--form-bg), not builder chrome, and font-inter here since this
          content is respondent-facing (same font /f/[slug] uses) -
          admin chrome around it stays system-font. */}
      <div
        className={`font-inter flex flex-col justify-center overflow-y-auto p-8 shadow-hairline transition-[width,height] duration-300 ease-tf ${CANVAS[device]}`}
        style={{ ...preset.vars, backgroundColor: "var(--form-bg)" } as React.CSSProperties}
      >
        {question ? <QuestionPreview question={question} /> : <WelcomeScreenEditor />}
      </div>
    </div>
  );
}

// The welcome screen is edited in place on the canvas - clicking the
// heading puts a cursor in the real preview rather than focusing a
// separate side-panel field, which is how the actual Typeform builder
// works. These are transparent inputs styled to inherit the canvas's
// theme typography, not contentEditable: with contentEditable, React
// re-rendering the node from state fights the browser's own cursor
// position (caret jumps to the end mid-word). An input has no such
// conflict and gives the same in-place editing feel.
//
// Writes go through the same patchForm + 800ms debounced autosave the
// side panel uses, so there's one save path, not two.
function WelcomeScreenEditor() {
  const { form, patchForm } = useFormBuilder();
  if (!form) return null;

  return (
    <div className="text-center">
      <AutoGrowTextarea
        value={form.welcome_title ?? ""}
        onChange={(value) => patchForm({ welcome_title: value })}
        // Empty welcome_title falls back to the form title at respondent
        // time (see WelcomeScreen), so that's what the placeholder shows
        // - the preview keeps telling the truth about what respondents
        // will actually see.
        placeholder={form.title || "Welcome"}
        ariaLabel="Welcome screen title"
        className="text-xl font-semibold"
      />
      <AutoGrowTextarea
        value={form.welcome_description ?? ""}
        onChange={(value) => patchForm({ welcome_description: value })}
        placeholder="Add a description (optional)"
        ariaLabel="Welcome screen description"
        className="mt-2 text-sm opacity-70"
      />
      <button
        type="button"
        className="mx-auto mt-6 block rounded-full px-6 py-2 text-sm font-medium"
        style={{ background: "var(--form-fg)", color: "var(--form-bg)" }}
      >
        Start
      </button>
      <p className="mt-3 flex items-center justify-center gap-1 text-xs opacity-60">
        <Clock className="h-3 w-3" />
        {/* Rough client-side estimate for display only, not stored data. */}
        Takes {Math.max(1, Math.ceil(form.questions.length / 4))} min
      </p>
    </div>
  );
}

function AutoGrowTextarea({
  value,
  onChange,
  placeholder,
  ariaLabel,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  ariaLabel: string;
  className: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  // Height follows content so a long title wraps instead of scrolling
  // inside a fixed-height box. Runs on every render because the value can
  // change from outside this component (e.g. the header's title field
  // feeding the placeholder).
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  });

  return (
    <textarea
      ref={ref}
      rows={1}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      aria-label={ariaLabel}
      spellCheck={false}
      className={`w-full resize-none overflow-hidden border-0 bg-transparent p-0 text-center outline-none placeholder:opacity-40 ${className}`}
    />
  );
}
