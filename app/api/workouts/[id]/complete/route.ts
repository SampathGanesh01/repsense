import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { recomputeStreak, utcDateOnly } from "@/lib/streak";
import { logEvent } from "@/lib/analytics";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { id } = await params;
  const workout = await db.workout.findUnique({ where: { id } });
  if (!workout || workout.userId !== user.id) {
    return NextResponse.json({ error: "Workout not found." }, { status: 404 });
  }
  if (workout.completedAt) {
    return NextResponse.json({ id: workout.id, completedAt: workout.completedAt });
  }

  const completedAt = new Date();
  await db.workout.update({ where: { id }, data: { completedAt } });

  const dayNumber = Math.floor((completedAt.getTime() - user.createdAt.getTime()) / 86_400_000) + 1;
  await logEvent(user.id, "workout_completed", { workoutId: id, dayNumber });

  await recomputeStreak(user.id);

  // If there's a nudge for today that hasn't been credited yet, this
  // workout is the "nudge led to a same-day completion" case.
  const today = utcDateOnly(completedAt);
  const todaysNudge = await db.nudge.findUnique({ where: { userId_date: { userId: user.id, date: today } } });
  if (todaysNudge && !todaysNudge.resultedInWorkout) {
    await db.nudge.update({ where: { id: todaysNudge.id }, data: { resultedInWorkout: true } });
    await logEvent(user.id, "nudge_same_day_completion", { nudgeId: todaysNudge.id, workoutId: id });
  }

  return NextResponse.json({ id: workout.id, completedAt });
}
