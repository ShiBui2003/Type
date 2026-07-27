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

import { useToast } from "@/components/ui/ToastProvider";
import * as formsApi from "@/lib/api/forms";
import * as questionsApi from "@/lib/api/questions";
import { createKeyedDebouncer } from "@/lib/debounce";
import { QUESTION_TYPE_MAP } from "@/lib/constants";
import type { Form, OptionIn, Question, QuestionCreate, QuestionType } from "@/lib/types";

const AUTOSAVE_DELAY_MS = 800;
const SAVED_FLASH_MS = 2000;

type SaveStatus = "idle" | "saving" | "saved" | "error";

// What callers pass to patchQuestion: options (if present) are the
// OptionIn shape the API expects (id optional - omitted means "create
// new"), not the full Option[] the rendered Question carries (which
// requires a real id + position). The reducer below synthesizes
// placeholder ids/positions for instant rendering; the debounced save's
// response (the authoritative Question, with real ids) then replaces
// them - see "replace_question".
type QuestionPatch = Partial<Omit<Question, "options">> & { options?: OptionIn[] };

interface State {
  form: Form | null;
  loading: boolean;
  error: string | null;
  selectedQuestionId: number | null;
  saveStatus: SaveStatus;
  reorderPending: boolean;
}

type Action =
  | { type: "loading" }
  | { type: "loaded"; form: Form }
  | { type: "error"; message: string }
  | { type: "patch_form_local"; patch: Partial<Form> }
  | { type: "patch_question_local"; id: number; patch: QuestionPatch }
  | { type: "replace_question"; id: number; question: Question }
  | { type: "append_question"; question: Question }
  | { type: "remove_question"; id: number }
  | { type: "set_questions"; questions: Question[] }
  | { type: "select_question"; id: number | null }
  | { type: "save_status"; status: SaveStatus }
  | { type: "reorder_pending"; value: boolean };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "loading":
      return { ...state, loading: true, error: null };
    case "loaded":
      return { ...state, form: action.form, loading: false, error: null };
    case "error":
      return { ...state, loading: false, error: action.message };
    case "patch_form_local":
      return state.form ? { ...state, form: { ...state.form, ...action.patch } } : state;
    case "patch_question_local":
      return state.form
        ? {
            ...state,
            form: {
              ...state.form,
              questions: state.form.questions.map((q) => {
                if (q.id !== action.id) return q;
                const { options, ...rest } = action.patch;
                const merged: Question = { ...q, ...rest };
                if (options) {
                  // Placeholder ids (negative, so they can't collide with
                  // real database ids) purely for instant rendering until
                  // the debounced save's response supplies real ones.
                  merged.options = options.map((o, index) => ({
                    id: o.id ?? -(index + 1),
                    label: o.label,
                    position: index * 1000,
                  }));
                }
                return merged;
              }),
            },
          }
        : state;
    case "replace_question":
      return state.form
        ? {
            ...state,
            form: {
              ...state.form,
              questions: state.form.questions.map((q) =>
                q.id === action.id ? action.question : q
              ),
            },
          }
        : state;
    // append/remove build the new array from the reducer's own current
    // state, never from a callback's closure. addQuestion/deleteQuestion
    // originally captured state.form.questions, awaited the network call,
    // then dispatched the precomputed array - two adds within one round
    // trip made the second dispatch overwrite local state without the
    // first question (persisted server-side, silently missing from the
    // UI until reload). Same lost-update class as the Phase 3 stateRef
    // fix, on the dispatch side instead of the event-listener side.
    case "append_question":
      return state.form
        ? {
            ...state,
            form: { ...state.form, questions: [...state.form.questions, action.question] },
            selectedQuestionId: action.question.id,
          }
        : state;
    case "remove_question": {
      if (!state.form) return state;
      const removedIndex = state.form.questions.findIndex((q) => q.id === action.id);
      const remaining = state.form.questions.filter((q) => q.id !== action.id);
      let selectedQuestionId = state.selectedQuestionId;
      if (selectedQuestionId === action.id) {
        const next = remaining[Math.min(removedIndex, remaining.length - 1)];
        selectedQuestionId = next ? next.id : null;
      }
      return { ...state, form: { ...state.form, questions: remaining }, selectedQuestionId };
    }
    case "set_questions":
      return state.form ? { ...state, form: { ...state.form, questions: action.questions } } : state;
    case "select_question":
      return { ...state, selectedQuestionId: action.id };
    case "save_status":
      return { ...state, saveStatus: action.status };
    case "reorder_pending":
      return { ...state, reorderPending: action.value };
    default:
      return state;
  }
}

interface FormBuilderContextValue extends State {
  formId: number;
  patchForm: (patch: Partial<Form>) => void;
  patchQuestion: (id: number, patch: QuestionPatch) => void;
  addQuestion: (type: QuestionType, variant?: "yes_no") => Promise<void>;
  deleteQuestion: (id: number) => Promise<void>;
  reorderQuestion: (
    newOrder: Question[],
    questionId: number,
    afterId: number | null,
    beforeId: number | null
  ) => Promise<void>;
  selectQuestion: (id: number | null) => void;
  // publish/unpublish/duplicate hit their own endpoints and get back the
  // full updated Form directly - this replaces local state without
  // routing through patchForm's debounce+PATCH cycle (which would try to
  // re-save fields FormUpdate doesn't even accept, like status/slug).
  setForm: (form: Form) => void;
}

const FormBuilderContext = createContext<FormBuilderContextValue | null>(null);

export function FormBuilderProvider({
  formId,
  children,
}: {
  formId: number;
  children: React.ReactNode;
}) {
  const [state, dispatch] = useReducer(reducer, {
    form: null,
    loading: true,
    error: null,
    selectedQuestionId: null,
    saveStatus: "idle",
    reorderPending: false,
  });
  const { showToast } = useToast();

  // Accumulates fields across rapid successive edits within one debounce
  // window (e.g. title then description typed in the same 800ms) so only
  // ONE coalesced PATCH goes out, not one per field.
  const pendingFormPatch = useRef<Partial<Form>>({});
  const pendingQuestionPatches = useRef<Map<number, QuestionPatch>>(new Map());
  const debouncer = useRef(createKeyedDebouncer(AUTOSAVE_DELAY_MS));
  const savedFlashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    dispatch({ type: "loading" });
    formsApi
      .getForm(formId)
      .then((form) => {
        dispatch({ type: "loaded", form });
        if (form.questions.length > 0) {
          dispatch({ type: "select_question", id: form.questions[0].id });
        }
      })
      .catch(() => dispatch({ type: "error", message: "Form not found" }));
  }, [formId]);

  const flashSaved = useCallback(() => {
    dispatch({ type: "save_status", status: "saved" });
    if (savedFlashTimer.current) clearTimeout(savedFlashTimer.current);
    savedFlashTimer.current = setTimeout(() => {
      dispatch({ type: "save_status", status: "idle" });
    }, SAVED_FLASH_MS);
  }, []);

  const patchForm = useCallback(
    (patch: Partial<Form>) => {
      dispatch({ type: "patch_form_local", patch });
      pendingFormPatch.current = { ...pendingFormPatch.current, ...patch };
      dispatch({ type: "save_status", status: "saving" });
      debouncer.current("form", () => {
        const accumulated = pendingFormPatch.current;
        pendingFormPatch.current = {};
        formsApi
          .updateForm(formId, accumulated)
          .then(flashSaved)
          .catch(() => {
            dispatch({ type: "save_status", status: "error" });
            showToast("Couldn't save changes", "error");
          });
      });
    },
    [formId, flashSaved, showToast]
  );

  const patchQuestion = useCallback(
    (id: number, patch: QuestionPatch) => {
      dispatch({ type: "patch_question_local", id, patch });
      const existing = pendingQuestionPatches.current.get(id) ?? {};
      pendingQuestionPatches.current.set(id, { ...existing, ...patch });
      dispatch({ type: "save_status", status: "saving" });
      debouncer.current(`question:${id}`, () => {
        const accumulated = pendingQuestionPatches.current.get(id) ?? {};
        pendingQuestionPatches.current.delete(id);
        questionsApi
          .updateQuestion(id, accumulated)
          .then((updated) => {
            // Reconciles placeholder option ids/positions with the
            // server's authoritative response.
            dispatch({ type: "replace_question", id, question: updated });
            flashSaved();
          })
          .catch(() => {
            dispatch({ type: "save_status", status: "error" });
            showToast("Couldn't save changes", "error");
          });
      });
    },
    [flashSaved, showToast]
  );

  const addQuestion = useCallback(
    async (type: QuestionType, variant?: "yes_no") => {
      const meta = QUESTION_TYPE_MAP[type];
      // The Yes/No picker tile creates exactly what the "Yes/No question"
      // toggle in the editor panel produces - same variant flag, same two
      // locked options - so both routes yield identical question data.
      const isYesNo = variant === "yes_no";
      const payload: QuestionCreate = {
        type,
        title: isYesNo ? "Yes/No question" : meta.defaultTitle,
        is_required: false,
        settings_json: isYesNo ? { variant: "yes_no" } : undefined,
        options: isYesNo
          ? [{ label: "Yes" }, { label: "No" }]
          : meta.hasOptions
            ? [{ label: "Option 1" }, { label: "Option 2" }]
            : undefined,
      };
      try {
        const question = await questionsApi.createQuestion(formId, payload);
        dispatch({ type: "append_question", question });
        showToast("Question added");
      } catch {
        showToast("Couldn't add question", "error");
      }
    },
    [formId, showToast]
  );

  const deleteQuestion = useCallback(
    async (id: number) => {
      try {
        await questionsApi.deleteQuestion(id);
        dispatch({ type: "remove_question", id });
        showToast("Question deleted");
      } catch {
        showToast("Couldn't delete question", "error");
      }
    },
    [showToast]
  );

  const reorderQuestion = useCallback(
    async (newOrder: Question[], questionId: number, afterId: number | null, beforeId: number | null) => {
      if (state.reorderPending || !state.form) return;
      const snapshot = state.form.questions;
      dispatch({ type: "set_questions", questions: newOrder });
      dispatch({ type: "reorder_pending", value: true });
      try {
        const updated = await questionsApi.reorderQuestions(formId, {
          question_id: questionId,
          after_id: afterId,
          before_id: beforeId,
        });
        dispatch({ type: "set_questions", questions: updated });
      } catch {
        dispatch({ type: "set_questions", questions: snapshot });
        showToast("Couldn't reorder questions", "error");
      } finally {
        dispatch({ type: "reorder_pending", value: false });
      }
    },
    [formId, state.form, state.reorderPending, showToast]
  );

  const selectQuestion = useCallback((id: number | null) => {
    dispatch({ type: "select_question", id });
  }, []);

  const setForm = useCallback((form: Form) => {
    dispatch({ type: "loaded", form });
  }, []);

  const value = useMemo<FormBuilderContextValue>(
    () => ({
      ...state,
      formId,
      patchForm,
      patchQuestion,
      addQuestion,
      deleteQuestion,
      reorderQuestion,
      selectQuestion,
      setForm,
    }),
    [
      state,
      formId,
      patchForm,
      patchQuestion,
      addQuestion,
      deleteQuestion,
      reorderQuestion,
      selectQuestion,
      setForm,
    ]
  );

  return <FormBuilderContext.Provider value={value}>{children}</FormBuilderContext.Provider>;
}

export function useFormBuilder() {
  const ctx = useContext(FormBuilderContext);
  if (!ctx) throw new Error("useFormBuilder must be used within FormBuilderProvider");
  return ctx;
}
