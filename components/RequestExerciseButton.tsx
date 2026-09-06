"use client";

import { useState, type FormEvent } from "react";
import { Modal } from "./Modal";
import { inputClass, primaryButtonClass, secondaryButtonClass } from "@/lib/ui";

export function RequestExerciseButton() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [videoLink, setVideoLink] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  function closeAndReset() {
    setOpen(false);
    setName("");
    setVideoLink("");
    setError(null);
    setSubmitted(false);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Exercise name is required.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/exercise-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exerciseName: trimmedName, videoUrl: videoLink.trim() || null }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className={secondaryButtonClass("px-4 py-3 text-sm w-full")}>
        Request an exercise
      </button>
      <Modal open={open} onClose={closeAndReset} eyebrow="Feedback" title="Request an exercise">
        {submitted ? (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-muted">Thanks — we&apos;ve noted your request.</p>
            <button onClick={closeAndReset} className={primaryButtonClass("py-3")}>
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1 text-sm text-muted">
              Exercise name
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") e.currentTarget.form?.requestSubmit();
                }}
                className={inputClass("px-3 py-2")}
                placeholder="e.g. Deadlift"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-muted">
              Video link (optional)
              <input
                value={videoLink}
                onChange={(e) => setVideoLink(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") e.currentTarget.form?.requestSubmit();
                }}
                className={inputClass("px-3 py-2")}
                placeholder="https://..."
              />
            </label>
            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={submitting || name.trim().length === 0}
              className={primaryButtonClass("py-3")}
            >
              {submitting ? "Submitting…" : "Submit request"}
            </button>
          </form>
        )}
      </Modal>
    </>
  );
}
