import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";

// Pilot instrumentation only: "request an exercise" button. Not surfaced
// back to the user beyond a thank-you — this is for you to review later
// (also listed in /admin), not a user-facing feature list.
export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const exerciseName = typeof body?.exerciseName === "string" ? body.exerciseName.trim() : "";
  if (!exerciseName) return NextResponse.json({ error: "Exercise name is required." }, { status: 400 });

  const videoUrlRaw = typeof body?.videoUrl === "string" ? body.videoUrl.trim() : "";
  const videoUrl = videoUrlRaw.length > 0 ? videoUrlRaw : null;

  const request = await db.exerciseRequest.create({
    data: { userId: user.id, exerciseName, videoUrl },
  });

  return NextResponse.json({ id: request.id });
}
