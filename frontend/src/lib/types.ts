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
