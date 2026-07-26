import type { PublicQuestion } from "./types";

// Direct mirror of backend/validation.py's validate_answer() - same
// per-type dispatch, same exact message copy (including the dynamic
// min/max/scale messages). This is a UX-only convenience for instant
// feedback without a network round-trip; the backend re-validates
// unconditionally on submit and remains the sole source of truth (see
// routers/public.py's 422 handling in RespondentFlowContext).
export const REQUIRED_MESSAGE = "Please fill this in"; // verified
export const NUMBERS_ONLY_MESSAGE = "Numbers only please"; // verified
export const INVALID_DATE_MESSAGE =
  "That date isn't valid. Check the month and day aren't reversed."; // verified
export const INVALID_EMAIL_MESSAGE = "hmm, that email doesn't look right"; // not verified
export const INVALID_OPTION_MESSAGE = "Please select a valid option"; // not verified

function isEmpty(value: unknown): boolean {
  return (
    value === null ||
    value === undefined ||
    value === "" ||
    (Array.isArray(value) && value.length === 0)
  );
}

function isValidIsoDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  // Date normalizes overflow (e.g. Feb 30 -> Mar 2) instead of rejecting
  // it - comparing components back out catches exactly that case, the
  // same thing Python's date.fromisoformat rejects with a ValueError.
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export function validateAnswer(question: PublicQuestion, value: unknown): string | null {
  if (isEmpty(value)) {
    return question.is_required ? REQUIRED_MESSAGE : null;
  }

  if (question.type === "short_text" || question.type === "long_text") {
    return null;
  }

  if (question.type === "email") {
    const text = String(value);
    const atIndex = text.indexOf("@");
    if (atIndex === -1 || !text.slice(atIndex + 1).includes(".") || text.includes(" ")) {
      return INVALID_EMAIL_MESSAGE;
    }
    return null;
  }

  if (question.type === "number") {
    const number = Number(value);
    if (Number.isNaN(number)) return NUMBERS_ONLY_MESSAGE;
    const settings = (question.settings_json ?? {}) as { min?: number; max?: number };
    if (settings.min !== undefined && settings.min !== null && number < settings.min) {
      return `Please enter a number of at least ${settings.min}`;
    }
    if (settings.max !== undefined && settings.max !== null && number > settings.max) {
      return `Please enter a number of at most ${settings.max}`;
    }
    return null;
  }

  if (question.type === "date") {
    if (!isValidIsoDate(String(value))) return INVALID_DATE_MESSAGE;
    return null;
  }

  if (question.type === "rating") {
    const settings = (question.settings_json ?? {}) as { scale?: number };
    const scale = settings.scale ?? 5;
    const rating = Number(value);
    if (Number.isNaN(rating)) return NUMBERS_ONLY_MESSAGE;
    if (rating < 1 || rating > scale) {
      return `Please choose a rating between 1 and ${scale}`;
    }
    return null;
  }

  if (question.type === "multiple_choice" || question.type === "dropdown") {
    const optionId = Number(value);
    if (Number.isNaN(optionId)) return INVALID_OPTION_MESSAGE;
    const validIds = new Set(question.options.map((o) => o.id));
    if (!validIds.has(optionId)) return INVALID_OPTION_MESSAGE;
    return null;
  }

  return null;
}
