"use client";

import { Button } from "@/components/ui/Button";
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
      <p className="mb-3 text-sm text-ink-muted">Share this link with respondents:</p>
      <div className="flex items-center gap-2">
        <input
          readOnly
          value={url}
          onFocus={(e) => e.target.select()}
          className="flex-1 rounded border border-ink-faint px-3 py-2 text-sm text-ink"
        />
        <Button onClick={handleCopy}>Copy</Button>
      </div>
    </Modal>
  );
}
