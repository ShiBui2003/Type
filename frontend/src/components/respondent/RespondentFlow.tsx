"use client";

import { useEffect, useMemo, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";

import { useRespondentFlow } from "@/context/RespondentFlowContext";
import { DEFAULT_THEME_KEY, THEME_PRESETS } from "@/lib/constants";
import { SLIDE_TRANSITION, SLIDE_VARIANTS } from "@/lib/respondentTransitions";
import { NavChevrons } from "./NavChevrons";
import { ProgressBar } from "./ProgressBar";
import { QuestionScreen } from "./QuestionScreen";
import { ThankYouScreen } from "./ThankYouScreen";
import { WelcomeScreen } from "./WelcomeScreen";

// A plain text input/textarea (not the dropdown's own search box, which
// captures its own arrow keys) - arrow-key nav must not hijack normal
// text-cursor movement while typing in one of these.
function isPlainTextInput(el: Element | null): boolean {
  if (!el) return false;
  if (el instanceof HTMLTextAreaElement) return true;
  if (el instanceof HTMLInputElement) return el.dataset.respondentDropdownSearch !== "true";
  return false;
}

export function RespondentFlow() {
  const { form, status, errorMessage, currentIndex, direction, goNext, goBack, setAnswer } =
    useRespondentFlow();

  const currentQuestion = form && currentIndex >= 0 ? form.questions[currentIndex] : undefined;

  // goNext/goBack/setAnswer are referentially stable (RespondentFlowContext
  // reads live state from its own ref rather than closing over it), so
  // this effect registers the listener once per mount instead of tearing
  // it down and re-adding it on every navigation. status/currentQuestion
  // still change on every navigation, so those are read from a ref kept
  // fresh below rather than added as effect deps - a stray keypress
  // landing in the gap between removeEventListener and addEventListener
  // was a real, observed race with the old per-navigation re-registration.
  const latest = useRef({ status, currentQuestion });
  useEffect(() => {
    latest.current = { status, currentQuestion };
  });

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (latest.current.status !== "ready") return;
      const active = document.activeElement;

      // long_text's textarea needs plain Enter to insert a newline
      // (browser default) and only Ctrl+Enter to advance. A textarea's
      // own onKeyDown calling stopPropagation() does NOT reliably stop
      // this listener from also seeing the event - it's a native
      // document.addEventListener, not something React's synthetic
      // event system routes through - so the carve-out has to live
      // here, not rely on the textarea suppressing it upstream.
      if (active instanceof HTMLTextAreaElement) {
        if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          goNext();
        }
        return;
      }

      const inTextInput = isPlainTextInput(active);

      if (e.key === "Enter") {
        e.preventDefault();
        goNext();
        return;
      }
      if (inTextInput) return;

      if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
      } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        e.preventDefault();
        goBack();
      } else {
        const question = latest.current.currentQuestion;
        if (question?.type === "multiple_choice" && /^[a-zA-Z]$/.test(e.key)) {
          // Letter shortcuts are multiple_choice-only - the dropdown's
          // letters go into its own search box instead (see ChoiceInput).
          const index = e.key.toUpperCase().charCodeAt(0) - 65;
          const option = question.options[index];
          if (option) setAnswer(question.id, option.id);
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [goNext, goBack, setAnswer]);

  const themeKey = (form?.theme_json?.preset as string | undefined) ?? DEFAULT_THEME_KEY;
  const preset = useMemo(
    () => THEME_PRESETS.find((t) => t.key === themeKey) ?? THEME_PRESETS[0],
    [themeKey]
  );

  if (status === "loading") {
    return <div className="flex h-screen items-center justify-center text-ink-muted">Loading…</div>;
  }

  if (status === "error") {
    const unpublished = errorMessage === "This form is no longer accepting responses";
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-2 text-center">
        <p className="text-xl font-medium text-ink">
          {unpublished ? "This form is no longer accepting responses" : "Form not found"}
        </p>
        <p className="text-sm text-ink-muted">
          {unpublished ? "The creator has taken it down." : "Check the link and try again."}
        </p>
      </div>
    );
  }

  if (!form) return null;

  if (form.questions.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center text-center text-ink-muted">
        This form has nothing to fill out yet.
      </div>
    );
  }

  const screenKey =
    status === "submitted" ? "thankyou" : currentIndex === -1 ? "welcome" : `q-${form.questions[currentIndex].id}`;

  return (
    <div
      className="font-inter flex h-screen flex-col"
      style={{ ...preset.vars, backgroundColor: "var(--form-bg)", color: "var(--form-fg)" } as React.CSSProperties}
    >
      <ProgressBar />
      <main className="flex min-h-0 flex-1 items-center justify-center overflow-y-auto px-6 py-12">
        <div className="w-full max-w-md">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={screenKey}
              custom={direction}
              variants={SLIDE_VARIANTS}
              initial="enter"
              animate="center"
              exit="exit"
              transition={SLIDE_TRANSITION}
            >
              {status === "submitted" ? (
                <ThankYouScreen />
              ) : currentIndex === -1 ? (
                <WelcomeScreen />
              ) : (
                <QuestionScreen question={form.questions[currentIndex]} index={currentIndex} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
      <NavChevrons />
    </div>
  );
}
