"use client";

import { useFormBuilder } from "@/context/FormBuilderContext";
import { DEFAULT_THEME_KEY, THEME_PRESETS } from "@/lib/constants";

// Preset swatches, not a custom color picker - our own scoping call for
// how to satisfy the assignment's "theme" placeholder requirement (see
// README assumptions), not something the spec itself dictates.
export function ThemePicker() {
  const { form, patchForm } = useFormBuilder();
  if (!form) return null;

  const activeKey = (form.theme_json?.preset as string | undefined) ?? DEFAULT_THEME_KEY;

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Theme</h2>
      <div className="flex flex-wrap gap-3">
        {THEME_PRESETS.map((preset) => (
          <button
            key={preset.key}
            onClick={() => patchForm({ theme_json: { preset: preset.key } })}
            className={`flex flex-col items-center gap-2 rounded-md border p-2 text-xs ${
              activeKey === preset.key
                ? "border-blue-500 ring-2 ring-blue-200 dark:ring-blue-900"
                : "border-zinc-200 dark:border-zinc-700"
            }`}
          >
            <span
              className="h-10 w-16 rounded"
              style={{
                background: preset.vars["--form-bg"],
                boxShadow: `inset 0 0 0 2px ${preset.vars["--form-accent"]}`,
              }}
            />
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  );
}
