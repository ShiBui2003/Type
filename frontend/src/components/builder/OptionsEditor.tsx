"use client";

import { ChevronDown, ChevronUp, Plus, X } from "lucide-react";

import type { OptionIn, Question } from "@/lib/types";

const MIN_OPTIONS = 2;

// Shared by multiple_choice and dropdown. When settings_json.variant is
// "yes_no", add/remove/reorder controls are hidden - it's locked to
// exactly the Yes/No pair, same underlying multiple_choice question and
// component either way (no separate Yes/No component).
export function OptionsEditor({
  question,
  onChange,
}: {
  question: Question;
  onChange: (options: OptionIn[]) => void;
}) {
  const isYesNo = question.settings_json?.variant === "yes_no";
  const options = question.options;

  function asOptionIns(list: Question["options"]): OptionIn[] {
    return list.map((o) => ({ id: o.id, label: o.label }));
  }

  function updateLabel(index: number, label: string) {
    onChange(
      asOptionIns(options.map((o, i) => (i === index ? { ...o, label } : o)))
    );
  }

  function removeOption(index: number) {
    onChange(asOptionIns(options.filter((_, i) => i !== index)));
  }

  function addOption() {
    onChange([...asOptionIns(options), { label: `Option ${options.length + 1}` }]);
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= options.length) return;
    const reordered = [...options];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    onChange(asOptionIns(reordered));
  }

  return (
    <div className="flex flex-col gap-2">
      {options.map((option, index) => (
        <div key={option.id} className="flex items-center gap-1">
          {!isYesNo && (
            <div className="flex flex-col">
              <button
                onClick={() => move(index, -1)}
                disabled={index === 0}
                aria-label="Move option up"
                className="text-zinc-400 disabled:opacity-30"
              >
                <ChevronUp className="h-3 w-3" />
              </button>
              <button
                onClick={() => move(index, 1)}
                disabled={index === options.length - 1}
                aria-label="Move option down"
                className="text-zinc-400 disabled:opacity-30"
              >
                <ChevronDown className="h-3 w-3" />
              </button>
            </div>
          )}
          <input
            value={option.label}
            onChange={(e) => updateLabel(index, e.target.value)}
            className="flex-1 rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-800"
          />
          {!isYesNo && (
            <button
              onClick={() => removeOption(index)}
              disabled={options.length <= MIN_OPTIONS}
              aria-label="Remove option"
              className="text-zinc-400 hover:text-red-600 disabled:opacity-30"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      ))}
      {!isYesNo && (
        <button
          onClick={addOption}
          className="flex items-center gap-1 self-start text-sm text-ink hover:underline"
        >
          <Plus className="h-4 w-4" /> Add option
        </button>
      )}
    </div>
  );
}
