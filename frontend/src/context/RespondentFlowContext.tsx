"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from "react";

import { ApiError } from "@/lib/api/client";
import * as publicApi from "@/lib/api/public";
import { validateAnswer } from "@/lib/respondentValidation";
import type { PublicForm, PublicSubmitResult } from "@/lib/types";

type Status = "loading" | "ready" | "error" | "submitting" | "submitted";

interface State {
  form: PublicForm | null;
  status: Status;
  errorMessage: string | null;
  // -1 = welcome, 0..N-1 = a real question, thank-you is driven by
  // status === "submitted" rather than a fake N-th index.
  currentIndex: number;
  direction: 1 | -1;
  answers: Record<number, unknown>;
  errors: Record<number, string>;
  submitResult: PublicSubmitResult | null;
}

type Action =
  | { type: "loading" }
  | { type: "loaded"; form: PublicForm }
  | { type: "error"; message: string }
  | { type: "set_answer"; id: number; value: unknown }
  | { type: "set_error"; id: number; message: string | null }
  | { type: "set_errors"; errors: Record<number, string> }
  | { type: "go_to"; index: number; direction: 1 | -1 }
  | { type: "submitting" }
  | { type: "submitted"; result: PublicSubmitResult }
  | { type: "submit_failed" };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "loading":
      return { ...state, status: "loading", errorMessage: null };
    case "loaded":
      return { ...state, form: action.form, status: "ready" };
    case "error":
      return { ...state, status: "error", errorMessage: action.message };
    case "set_answer":
      return { ...state, answers: { ...state.answers, [action.id]: action.value } };
    case "set_error": {
      const errors = { ...state.errors };
      if (action.message === null) delete errors[action.id];
      else errors[action.id] = action.message;
      return { ...state, errors };
    }
    case "set_errors":
      return { ...state, errors: { ...state.errors, ...action.errors } };
    case "go_to":
      return { ...state, currentIndex: action.index, direction: action.direction };
    case "submitting":
      return { ...state, status: "submitting" };
    case "submitted":
      return { ...state, status: "submitted", submitResult: action.result };
    case "submit_failed":
      return { ...state, status: "ready" };
    default:
      return state;
  }
}

interface RespondentFlowContextValue extends State {
  slug: string;
  goNext: () => void;
  goBack: () => void;
  setAnswer: (questionId: number, value: unknown) => void;
}

const RespondentFlowContext = createContext<RespondentFlowContextValue | null>(null);

export function RespondentFlowProvider({
  slug,
  children,
}: {
  slug: string;
  children: React.ReactNode;
}) {
  const [state, dispatch] = useReducer(reducer, {
    form: null,
    status: "loading",
    errorMessage: null,
    currentIndex: -1,
    direction: 1,
    answers: {},
    errors: {},
    submitResult: null,
  });

  // At most one submit request is ever in flight - a double Enter-press
  // or a double-firing keypress on the last question must not create two
  // responses. Separate from `status` so a fast retry after a failed
  // submit isn't blocked by state that's already been reset to "ready".
  const submitGuard = useRef(false);

  // goNext/goBack read from this instead of closing over `state` directly
  // so their own identity never changes. Keyed on `state.answers` (via
  // deps below) would otherwise recreate them on every keystroke, which
  // forces RespondentFlow's keydown-listener effect to tear down and
  // re-attach constantly - a real race, not just theoretical: it was
  // caught live by a letter-shortcut immediately followed by an arrow key
  // occasionally landing while the listener was mid-reattach.
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  });

  useEffect(() => {
    dispatch({ type: "loading" });
    publicApi
      .getPublicForm(slug)
      .then((form) => dispatch({ type: "loaded", form }))
      .catch((err) => {
        const message =
          err instanceof ApiError && typeof err.detail === "string" ? err.detail : "Form not found";
        dispatch({ type: "error", message });
      });
  }, [slug]);

  const setAnswer = useCallback((questionId: number, value: unknown) => {
    dispatch({ type: "set_answer", id: questionId, value });
    dispatch({ type: "set_error", id: questionId, message: null });
  }, []);

  const submit = useCallback(
    async (form: PublicForm, answers: Record<number, unknown>, fromIndex: number) => {
      if (submitGuard.current) return;
      submitGuard.current = true;
      dispatch({ type: "submitting" });

      const payload = form.questions.map((q) => ({
        question_id: q.id,
        value: answers[q.id] ?? null,
      }));

      try {
        const result = await publicApi.submitResponse(slug, payload);
        dispatch({ type: "submitted", result });
      } catch (err) {
        submitGuard.current = false;
        if (err instanceof ApiError && err.status === 422 && err.detail && typeof err.detail === "object") {
          const rawErrors = (err.detail as { errors?: Record<string, string> }).errors ?? {};
          const errors: Record<number, string> = {};
          for (const [id, message] of Object.entries(rawErrors)) {
            errors[Number(id)] = message;
          }
          dispatch({ type: "set_errors", errors });
          // Earliest question in form order (not JS object-key order,
          // which isn't guaranteed to match) that the server flagged.
          const targetIndex = form.questions.findIndex((q) => q.id in errors);
          if (targetIndex !== -1) {
            dispatch({ type: "go_to", index: targetIndex, direction: targetIndex < fromIndex ? -1 : 1 });
          }
        }
        dispatch({ type: "submit_failed" });
      }
    },
    [slug]
  );

  const goNext = useCallback(() => {
    const s = stateRef.current;
    if (!s.form || s.status === "submitting" || s.status === "submitted") return;

    if (s.currentIndex === -1) {
      dispatch({ type: "go_to", index: 0, direction: 1 });
      return;
    }

    const question = s.form.questions[s.currentIndex];
    const error = validateAnswer(question, s.answers[question.id]);
    if (error) {
      dispatch({ type: "set_error", id: question.id, message: error });
      return;
    }

    const isLast = s.currentIndex === s.form.questions.length - 1;
    if (isLast) {
      submit(s.form, s.answers, s.currentIndex);
    } else {
      dispatch({ type: "go_to", index: s.currentIndex + 1, direction: 1 });
    }
  }, [submit]);

  const goBack = useCallback(() => {
    const s = stateRef.current;
    if (!s.form || s.currentIndex <= -1) return;
    dispatch({ type: "go_to", index: s.currentIndex - 1, direction: -1 });
  }, []);

  const value = useMemo<RespondentFlowContextValue>(
    () => ({ ...state, slug, goNext, goBack, setAnswer }),
    [state, slug, goNext, goBack, setAnswer]
  );

  return <RespondentFlowContext.Provider value={value}>{children}</RespondentFlowContext.Provider>;
}

export function useRespondentFlow() {
  const ctx = useContext(RespondentFlowContext);
  if (!ctx) throw new Error("useRespondentFlow must be used within RespondentFlowProvider");
  return ctx;
}
