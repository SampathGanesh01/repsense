"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { eyebrowClass, inputClass, primaryButtonClass } from "@/lib/ui";

export function AccessCodeForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [accessCode, setAccessCode] = useState("");
  const [error, setError] = useState<string | null>(
    searchParams.get("error") === "invalid_code" ? "That invite link's code wasn't recognized." : null,
  );
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessCode }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Something went wrong.");
        return;
      }
      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex-1 flex items-center justify-center p-6">
      <form onSubmit={handleSubmit} className="w-full max-w-sm flex flex-col gap-4">
        <p className={eyebrowClass("text-center")}>Repsensei</p>
        <h1 className="font-condensed font-bold text-3xl text-center tracking-tight">Welcome back</h1>
        <p className="text-sm text-muted text-center leading-relaxed">
          Enter the access code from your invite link.
        </p>
        <input
          autoFocus
          value={accessCode}
          onChange={(e) => setAccessCode(e.target.value)}
          onKeyDown={(e) => {
            // Belt-and-suspenders: don't rely solely on the browser's native
            // implicit-submit-on-Enter behavior, which can be unreliable
            // depending on browser/autofill state.
            if (e.key === "Enter") e.currentTarget.form?.requestSubmit();
          }}
          placeholder="Access code"
          className={inputClass("w-full px-4 py-3 text-lg text-center font-mono tracking-[0.15em]")}
        />
        {error && <p className="text-sm text-red-600 dark:text-red-400 text-center">{error}</p>}
        <button
          type="submit"
          disabled={loading || accessCode.trim().length === 0}
          className={primaryButtonClass("py-3 text-lg")}
        >
          {loading ? "Checking…" : "Continue"}
        </button>
      </form>
    </main>
  );
}
