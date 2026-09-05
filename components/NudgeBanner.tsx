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
    <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-lg px-4 py-3 text-sm">
      {message}
    </div>
  );
}
