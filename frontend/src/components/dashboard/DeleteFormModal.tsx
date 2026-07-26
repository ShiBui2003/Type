"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/ToastProvider";
import * as formsApi from "@/lib/api/forms";
import type { FormListItem } from "@/lib/types";

export function DeleteFormModal({
  isOpen,
  onClose,
  form,
  onDeleted,
}: {
  isOpen: boolean;
  onClose: () => void;
  form: FormListItem;
  onDeleted: () => void;
}) {
  const { showToast } = useToast();
  const [busy, setBusy] = useState(false);

  async function handleConfirm() {
    setBusy(true);
    try {
      await formsApi.deleteForm(form.id);
      showToast("Form deleted");
      onDeleted();
      onClose();
    } catch {
      showToast("Couldn't delete form", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Delete form?">
      <p className="mb-4 text-sm text-ink-muted">
        Delete &ldquo;{form.title}&rdquo;? This permanently removes the form and
        {form.response_count > 0
          ? ` its ${form.response_count} response${form.response_count === 1 ? "" : "s"}`
          : " all its data"}
        . This can&apos;t be undone.
      </p>
      <div className="flex justify-end gap-2">
        <button onClick={onClose} className="rounded px-3 py-1.5 text-sm text-ink-muted hover:bg-surface-canvas">
          Cancel
        </button>
        <Button variant="danger" onClick={handleConfirm} disabled={busy}>
          Delete
        </Button>
      </div>
    </Modal>
  );
}
