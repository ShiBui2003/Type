"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
        className="mb-4 w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
      />
      <div className="flex justify-end gap-2">
        <button
          onClick={onClose}
          className="rounded px-3 py-1.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          Cancel
        </button>
        <button
          onClick={handleCreate}
          disabled={busy || !title.trim()}
          className="rounded bg-ink px-3 py-1.5 text-sm text-white transition-colors duration-200 ease-tf hover:bg-ink-soft disabled:opacity-50"
        >
          Create
        </button>
      </div>
    </Modal>
  );
}
