"use client";

import { Clock } from "lucide-react";

import { useFormBuilder } from "@/context/FormBuilderContext";
import { InlineCanvasInput } from "@/components/preview/InlineCanvasInput";
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
// works. See InlineCanvasInput for why it's a textarea and not
// contentEditable.
//
// Writes go through the same patchForm + 800ms debounced autosave the
// side panel uses, so there's one save path, not two.
function WelcomeScreenEditor() {
  const { form, patchForm } = useFormBuilder();
  if (!form) return null;

  return (
    <div className="text-center">
      <InlineCanvasInput
        value={form.welcome_title ?? ""}
        onChange={(value) => patchForm({ welcome_title: value })}
        // Empty welcome_title falls back to the form title at respondent
        // time (see WelcomeScreen), so that's what the placeholder shows
        // - the preview keeps telling the truth about what respondents
        // will actually see.
        placeholder={form.title || "Welcome"}
        ariaLabel="Welcome screen title"
        className="text-center text-xl font-semibold"
      />
      <InlineCanvasInput
        value={form.welcome_description ?? ""}
        onChange={(value) => patchForm({ welcome_description: value })}
        placeholder="Add a description (optional)"
        ariaLabel="Welcome screen description"
        className="mt-2 text-center text-sm opacity-70"
      />
      {/* A mockup of the respondent's Start button, not a control - the
          question inputs around it are `disabled` for the same reason.
          Rendered as a div so there's nothing clickable or focusable
          here: a <button> with no handler looks interactive and isn't.
          `w-fit` + `text-center` reproduce the intrinsic sizing and text
          centering a <button> gets for free, so it renders identically. */}
      <div
        aria-hidden="true"
        className="mx-auto mt-6 block w-fit rounded-full px-6 py-2 text-center text-sm font-medium"
        style={{ background: "var(--form-fg)", color: "var(--form-bg)" }}
      >
        Start
      </div>
      <p className="mt-3 flex items-center justify-center gap-1 text-xs opacity-60">
        <Clock className="h-3 w-3" />
        {/* Rough client-side estimate for display only, not stored data. */}
        Takes {Math.max(1, Math.ceil(form.questions.length / 4))} min
      </p>
    </div>
  );
}

