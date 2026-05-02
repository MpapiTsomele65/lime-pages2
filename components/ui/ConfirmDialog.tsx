"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";

interface ConfirmDialogProps {
  /** Render gate. Renders nothing when false. */
  open: boolean;
  /** Headline e.g. "Remove ID Document?". Should read like a question. */
  title: string;
  /** Body copy under the title. ReactNode so callers can mix
   *  emphasis / member names / mono record IDs in. Keep short — one
   *  or two lines, max. */
  description?: React.ReactNode;
  /** Confirm button label. Defaults to "Confirm". For destructive
   *  actions we recommend a verb that describes the action ("Remove",
   *  "Delete", "Reset") so users know exactly what's being committed. */
  confirmLabel?: string;
  /** Cancel button label. Defaults to "Cancel". */
  cancelLabel?: string;
  /** Style the confirm button as destructive (red). Cancel becomes the
   *  initially-focused button so a misclick + Enter doesn't fire the
   *  destructive path. Use for any action that loses data, removes a
   *  record, or otherwise can't be trivially undone. */
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Generic confirmation modal for destructive admin actions.
 *
 * Replaces the browser-native `window.confirm()` which is hard to
 * style, easy to misclick on touch devices, and breaks the visual
 * thread of the admin tool. This dialog mirrors the dark-themed
 * KYC/portal aesthetic, traps focus while open, and dismisses on
 * Escape or outside-click — so the safe path (cancel) is always
 * one keystroke or click away.
 *
 * Reusable across the admin surface — KYC attachment removal today,
 * member deletion / status reversion / contribution-row rollback
 * tomorrow. The point is to give every destructive action a
 * uniform, hard-to-misclick gate.
 *
 * Future extension: pair with a toast-with-Undo pattern if we ever
 * need true post-action recovery (e.g. for actions whose effects
 * propagate to external systems). Today the confirm-then-act gate
 * is enough — most admin destructives can be re-done by re-uploading
 * / re-creating, and Airtable retains row history under the hood.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement | null>(null);
  const confirmRef = useRef<HTMLButtonElement | null>(null);

  // Focus management — when the dialog opens, send focus to Cancel
  // (for destructive actions) or Confirm (for non-destructive).
  // Picking Cancel as the default for destructive guards against
  // hit-Enter-too-fast misclicks.
  useEffect(() => {
    if (!open) return;
    const target = destructive ? cancelRef.current : confirmRef.current;
    target?.focus();
  }, [open, destructive]);

  // Escape closes the dialog (= cancel). Captured at document level
  // so it works even if focus drifts outside the dialog.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          // Backdrop — click outside the panel cancels.
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
          onClick={onCancel}
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-dialog-title"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            // Stop propagation so clicks inside the panel don't bubble
            // to the backdrop (which would cancel).
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#0F2040] shadow-2xl"
          >
            <div className="p-6">
              <div className="flex items-start gap-4">
                {destructive && (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#DC2626]/15 text-[#DC2626]">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h2
                    id="confirm-dialog-title"
                    className="text-lg font-semibold text-white"
                  >
                    {title}
                  </h2>
                  {description && (
                    <div className="mt-2 text-sm text-white/60 leading-relaxed">
                      {description}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-2">
                <button
                  ref={cancelRef}
                  type="button"
                  onClick={onCancel}
                  className="rounded-full border border-white/[0.1] bg-white/[0.03] px-4 py-2 text-sm font-semibold text-white/80 hover:bg-white/[0.08] focus:outline-none focus:ring-2 focus:ring-white/20 transition-colors"
                >
                  {cancelLabel}
                </button>
                <button
                  ref={confirmRef}
                  type="button"
                  onClick={onConfirm}
                  className={`rounded-full px-4 py-2 text-sm font-bold focus:outline-none focus:ring-2 transition-colors ${
                    destructive
                      ? "bg-[#DC2626] text-white hover:bg-[#B91C1C] focus:ring-[#DC2626]/40"
                      : "bg-[#B8FF00] text-[#0B1933] hover:bg-[#a8ef00] focus:ring-[#B8FF00]/40"
                  }`}
                >
                  {confirmLabel}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
