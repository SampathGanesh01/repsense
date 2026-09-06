"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cardClass, eyebrowClass, inputClass, pillClass, primaryButtonClass, secondaryButtonClass } from "@/lib/ui";
import { AdminExerciseRequests } from "./AdminExerciseRequests";

interface AdminUser {
  id: string;
  name: string;
  accessCode: string;
  currentStreak: number;
  createdAt: string;
}

export function AdminDashboard() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [fallbackId, setFallbackId] = useState<string | null>(null);
  const [origin] = useState(() => (typeof window !== "undefined" ? window.location.origin : ""));
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Deliberately doesn't set loading=true here: it's initialized true for
  // the first mount fetch, and refreshing after creating a user shouldn't
  // flash the list back to a loading state.
  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) setUsers(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setError(null);
    setCreating(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      setName("");
      await refresh();
    } finally {
      setCreating(false);
    }
  }

  function joinLink(accessCode: string): string {
    return `${origin}/api/auth/join?code=${accessCode}`;
  }

  async function handleCopy(user: AdminUser) {
    try {
      await navigator.clipboard.writeText(joinLink(user.accessCode));
      setCopiedId(user.id);
      setTimeout(() => setCopiedId((id) => (id === user.id ? null : id)), 2000);
    } catch {
      // Clipboard permission can be denied (browser setting, non-HTTPS
      // context, etc.) — fall back to selecting the text so the user can
      // still copy it manually instead of the button silently doing nothing.
      const input = inputRefs.current[user.id];
      input?.focus();
      input?.select();
      setFallbackId(user.id);
      setTimeout(() => setFallbackId((id) => (id === user.id ? null : id)), 3000);
    }
  }

  return (
    <main className="flex-1 max-w-2xl mx-auto w-full p-6 flex flex-col gap-8">
      <div>
        <p className={eyebrowClass()}>Repsensei — Admin</p>
        <h1 className="font-condensed font-bold text-2xl tracking-tight">Invite links</h1>
      </div>

      <form onSubmit={handleCreate} className="flex gap-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.form?.requestSubmit();
          }}
          placeholder="Full name"
          className={inputClass("flex-1 px-4 py-3")}
        />
        <button
          type="submit"
          disabled={creating || name.trim().length === 0}
          className={primaryButtonClass("px-6 py-3")}
        >
          {creating ? "Creating…" : "Generate link"}
        </button>
      </form>
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <div className="flex flex-col gap-3">
        {loading && <p className="text-sm text-muted">Loading…</p>}
        {!loading && users.length === 0 && <p className="text-sm text-muted">No one invited yet.</p>}
        {users.map((user) => (
          <div key={user.id} className={cardClass("p-4 flex flex-col gap-2")}>
            <div className="flex items-center justify-between">
              <span className="font-condensed font-semibold">{user.name}</span>
              <span className={pillClass(user.currentStreak > 0 ? "quick" : "neutral")}>{user.currentStreak}-day streak</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                ref={(el) => {
                  inputRefs.current[user.id] = el;
                }}
                readOnly
                value={joinLink(user.accessCode)}
                onFocus={(e) => e.currentTarget.select()}
                className={inputClass("flex-1 px-3 py-2 text-sm font-mono")}
              />
              <button onClick={() => handleCopy(user)} className={secondaryButtonClass("px-4 py-2 text-sm whitespace-nowrap")}>
                {copiedId === user.id ? "Copied!" : "Copy"}
              </button>
            </div>
            {fallbackId === user.id && (
              <p className="text-xs text-accent">
                Couldn&apos;t copy automatically — the link is selected above, press Ctrl/Cmd+C.
              </p>
            )}
          </div>
        ))}
      </div>

      <AdminExerciseRequests />
    </main>
  );
}
