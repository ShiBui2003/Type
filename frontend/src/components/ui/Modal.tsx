"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const FOCUSABLE_SELECTOR =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

// The one reusable modal (backdrop, focus trap, Escape-to-close, animated
// entrance) - used for the 4 cases the brief names (delete-form,
// delete-question, share-link, create-form) plus the Phase 4
// response-detail view. Never window.confirm/alert.
export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const focusables = dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      if (!focusables || focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    dialogRef.current?.focus();
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-backdrop p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 0.2, ease: [0.55, 0, 0.1, 1] } }}
          exit={{ opacity: 0, transition: { duration: 0.125, ease: "easeOut" } }}
          onClick={onClose}
        >
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            tabIndex={-1}
            className="w-full max-w-md rounded-lg bg-surface-panel p-6 text-ink shadow-ring outline-none dark:bg-zinc-900 dark:text-zinc-100"
            // Plain opacity-only fade, no scale or slide - a v2 recon
            // pass directly measured the fadeIn keyframe on a real modal
            // and disproved the original spec's "springy" claim (see the
            // correction note in docs/typeform-design-spec.md section 8).
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.175, ease: [0.55, 0, 0.1, 1] } }}
            exit={{ opacity: 0, transition: { duration: 0.125, ease: "easeOut" } }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="modal-title" className="mb-4 text-xl font-normal">
              {title}
            </h2>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
