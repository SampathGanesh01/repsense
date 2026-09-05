import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function POST() {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const workout = await db.workout.create({ data: { userId: user.id } });
  return NextResponse.json({ id: workout.id });
}
