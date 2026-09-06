"use client";

import type { ReactNode } from "react";
import { eyebrowClass } from "@/lib/ui";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  eyebrow?: string;
  title?: string;
  widthClass?: string;
  children: ReactNode;
}

// Generic open/close modal sharing ConsentModal's visual chrome (overlay +
// centered card). ConsentModal itself is stage-gated rather than
// open/close-gated and has no close affordance, so it's left as its own
// component rather than rebuilt on top of this one.
export function Modal({ open, onClose, eyebrow, title, widthClass = "max-w-md", children }: ModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-ink/60 flex items-center justify-center p-6 z-50" onClick={onClose}>
      <div
        className={`bg-surface border border-line card-shadow rounded-lg w-full p-6 flex flex-col gap-4 ${widthClass}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            {eyebrow && <p className={eyebrowClass()}>{eyebrow}</p>}
            {title && <h2 className="font-condensed font-bold text-xl -mt-1">{title}</h2>}
          </div>
          <button onClick={onClose} aria-label="Close" className="text-muted hover:text-ink text-xl leading-none">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
