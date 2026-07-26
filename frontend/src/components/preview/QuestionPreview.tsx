import { Star } from "lucide-react";

import type { Question } from "@/lib/types";

// Read-only mockup of one question, styled like the respondent view will
// be. Deliberately NOT shared with Phase 3's respondent flow yet -
// Phase 3's actual needs (transitions, validation, progress) aren't known
// yet, so extracting a shared renderer now risks guessing wrong; this
// becomes an easy, well-justified refactor once Phase 3 exists as the
// real second call site.
export function QuestionPreview({ question }: { question: Question }) {
  return (
    <div className="flex flex-col gap-4" style={{ color: "var(--form-fg)" }}>
      <div>
        <h3 className="text-xl font-semibold">
          {question.title || "Untitled question"}
          {question.is_required && <span className="ml-1 text-red-500">*</span>}
        </h3>
        {question.description && (
          <p className="mt-1 text-sm opacity-70">{question.description}</p>
        )}
      </div>
      <QuestionInputPreview question={question} />
    </div>
  );
}

// Confirmed design detail: text inputs have no conventional border - the
// underline is a box-shadow, which is what lets it animate thickness/color
// on focus without any layout shift. Same technique here (statically).
const underlineStyle = {
  boxShadow: "inset 0 -2px 0 0 var(--form-accent, #a1a1aa)",
};

function QuestionInputPreview({ question }: { question: Question }) {
  switch (question.type) {
    case "short_text":
    case "email":
      return (
        <input
          disabled
          placeholder={question.type === "email" ? "name@example.com" : "Type your answer here..."}
          style={underlineStyle}
          className="w-full border-0 bg-transparent pb-2 text-lg outline-none placeholder:opacity-50"
        />
      );
    case "long_text":
      return (
        <textarea
          disabled
          rows={3}
          placeholder="Type your answer here..."
          className="w-full resize-none rounded border border-current/25 p-2 text-base"
        />
      );
    case "number":
      return (
        <input
          disabled
          type="text"
          inputMode="numeric"
          placeholder="Type a number..."
          style={underlineStyle}
          className="w-full border-0 bg-transparent pb-2 text-lg outline-none placeholder:opacity-50"
        />
      );
    case "date":
      return (
        <input
          disabled
          type="text"
          placeholder="DD / MM / YYYY"
          style={underlineStyle}
          className="w-full border-0 bg-transparent pb-2 text-lg outline-none placeholder:opacity-50"
        />
      );
    case "multiple_choice":
    case "dropdown":
      return (
        <div className="flex flex-col gap-2">
          {question.options.map((option, index) => (
            <div
              key={option.id}
              className="flex min-h-11 items-center gap-3 rounded-md border border-current/25 px-3 py-2"
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded border border-current/40 text-xs font-medium">
                {String.fromCharCode(65 + index)}
              </span>
              {option.label}
            </div>
          ))}
        </div>
      );
    case "rating": {
      const scale = (question.settings_json?.scale as number | undefined) ?? 5;
      return (
        <div className="flex gap-1">
          {Array.from({ length: scale }).map((_, i) => (
            <Star key={i} className="h-7 w-7 opacity-30" />
          ))}
        </div>
      );
    }
    default:
      return null;
  }
}
