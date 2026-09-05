import "server-only";
import { db } from "./db";

export type StreakState = "NEW_USER" | "ON_STREAK" | "BROKE_STREAK";

const DAY_MS = 86_400_000;

export function utcDateOnly(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((utcDateOnly(a).getTime() - utcDateOnly(b).getTime()) / DAY_MS);
}

// Recomputes currentStreak/longestStreak/lastActiveDate from scratch off
// completed-workout dates. Call this right after a workout is marked
// completed. Recomputing from scratch (rather than incrementing) is simple
// to reason about and cheap at pilot scale (a handful of workouts per user
// over 4-6 weeks).
export async function recomputeStreak(userId: string): Promise<{ currentStreak: number; longestStreak: number }> {
  const workouts = await db.workout.findMany({
    where: { userId, completedAt: { not: null } },
    select: { completedAt: true },
  });

  const uniqueDays = Array.from(new Set(workouts.map((w) => utcDateOnly(w.completedAt as Date).getTime()))).sort(
    (a, b) => a - b,
  );

  let longest = 0;
  let running = 0;
  let prevDay: number | null = null;
  for (const day of uniqueDays) {
    running = prevDay !== null && day - prevDay === DAY_MS ? running + 1 : 1;
    longest = Math.max(longest, running);
    prevDay = day;
  }

  let current = 0;
  let lastActiveDate: Date | null = null;
  if (uniqueDays.length > 0) {
    lastActiveDate = new Date(uniqueDays[uniqueDays.length - 1]);
    const gapFromToday = daysBetween(new Date(), lastActiveDate);
    current = gapFromToday <= 1 ? running : 0;
  }

  await db.user.update({
    where: { id: userId },
    data: { currentStreak: current, longestStreak: Math.max(longest, current), lastActiveDate },
  });

  return { currentStreak: current, longestStreak: Math.max(longest, current) };
}

// Which nudge bucket a user falls into *today*, independent of whether
// their cached currentStreak has been recomputed today (it only updates
// when a workout completes, so this always re-derives from the gap).
export function classifyStreakState(user: { currentStreak: number; lastActiveDate: Date | null }): StreakState {
  if (!user.lastActiveDate) return "NEW_USER";
  const gap = daysBetween(new Date(), user.lastActiveDate);
  return gap <= 1 ? "ON_STREAK" : "BROKE_STREAK";
}

// The streak number to *display* right now — zeroes out once a full day
// has been missed, even if no workout has completed yet today to trigger
// a recompute.
export function effectiveCurrentStreak(user: { currentStreak: number; lastActiveDate: Date | null }): number {
  return classifyStreakState(user) === "BROKE_STREAK" ? 0 : user.currentStreak;
}
