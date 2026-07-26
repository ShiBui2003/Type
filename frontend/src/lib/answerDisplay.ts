import type { QuestionType } from "./types";

// The single place that turns a ResponseAnswer's polymorphic `value`
// into display text. Mirrors _answer_value() in backend/routers/forms.py:
// choice answers normally arrive as {option_id, label}; if the chosen
// option was later deleted, value_option_id was nulled server-side and
// the raw value_json (the submitted option id, a bare number) comes
// through instead - that case renders as "(option removed)" rather than
// leaking the id.
export function formatAnswerValue(type: QuestionType, value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";

  if (type === "multiple_choice" || type === "dropdown") {
    if (typeof value === "object" && "option_id" in (value as object)) {
      const v = value as { option_id: number; label: string | null };
      return v.label ?? "(option removed)";
    }
    return "(option removed)";
  }

  if (typeof value === "number") return formatNumber(value);
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export function formatNumber(n: number): string {
  return Number.isInteger(n) ? String(n) : String(Math.round(n * 10) / 10);
}

// Backend datetimes are naive UTC (datetime.utcnow) serialized without a
// timezone suffix; parsing them bare would make JS treat them as local
// time and shift every displayed timestamp by the viewer's UTC offset.
export function formatDateTime(iso: string): string {
  const utc = /Z$|[+-]\d\d:\d\d$/.test(iso) ? iso : `${iso}Z`;
  return new Date(utc).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
