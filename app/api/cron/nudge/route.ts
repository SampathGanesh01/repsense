import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureTodayNudge } from "@/lib/nudges/rules";

// Scheduled once a day (see vercel.json) to pre-generate every user's
// nudge. Nudges are also generated lazily on dashboard load, so this isn't
// strictly required for the in-app-only pilot — but it keeps nudge
// generation on a real "daily" cadence and means the same code path
// already supports adding a push/email channel later without restructuring.
export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const users = await db.user.findMany({ select: { id: true, currentStreak: true, lastActiveDate: true } });
  let count = 0;
  for (const user of users) {
    await ensureTodayNudge(user);
    count += 1;
  }

  return NextResponse.json({ generated: count });
}
