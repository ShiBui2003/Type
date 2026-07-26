"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/ToastProvider";
import * as formsApi from "@/lib/api/forms";

export function CreateFormModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const { showToast } = useToast();
  const router = useRouter();

  async function handleCreate() {
    if (!title.trim()) return;
    setBusy(true);
    try {
      const form = await formsApi.createForm({ title: title.trim() });
      setTitle("");
      onClose();
      router.push(`/forms/${form.id}`);
    } catch {
      showToast("Couldn't create form", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create a new form">
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleCreate();
        }}
        placeholder="Form title"
        className="mb-4 w-full rounded border border-ink-faint px-3 py-2 text-sm text-ink"
      />
      <div className="flex justify-end gap-2">
        <button
          onClick={onClose}
          className="rounded px-3 py-1.5 text-sm text-ink-muted hover:bg-surface-canvas"
        >
          Cancel
        </button>
        <Button onClick={handleCreate} disabled={busy || !title.trim()}>
          Create
        </Button>
      </div>
    </Modal>
  );
}
