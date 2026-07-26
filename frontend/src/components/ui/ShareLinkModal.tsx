"use client";

import { QrCode } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/ToastProvider";

export function ShareLinkModal({
  isOpen,
  onClose,
  slug,
  title,
}: {
  isOpen: boolean;
  onClose: () => void;
  slug: string;
  title: string;
}) {
  const { showToast } = useToast();
  const url = typeof window !== "undefined" ? `${window.location.origin}/f/${slug}` : "";
  const domain = typeof window !== "undefined" ? window.location.host : "";

  function handleCopy() {
    navigator.clipboard
      .writeText(url)
      .then(() => showToast("Link copied to clipboard"))
      .catch(() => showToast("Couldn't copy - select and copy manually", "error"));
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Choose how you'd like to share your form">
      {/* Copy link + URL + QR, one bordered row - matches the real Share
          screen's layout. No slug-edit affordance here on purpose: our
          slugs are deliberately immutable once a form first publishes
          (see NOTES.md), so there's nothing for an "Edit" control to do -
          adding one would imply functionality we don't have. QR button
          is present for the visual but not wired (no QR-generation
          dependency added for this), same as the builder toolbar's
          Device/Preview placeholders. */}
      <div className="flex items-center gap-2 rounded-md border border-ink-faint p-2">
        <Button onClick={handleCopy} className="shrink-0">
          Copy link
        </Button>
        <input
          readOnly
          value={url}
          onFocus={(e) => e.target.select()}
          className="min-w-0 flex-1 border-none bg-transparent px-1 text-sm text-ink outline-none"
        />
        <button
          type="button"
          aria-label="QR code"
          title="QR code"
          className="shrink-0 rounded p-1.5 text-ink-muted transition-colors duration-200 ease-tf hover:bg-surface-panel hover:text-ink"
        >
          <QrCode className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-5">
        <h3 className="mb-2 text-sm font-medium text-ink">Link preview</h3>
        <div className="flex items-center gap-3 rounded-md border border-ink-faint p-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-surface-panel text-sm font-medium text-ink-muted">
            {title.slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-ink">{title}</p>
            <p className="truncate text-xs text-ink-muted">Fill out this form</p>
            <p className="truncate text-xs text-ink-muted">{domain}</p>
          </div>
        </div>
      </div>
    </Modal>
  );
}
