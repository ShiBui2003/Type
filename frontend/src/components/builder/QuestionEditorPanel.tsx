"use client";

import { useFormBuilder } from "@/context/FormBuilderContext";
import { Toggle } from "@/components/ui/Toggle";
import { QUESTION_TYPE_MAP } from "@/lib/constants";
import type { OptionIn } from "@/lib/types";
import { OptionsEditor } from "./OptionsEditor";
import { QuestionSettingsFields } from "./QuestionSettingsFields";

export function QuestionEditorPanel() {
  const { form, selectedQuestionId, patchQuestion } = useFormBuilder();
  const question = form?.questions.find((q) => q.id === selectedQuestionId);

  if (!question) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 border-l border-ink-faint bg-surface-canvas p-6 text-center text-ink-muted">
        <p>No question selected.</p>
        <p className="text-sm">Add a question from the left panel to start editing.</p>
      </div>
    );
  }

  const meta = QUESTION_TYPE_MAP[question.type];
  const isYesNo = question.settings_json?.variant === "yes_no";

  function handleYesNoToggle(enabled: boolean) {
    if (!question) return;
    if (enabled) {
      const yesNoOptions: OptionIn[] = [
        { id: question.options[0]?.id, label: "Yes" },
        { id: question.options[1]?.id, label: "No" },
      ];
      patchQuestion(question.id, {
        settings_json: { ...(question.settings_json ?? {}), variant: "yes_no" },
        options: yesNoOptions,
      });
    } else {
      const rest: Record<string, unknown> = { ...(question.settings_json ?? {}) };
      delete rest.variant;
      patchQuestion(question.id, { settings_json: rest });
    }
  }

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto border-l border-ink-faint bg-surface-canvas p-6">
      <div>
        <label className="mb-1 block text-xs font-medium text-ink-muted">Question</label>
        <input
          value={question.title}
          onChange={(e) => patchQuestion(question.id, { title: e.target.value })}
          className="w-full border-b border-ink-faint bg-transparent pb-1 text-lg font-normal text-ink outline-none transition-colors duration-200 ease-tf focus:border-ink"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-ink-muted">
          Description (optional)
        </label>
        <textarea
          value={question.description ?? ""}
          onChange={(e) => patchQuestion(question.id, { description: e.target.value })}
          rows={2}
          className="w-full resize-none rounded border border-ink-faint px-2 py-1 text-sm text-ink"
        />
      </div>

      <Toggle
        checked={question.is_required}
        onChange={(checked) => patchQuestion(question.id, { is_required: checked })}
        label="Required"
      />

      {question.type === "multiple_choice" && (
        <Toggle checked={isYesNo} onChange={handleYesNoToggle} label="Yes/No question" />
      )}

      {meta.hasOptions && (
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-muted">Options</label>
          <OptionsEditor
            question={question}
            onChange={(options: OptionIn[]) => patchQuestion(question.id, { options })}
          />
        </div>
      )}

      {meta.hasSettings && (
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-muted">Settings</label>
          <QuestionSettingsFields
            question={question}
            onChange={(settings) => patchQuestion(question.id, { settings_json: settings })}
          />
        </div>
      )}
    </div>
  );
}
