import "server-only";
import { db } from "@/lib/db";
import { classifyStreakState, utcDateOnly } from "@/lib/streak";
import { logEvent } from "@/lib/analytics";
import { renderNudge } from "./templates";

// Idempotent: safe to call more than once for the same user/day (e.g. the
// cron re-running, or a user hitting the dashboard before the cron fires).
export async function ensureTodayNudge(user: { id: string; currentStreak: number; lastActiveDate: Date | null }) {
  const date = utcDateOnly(new Date());

  const existing = await db.nudge.findUnique({ where: { userId_date: { userId: user.id, date } } });
  if (existing) return existing;

  const state = classifyStreakState(user);
  const { templateKey, message } = renderNudge(state, user.currentStreak);

  const nudge = await db.nudge.create({
    data: { userId: user.id, date, streakState: state, templateKey, message },
  });

  await logEvent(user.id, "nudge_sent", { nudgeId: nudge.id, templateKey, streakState: state });

  return nudge;
}
