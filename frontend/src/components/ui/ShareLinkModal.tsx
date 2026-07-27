"use client";

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
      {/* Copy link + URL, one bordered row - matches the real Share
          screen's layout. Two of that screen's controls are deliberately
          absent rather than present-but-dead:
          - No slug-edit affordance: our slugs are immutable once a form
            first publishes, so an "Edit" control would have nothing to do.
          - No QR button: generating a real scannable code needs a QR
            library, and adding a dependency for one decorative icon isn't
            a trade worth making. An icon that looks clickable and isn't
            is worse than no icon. */}
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
