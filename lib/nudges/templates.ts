import type { StreakState } from "@/lib/streak";

export interface RenderedNudge {
  templateKey: string;
  message: string;
}

// Purely templated, rules-based copy — no LLM. Every branch is written to
// be encouraging; the broke-streak branch in particular must never guilt
// the user about the missed day.
export function renderNudge(state: StreakState, streak: number): RenderedNudge {
  switch (state) {
    case "NEW_USER":
      return {
        templateKey: "new_user_welcome",
        message: "Ready for your first workout? One quick session today gets your streak started.",
      };
    case "ON_STREAK":
      return streak >= 2
        ? {
            templateKey: "streak_continue",
            message: `You're on a ${streak}-day streak — keep it going with today's session.`,
          }
        : {
            templateKey: "streak_start",
            message: "Nice work yesterday. One more session today keeps it going.",
          };
    case "BROKE_STREAK":
      return {
        templateKey: "streak_broken_encourage",
        message: "Yesterday didn't happen, and that's OK — today's a fresh start. A quick session now gets you right back on track.",
      };
  }
}
