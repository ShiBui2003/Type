"use client";

import { useFormBuilder } from "@/context/FormBuilderContext";
import { QUESTION_TYPE_MAP } from "@/lib/constants";
import type { OptionIn } from "@/lib/types";
import { OptionsEditor } from "./OptionsEditor";
import { QuestionSettingsFields } from "./QuestionSettingsFields";

export function QuestionEditorPanel() {
  const { form, selectedQuestionId, patchQuestion } = useFormBuilder();
  const question = form?.questions.find((q) => q.id === selectedQuestionId);

  if (!question) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center text-zinc-500">
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
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-6">
      <div>
        <label className="mb-1 block text-xs font-medium text-zinc-500">Question</label>
        <input
          value={question.title}
          onChange={(e) => patchQuestion(question.id, { title: e.target.value })}
          className="w-full border-b border-zinc-300 bg-transparent pb-1 text-lg font-medium outline-none focus:border-blue-500 dark:border-zinc-700"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-zinc-500">
          Description (optional)
        </label>
        <textarea
          value={question.description ?? ""}
          onChange={(e) => patchQuestion(question.id, { description: e.target.value })}
          rows={2}
          className="w-full resize-none rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-800"
        />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={question.is_required}
          onChange={(e) => patchQuestion(question.id, { is_required: e.target.checked })}
        />
        Required
      </label>

      {question.type === "multiple_choice" && (
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isYesNo}
            onChange={(e) => handleYesNoToggle(e.target.checked)}
          />
          Yes/No question
        </label>
      )}

      {meta.hasOptions && (
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500">Options</label>
          <OptionsEditor
            question={question}
            onChange={(options: OptionIn[]) => patchQuestion(question.id, { options })}
          />
        </div>
      )}

      {meta.hasSettings && (
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500">Settings</label>
          <QuestionSettingsFields
            question={question}
            onChange={(settings) => patchQuestion(question.id, { settings_json: settings })}
          />
        </div>
      )}
    </div>
  );
}
