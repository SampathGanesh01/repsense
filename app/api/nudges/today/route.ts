import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ensureTodayNudge } from "@/lib/nudges/rules";
import { logEvent } from "@/lib/analytics";

export async function GET() {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const nudge = await ensureTodayNudge(user);

  if (!nudge.seenAt) {
    await db.nudge.update({ where: { id: nudge.id }, data: { seenAt: new Date() } });
    await logEvent(user.id, "nudge_seen", { nudgeId: nudge.id });
  }

  return NextResponse.json({ message: nudge.message, streakState: nudge.streakState });
}
