import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";

// Pilot instrumentation only: "that rep count looked wrong" button. Not
// surfaced back to the user beyond a confirmation — this is for you to
// review later, not a user-facing analytics feature.
export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const setId = typeof body?.setId === "string" ? body.setId : null;
  if (!setId) return NextResponse.json({ error: "setId is required." }, { status: 400 });

  const set = await db.set.findUnique({ where: { id: setId }, include: { workout: true } });
  if (!set || set.workout.userId !== user.id) {
    return NextResponse.json({ error: "Set not found." }, { status: 404 });
  }

  const flag = await db.miscountFlag.create({
    data: { userId: user.id, setId: set.id, exercise: set.exercise },
  });

  return NextResponse.json({ id: flag.id });
}
