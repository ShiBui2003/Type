"use client";

import { Button } from "@/components/ui/Button";
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
      <p className="mb-4 text-sm text-ink-muted">
        Delete &ldquo;{question?.title || "Untitled question"}&rdquo;? This can&apos;t be undone,
        though any existing responses to it are kept.
      </p>
      <div className="flex justify-end gap-2">
        <button onClick={onClose} className="rounded px-3 py-1.5 text-sm text-ink-muted hover:bg-surface-canvas">
          Cancel
        </button>
        <Button variant="danger" onClick={handleConfirm}>
          Delete
        </Button>
      </div>
    </Modal>
  );
}
