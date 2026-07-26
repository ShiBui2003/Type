"use client";

import { useMemo, useState, type KeyboardEvent } from "react";

import type { PublicQuestion } from "@/lib/types";

interface ChoiceInputProps {
  question: PublicQuestion;
  value: unknown;
  onChange: (value: number) => void;
}

// Shared multiple_choice/dropdown renderer. multiple_choice gets letter-
// badge rows with no arrow-key capture (it uses letter shortcuts, wired
// at the document level in RespondentFlow). dropdown gets a hand-rolled
// searchable combobox instead - the two need different input models, not
// a shared one with a mode-switch prop.
export function ChoiceInput({ question, value, onChange }: ChoiceInputProps) {
  if (question.type === "dropdown") {
    return <DropdownCombobox question={question} value={value} onChange={onChange} />;
  }
  return <LetterBadgeChoices question={question} value={value} onChange={onChange} />;
}

function LetterBadgeChoices({ question, value, onChange }: ChoiceInputProps) {
  return (
    <div className="flex flex-col gap-2">
      {question.options.map((option, index) => {
        const selected = value === option.id;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            aria-pressed={selected}
            className="flex min-h-11 items-center gap-3 rounded-md border px-3 py-2 text-left text-base transition-colors duration-200 ease-tf"
            style={{
              color: "var(--form-fg)",
              borderColor: selected ? "var(--form-fg)" : "color-mix(in srgb, var(--form-fg) 20%, transparent)",
            }}
          >
            <span
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded border text-xs font-medium"
              style={{
                borderColor: selected ? "var(--form-fg)" : "color-mix(in srgb, var(--form-fg) 40%, transparent)",
                background: selected ? "color-mix(in srgb, var(--form-fg) 10%, transparent)" : "transparent",
              }}
            >
              {String.fromCharCode(65 + index)}
            </span>
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function DropdownCombobox({ question, value, onChange }: ChoiceInputProps) {
  const [query, setQuery] = useState("");
  const [highlightIndex, setHighlightIndex] = useState(0);
  const [open, setOpen] = useState(false);

  const filtered = useMemo(
    () => question.options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase())),
    [question.options, query]
  );

  const selectedOption = question.options.find((o) => o.id === value);

  function pick(option: { id: number; label: string }) {
    onChange(option.id);
    setQuery(option.label);
    setOpen(false);
  }

  // Captures its own arrow keys (stopPropagation) so the document-level
  // flow-navigation handler never sees them - typing/arrowing inside this
  // box must move its own highlighted suggestion, not advance the flow.
  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      e.stopPropagation();
      setOpen(true);
      setHighlightIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      e.stopPropagation();
      setHighlightIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      const picked = filtered[highlightIndex];
      if (picked) {
        e.preventDefault();
        e.stopPropagation();
        pick(picked);
      }
    }
  }

  return (
    <div className="relative">
      <input
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={`dropdown-listbox-${question.id}`}
        data-respondent-dropdown-search="true"
        placeholder="Type or select an option"
        value={open ? query : (selectedOption?.label ?? query)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onChange={(e) => {
          setQuery(e.target.value);
          setHighlightIndex(0);
          setOpen(true);
        }}
        onKeyDown={handleKeyDown}
        style={{
          boxShadow: "inset 0 -2px 0 0 var(--form-accent)",
          color: "var(--form-fg)",
        }}
        className="w-full border-0 bg-transparent pb-2 text-lg outline-none placeholder:opacity-50"
      />
      {open && (
        <div
          id={`dropdown-listbox-${question.id}`}
          role="listbox"
          className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-md py-1 shadow-ring-sm"
          style={{ backgroundColor: "var(--form-bg)", color: "var(--form-fg)" }}
        >
          {filtered.length === 0 && <div className="px-3 py-2 text-sm opacity-60">No matches</div>}
          {filtered.map((option, index) => (
            <button
              key={option.id}
              type="button"
              // preventDefault keeps focus in the input instead of
              // shifting it to this button - pick() runs on mousedown
              // itself so the click completes before the input's onBlur
              // would otherwise close the list out from under it.
              onMouseDown={(e) => {
                e.preventDefault();
                pick(option);
              }}
              className="flex min-h-11 w-full items-center px-3 text-left text-base"
              style={{
                background: index === highlightIndex ? "color-mix(in srgb, var(--form-fg) 10%, transparent)" : "transparent",
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
