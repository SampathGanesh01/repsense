import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { isExerciseKey } from "@/lib/pose/exercises";

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const { workoutId, exercise, repCount, formCueCounts, lowConfidenceSec } = body ?? {};

  if (typeof workoutId !== "string" || typeof exercise !== "string" || !isExerciseKey(exercise)) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  if (typeof repCount !== "number" || repCount < 0) {
    return NextResponse.json({ error: "Invalid rep count." }, { status: 400 });
  }

  const workout = await db.workout.findUnique({ where: { id: workoutId } });
  if (!workout || workout.userId !== user.id) {
    return NextResponse.json({ error: "Workout not found." }, { status: 404 });
  }

  const set = await db.set.create({
    data: {
      workoutId,
      exercise,
      repCount,
      formCueCounts: typeof formCueCounts === "object" && formCueCounts !== null ? formCueCounts : {},
      lowConfidenceSec: typeof lowConfidenceSec === "number" ? Math.max(0, Math.round(lowConfidenceSec)) : 0,
    },
  });

  return NextResponse.json({ id: set.id });
}
