"use client";

import type { Question } from "@/lib/types";

// Rating scale (5/10) + Number min/max - merged into one small file
// since neither is reused elsewhere and each is ~10 lines.
export function QuestionSettingsFields({
  question,
  onChange,
}: {
  question: Question;
  onChange: (settings: Record<string, unknown>) => void;
}) {
  const settings = question.settings_json ?? {};

  if (question.type === "rating") {
    const scale = (settings.scale as number) ?? 5;
    return (
      <label className="flex items-center gap-2 text-sm">
        Scale
        <select
          value={scale}
          onChange={(e) => onChange({ ...settings, scale: Number(e.target.value) })}
          className="rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-800"
        >
          <option value={5}>1 to 5</option>
          <option value={10}>1 to 10</option>
        </select>
      </label>
    );
  }

  if (question.type === "number") {
    const min = settings.min as number | undefined;
    const max = settings.max as number | undefined;
    return (
      <div className="flex gap-4 text-sm">
        <label className="flex items-center gap-2">
          Min
          <input
            type="number"
            value={min ?? ""}
            onChange={(e) =>
              onChange({
                ...settings,
                min: e.target.value === "" ? undefined : Number(e.target.value),
              })
            }
            className="w-20 rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-800"
          />
        </label>
        <label className="flex items-center gap-2">
          Max
          <input
            type="number"
            value={max ?? ""}
            onChange={(e) =>
              onChange({
                ...settings,
                max: e.target.value === "" ? undefined : Number(e.target.value),
              })
            }
            className="w-20 rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-800"
          />
        </label>
      </div>
    );
  }

  return null;
}
