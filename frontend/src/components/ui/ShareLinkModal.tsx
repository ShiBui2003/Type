"use client";

import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/ToastProvider";

export function ShareLinkModal({
  isOpen,
  onClose,
  slug,
}: {
  isOpen: boolean;
  onClose: () => void;
  slug: string;
}) {
  const { showToast } = useToast();
  const url = typeof window !== "undefined" ? `${window.location.origin}/f/${slug}` : "";

  function handleCopy() {
    navigator.clipboard
      .writeText(url)
      .then(() => showToast("Link copied to clipboard"))
      .catch(() => showToast("Couldn't copy - select and copy manually", "error"));
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Your form is live">
      <p className="mb-3 text-sm text-zinc-600 dark:text-zinc-400">
        Share this link with respondents:
      </p>
      <div className="flex items-center gap-2">
        <input
          readOnly
          value={url}
          onFocus={(e) => e.target.select()}
          className="flex-1 rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
        />
        <button
          onClick={handleCopy}
          className="rounded bg-ink px-3 py-2 text-sm text-white transition-colors duration-200 ease-tf hover:bg-ink-soft"
        >
          Copy
        </button>
      </div>
    </Modal>
  );
}
