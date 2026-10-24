"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { useUi } from "@/lib/hooks";
import { Close } from "./icons";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** When false the dialog can only be closed through its own buttons. */
  dismissible?: boolean;
  size?: "md" | "lg";
}

/**
 * Modal built on the native <dialog>, which provides focus trapping, Escape handling
 * and an inert background. Content scrolls inside the dialog so it stays usable on
 * short screens and when a phone's on-screen keyboard is open.
 */
export function Dialog({ open, onClose, title, children, dismissible = true, size = "md" }: DialogProps) {
  const { ui } = useUi();
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!open || !dialog) return;
    if (!dialog.open) dialog.showModal();
    // Also runs when the route is hidden, so a kept-alive page never leaves the app inert.
    return () => {
      if (dialog.open) dialog.close();
    };
  }, [open]);

  if (!open) return null;

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        if (dismissible) onClose();
      }}
      onClick={(event) => {
        if (dismissible && event.target === event.currentTarget) onClose();
      }}
      className={`m-auto max-h-[calc(100dvh-1.5rem)] w-[calc(100%-1.5rem)] overflow-y-auto rounded-[1.75rem] bg-white p-0 text-ink shadow-lift ${
        size === "lg" ? "max-w-2xl" : "max-w-lg"
      }`}
    >
      <div className="flex flex-col gap-5 p-5 sm:p-7">
        <div className="flex items-start justify-between gap-3">
          <h2 id={titleId} className="text-2xl font-bold leading-tight tracking-tight" tabIndex={-1}>
            {title}
          </h2>
          {dismissible && (
            <button
              type="button"
              onClick={onClose}
              aria-label={ui.common.close}
              className="-mr-2 -mt-2 grid size-12 shrink-0 place-items-center rounded-full text-ink-soft hover:bg-brand-50 hover:text-ink"
            >
              <Close />
            </button>
          )}
        </div>
        {children}
      </div>
    </dialog>
  );
}
