"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { eyebrowClass, inputClass, primaryButtonClass } from "@/lib/ui";

export function AdminLogin() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Something went wrong.");
        return;
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex-1 flex items-center justify-center p-6">
      <form onSubmit={handleSubmit} className="w-full max-w-sm flex flex-col gap-4">
        <p className={eyebrowClass("text-center")}>Repsensei</p>
        <h1 className="font-condensed font-bold text-3xl text-center tracking-tight -mt-1">Admin</h1>
        <input
          autoFocus
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.form?.requestSubmit();
          }}
          placeholder="Admin password"
          className={inputClass("w-full px-4 py-3 text-lg text-center tracking-wide")}
        />
        {error && <p className="text-sm text-red-600 dark:text-red-400 text-center">{error}</p>}
        <button
          type="submit"
          disabled={loading || password.length === 0}
          className={primaryButtonClass("py-3")}
        >
          {loading ? "Checking…" : "Sign in"}
        </button>
      </form>
    </main>
  );
}
