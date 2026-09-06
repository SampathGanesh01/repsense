"use client";

import { useEffect, useState } from "react";

export function NudgeBanner() {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/nudges/today")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setMessage(data?.message ?? null))
      .catch(() => setMessage(null));
  }, []);

  if (!message) return null;

  return (
    <div className="bg-accent-soft border-l-4 border-l-accent text-ink rounded-md px-4 py-3 text-sm leading-relaxed">
      {message}
    </div>
  );
}
