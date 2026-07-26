import {
  AlignLeft,
  Calendar,
  ChevronDownSquare,
  CircleDot,
  Hash,
  Mail,
  Star,
  TextCursorInput,
  type LucideIcon,
} from "lucide-react";

import type { QuestionType } from "./types";

interface QuestionTypeMeta {
  type: QuestionType;
  label: string;
  icon: LucideIcon;
  defaultTitle: string;
  // The one place that knows which types have an options list / a
  // settings sub-form, so QuestionEditorPanel and QuestionPreview branch
  // off these flags instead of each hand-rolling their own type checks.
  hasOptions: boolean;
  hasSettings: boolean;
}

// Order here is the order shown in AddQuestionMenu - exactly the eight
// types from the brief, in the order the picker should list them.
export const QUESTION_TYPES: QuestionTypeMeta[] = [
  {
    type: "short_text",
    label: "Short text",
    icon: TextCursorInput,
    defaultTitle: "Short text question",
    hasOptions: false,
    hasSettings: false,
  },
  {
    type: "long_text",
    label: "Long text",
    icon: AlignLeft,
    defaultTitle: "Long text question",
    hasOptions: false,
    hasSettings: false,
  },
  {
    type: "email",
    label: "Email",
    icon: Mail,
    defaultTitle: "Email question",
    hasOptions: false,
    hasSettings: false,
  },
  {
    type: "number",
    label: "Number",
    icon: Hash,
    defaultTitle: "Number question",
    hasOptions: false,
    hasSettings: true,
  },
  {
    type: "date",
    label: "Date",
    icon: Calendar,
    defaultTitle: "Date question",
    hasOptions: false,
    hasSettings: false,
  },
  {
    type: "multiple_choice",
    label: "Multiple choice",
    icon: CircleDot,
    defaultTitle: "Multiple choice question",
    hasOptions: true,
    hasSettings: false,
  },
  {
    type: "dropdown",
    label: "Dropdown",
    icon: ChevronDownSquare,
    defaultTitle: "Dropdown question",
    hasOptions: true,
    hasSettings: false,
  },
  {
    type: "rating",
    label: "Rating",
    icon: Star,
    defaultTitle: "Rating question",
    hasOptions: false,
    hasSettings: true,
  },
];

export const QUESTION_TYPE_MAP: Record<QuestionType, QuestionTypeMeta> =
  Object.fromEntries(QUESTION_TYPES.map((meta) => [meta.type, meta])) as Record<
    QuestionType,
    QuestionTypeMeta
  >;

// Preset color themes - our own scoping call, not something the
// assignment text mandates specifically (it just says "theme" under
// Settings placeholders). Values are CSS custom properties applied to a
// wrapper div around the live preview / respondent flow, never :root, so
// one form's theme never leaks into another's.
export interface ThemePreset {
  key: string;
  label: string;
  vars: Record<string, string>;
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    key: "default",
    label: "Default",
    vars: {
      "--form-bg": "#ffffff",
      "--form-fg": "#1a1a1a",
      "--form-accent": "#0d6efd",
    },
  },
  {
    key: "midnight",
    label: "Midnight",
    vars: {
      "--form-bg": "#111827",
      "--form-fg": "#f9fafb",
      "--form-accent": "#60a5fa",
    },
  },
  {
    key: "tan",
    label: "Tan",
    vars: {
      "--form-bg": "#f5efe6",
      "--form-fg": "#3f3226",
      "--form-accent": "#a9714b",
    },
  },
  {
    key: "mint",
    label: "Mint",
    vars: {
      "--form-bg": "#f0fdf4",
      "--form-fg": "#14532d",
      "--form-accent": "#22c55e",
    },
  },
];

export const DEFAULT_THEME_KEY = "default";
