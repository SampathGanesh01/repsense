"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

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
        <h1 className="text-2xl font-semibold text-center">Welcome</h1>
        <p className="text-sm text-neutral-500 text-center">Enter the access code from your invite link.</p>
        <input
          autoFocus
          value={accessCode}
          onChange={(e) => setAccessCode(e.target.value)}
          placeholder="Access code"
          className="border rounded-lg px-4 py-3 text-lg text-center tracking-wide"
        />
        {error && <p className="text-sm text-red-600 text-center">{error}</p>}
        <button
          type="submit"
          disabled={loading || accessCode.trim().length === 0}
          className="bg-black text-white rounded-lg py-3 font-medium disabled:opacity-40"
        >
          {loading ? "Checking…" : "Continue"}
        </button>
      </form>
    </main>
  );
}
