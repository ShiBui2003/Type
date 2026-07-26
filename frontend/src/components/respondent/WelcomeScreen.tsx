"use client";

import { Clock } from "lucide-react";

import { useRespondentFlow } from "@/context/RespondentFlowContext";

// The real, interactive version of the same welcome-screen state
// LivePreviewPanel mocks up in the builder (title/Start button/time
// estimate) - built last, per addendum F, only after the core question
// flow below it was verified working end to end.
export function WelcomeScreen() {
  const { form, goNext } = useRespondentFlow();
  if (!form) return null;

  const title = form.welcome_title || form.title;
  const minutes = Math.max(1, Math.ceil(form.questions.length / 4));

  return (
    <div className="text-center">
      <h1 className="text-2xl font-semibold sm:text-3xl">{title}</h1>
      {form.welcome_description && (
        <p className="mt-3 text-base opacity-70">{form.welcome_description}</p>
      )}
      <button
        type="button"
        onClick={goNext}
        className="mx-auto mt-6 block rounded-full px-6 py-2 text-sm font-medium transition-opacity duration-200 ease-tf hover:opacity-90"
        style={{ background: "var(--form-fg)", color: "var(--form-bg)" }}
      >
        Start
      </button>
      <p className="mt-3 flex items-center justify-center gap-1 text-xs opacity-60">
        <Clock className="h-3 w-3" />
        Takes {minutes} min
      </p>
    </div>
  );
}
