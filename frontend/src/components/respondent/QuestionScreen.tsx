"use client";

import { useRespondentFlow } from "@/context/RespondentFlowContext";
import type { PublicQuestion } from "@/lib/types";
import { ChoiceInput } from "./ChoiceInput";
import { RatingInput } from "./RatingInput";

const underlineStyle = { boxShadow: "inset 0 -2px 0 0 var(--form-accent)" };

export function QuestionScreen({ question, index }: { question: PublicQuestion; index: number }) {
  const { answers, errors, setAnswer, goNext } = useRespondentFlow();
  const value = answers[question.id];
  const error = errors[question.id];

  return (
    <div className="flex flex-col gap-6 text-left">
      <div>
        <span className="text-sm opacity-60">Question {index + 1}</span>
        <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">
          {question.title}
          {question.is_required && <span className="ml-1 text-red-500">*</span>}
        </h1>
        {question.description && <p className="mt-2 text-base opacity-70">{question.description}</p>}
      </div>

      <QuestionInput question={question} value={value} onChange={(v) => setAnswer(question.id, v)} />

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={goNext}
          className="rounded-full px-6 py-2 text-sm font-medium transition-opacity duration-200 ease-tf hover:opacity-90"
          style={{ background: "var(--form-fg)", color: "var(--form-bg)" }}
        >
          OK
        </button>
        <span className="hidden text-xs opacity-50 sm:inline">press Enter ↵</span>
      </div>
    </div>
  );
}

function QuestionInput({
  question,
  value,
  onChange,
}: {
  question: PublicQuestion;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  switch (question.type) {
    case "short_text":
      return (
        <input
          key={question.id}
          autoFocus
          type="text"
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Type your answer here..."
          style={underlineStyle}
          className="w-full border-0 bg-transparent pb-2 text-lg outline-none placeholder:opacity-50"
        />
      );
    case "long_text":
      return (
        <textarea
          key={question.id}
          autoFocus
          rows={4}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Type your answer here..."
          className="w-full resize-none rounded border p-3 text-base outline-none placeholder:opacity-50"
          style={{ borderColor: "color-mix(in srgb, var(--form-fg) 20%, transparent)" }}
        />
      );
    case "email":
      return (
        <input
          key={question.id}
          autoFocus
          type="email"
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="name@example.com"
          style={underlineStyle}
          className="w-full border-0 bg-transparent pb-2 text-lg outline-none placeholder:opacity-50"
        />
      );
    case "number":
      return (
        <input
          key={question.id}
          autoFocus
          type="text"
          inputMode="numeric"
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Type a number..."
          style={underlineStyle}
          className="w-full border-0 bg-transparent pb-2 text-lg outline-none placeholder:opacity-50"
        />
      );
    case "date":
      return (
        <input
          key={question.id}
          autoFocus
          type="date"
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          style={underlineStyle}
          className="w-full border-0 bg-transparent pb-2 text-lg outline-none placeholder:opacity-50"
        />
      );
    case "multiple_choice":
    case "dropdown":
      return <ChoiceInput question={question} value={value} onChange={onChange} />;
    case "rating": {
      const scale = (question.settings_json?.scale as number | undefined) ?? 5;
      return <RatingInput scale={scale} value={value} onChange={(v) => onChange(v)} />;
    }
    default:
      return null;
  }
}
