"use client";

import { useEffect, useState } from "react";
import { cardClass, sectionTitleClass } from "@/lib/ui";

interface AdminExerciseRequest {
  id: string;
  exerciseName: string;
  videoUrl: string | null;
  requestedBy: string;
  createdAt: string;
}

export function AdminExerciseRequests() {
  const [requests, setRequests] = useState<AdminExerciseRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/admin/exercise-requests");
        if (res.ok) setRequests(await res.json());
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="flex flex-col gap-3">
      <h2 className={sectionTitleClass()}>Exercise requests</h2>
      {loading && <p className="text-sm text-muted">Loading…</p>}
      {!loading && requests.length === 0 && <p className="text-sm text-muted">No requests yet.</p>}
      {requests.map((r) => (
        <div key={r.id} className={cardClass("p-4 flex flex-col gap-1")}>
          <div className="flex items-center justify-between">
            <span className="font-condensed font-semibold">{r.exerciseName}</span>
            <span className="text-xs text-muted">{new Date(r.createdAt).toLocaleString()}</span>
          </div>
          <span className="text-sm text-muted">Requested by {r.requestedBy}</span>
          {r.videoUrl && (
            <a href={r.videoUrl} target="_blank" rel="noreferrer" className="text-sm text-accent underline break-all">
              {r.videoUrl}
            </a>
          )}
        </div>
      ))}
    </div>
  );
}
