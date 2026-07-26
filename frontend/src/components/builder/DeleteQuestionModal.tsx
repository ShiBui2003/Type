"use client";

import { Modal } from "@/components/ui/Modal";
import { useFormBuilder } from "@/context/FormBuilderContext";

export function DeleteQuestionModal({
  questionId,
  onClose,
}: {
  questionId: number | null;
  onClose: () => void;
}) {
  const { form, deleteQuestion } = useFormBuilder();
  const question = form?.questions.find((q) => q.id === questionId);

  async function handleConfirm() {
    if (questionId == null) return;
    await deleteQuestion(questionId);
    onClose();
  }

  return (
    <Modal isOpen={questionId != null} onClose={onClose} title="Delete question?">
      <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
        Delete &ldquo;{question?.title || "Untitled question"}&rdquo;? This can&apos;t be undone,
        though any existing responses to it are kept.
      </p>
      <div className="flex justify-end gap-2">
        <button
          onClick={onClose}
          className="rounded px-3 py-1.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          Cancel
        </button>
        <button
          onClick={handleConfirm}
          className="rounded bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700"
        >
          Delete
        </button>
      </div>
    </Modal>
  );
}
