// Hand-written mirrors of backend/schemas.py. Kept by hand rather than
// generated from the OpenAPI schema - ~17 endpoints with stable shapes
// we control on both ends doesn't justify a codegen build step.

export type QuestionType =
  | "short_text"
  | "long_text"
  | "email"
  | "number"
  | "date"
  | "multiple_choice"
  | "dropdown"
  | "rating";

export type FormStatus = "draft" | "published";

export interface Option {
  id: number;
  label: string;
  position: number;
}

export interface OptionIn {
  // Present -> update that row. Omitted -> create a new one. Any
  // existing option not present in the submitted list gets deleted
  // server-side (see sync_options() in routers/forms.py).
  id?: number;
  label: string;
}

export interface Question {
  id: number;
  type: QuestionType;
  title: string;
  description: string | null;
  is_required: boolean;
  position: number;
  settings_json: Record<string, unknown> | null;
  options: Option[];
}

export interface QuestionCreate {
  type: QuestionType;
  title: string;
  description?: string | null;
  is_required?: boolean;
  settings_json?: Record<string, unknown> | null;
  options?: OptionIn[];
}

export interface QuestionUpdate {
  title?: string;
  description?: string | null;
  is_required?: boolean;
  settings_json?: Record<string, unknown> | null;
  options?: OptionIn[];
}

export interface Form {
  id: number;
  title: string;
  slug: string | null;
  status: FormStatus;
  welcome_title: string | null;
  welcome_description: string | null;
  thank_you_title: string | null;
  thank_you_description: string | null;
  theme_json: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  questions: Question[];
}

export interface FormListItem {
  id: number;
  title: string;
  slug: string | null;
  status: FormStatus;
  response_count: number;
  created_at: string;
  updated_at: string;
}

export interface FormCreate {
  title: string;
}

export interface FormUpdate {
  title?: string;
  welcome_title?: string | null;
  welcome_description?: string | null;
  thank_you_title?: string | null;
  thank_you_description?: string | null;
  theme_json?: Record<string, unknown> | null;
}

export interface ReorderPayload {
  question_id: number;
  after_id: number | null;
  before_id: number | null;
}

// Mirrors backend/schemas.py's Public* models - the respondent-safe
// subset returned by /api/public/forms/{slug} (no id/status/slug on the
// form itself, no deleted questions, options without position).
export interface PublicOption {
  id: number;
  label: string;
}

export interface PublicQuestion {
  id: number;
  type: QuestionType;
  title: string;
  description: string | null;
  is_required: boolean;
  settings_json: Record<string, unknown> | null;
  options: PublicOption[];
}

export interface PublicForm {
  title: string;
  welcome_title: string | null;
  welcome_description: string | null;
  thank_you_title: string | null;
  thank_you_description: string | null;
  theme_json: Record<string, unknown> | null;
  questions: PublicQuestion[];
}

export interface PublicAnswer {
  question_id: number;
  value: unknown;
}

export interface PublicSubmitResult {
  thank_you_title: string | null;
  thank_you_description: string | null;
}

// Mirrors backend/schemas.py's ResponseOut/AnswerOut. `value` is
// polymorphic by question_type (see _answer_value() in routers/forms.py):
// {option_id, label} for choice types, number for number/rating, string
// for text types - or the raw value_json fallback when the typed column
// was nulled out (e.g. the chosen option was later deleted).
export interface ResponseAnswer {
  question_id: number;
  question_title: string;
  question_type: QuestionType;
  value: unknown;
}

export interface ResponseDetail {
  id: number;
  started_at: string;
  submitted_at: string | null;
  is_complete: boolean;
  answers: ResponseAnswer[];
}

// Mirrors FormSummaryOut/QuestionSummaryOut: exactly one of
// options/average+distribution/samples is populated per question_type,
// the rest stay null (same branch logic as the backend).
export interface OptionCount {
  label: string;
  count: number;
  percentage: number;
}

export interface ValueCount {
  value: number;
  count: number;
}

export interface QuestionSummary {
  question_id: number;
  question_title: string;
  question_type: QuestionType;
  total_answers: number;
  options: OptionCount[] | null;
  average: number | null;
  distribution: ValueCount[] | null;
  samples: string[] | null;
}

export interface FormSummary {
  form_id: number;
  response_count: number;
  questions: QuestionSummary[];
}
